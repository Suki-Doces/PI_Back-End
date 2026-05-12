import express from 'express';
import { prisma } from '../lib/prisma.js';
import { authMiddleware, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

// ==========================================
// GET / — lista todos os pedidos (Admin)
// ==========================================
router.get('/', authMiddleware, adminOnly, async (req, res) => {
  try {
    const pedidos = await prisma.pedidos.findMany({
      orderBy: { data_pedido: 'desc' },
      include: {
        usuario: { select: { nome: true, email: true } },
        itens_pedido: {
          include: { produtos: { select: { nome: true, imagem: true } } }
        }
      }
    });

    return res.json(pedidos.map(p => ({
      id_pedido: p.id_pedido,
      cliente_nome: p.usuario?.nome || 'Cliente',
      cliente_email: p.usuario?.email || '',
      data_pedido: p.data_pedido,
      status: p.status,
      valor_total: Number(p.valor_total),
      metodo_pagamento: p.metodo_pagamento,
      itens: p.itens_pedido.map(i => ({
        nome: i.produtos?.nome,
        quantidade: i.quantidade,
        imagem: i.produtos?.imagem
      }))
    })));
  } catch (error) {
    console.error('Erro ao listar pedidos:', error);
    res.status(500).json({ mensagem: 'Erro ao buscar pedidos' });
  }
});

// ==========================================
// POST / — cria novo pedido (cliente autenticado)
// ADICIONADO: validação de cupom real da tabela cupons
// CORRIGIDO: authMiddleware adicionado
// ==========================================
router.post('/', authMiddleware, async (req, res) => {
  const { produtos, metodo_pagamento, codigo_cupom } = req.body;
  const usuarioId = req.usuario.id; // CORRIGIDO: vem do token, não do body

  if (!produtos || produtos.length === 0 || !metodo_pagamento) {
    return res.status(400).json({ mensagem: 'Dados obrigatórios ausentes.' });
  }

  try {
    // 1. Buscar preços reais no banco (segurança: nunca confiar no preço do frontend)
    const idsProdutos = produtos.map(item => item.id_produto);
    const produtosDoBanco = await prisma.produtos.findMany({
      where: { id_produto: { in: idsProdutos } }
    });

    if (produtosDoBanco.length !== produtos.length) {
      return res.status(400).json({ mensagem: 'Um ou mais produtos não encontrados.' });
    }

    // 2. Verificar estoque de cada item
    for (const itemRequest of produtos) {
      const produtoReal = produtosDoBanco.find(p => p.id_produto === itemRequest.id_produto);
      if ((produtoReal.quantidade ?? 0) < itemRequest.quantidade) {
        return res.status(400).json({
          mensagem: `Estoque insuficiente para o produto: ${produtoReal.nome}`
        });
      }
    }

    // 3. Calcular subtotal
    let subtotal = 0;
    const itensParaSalvar = [];

    for (const itemRequest of produtos) {
      const produtoReal = produtosDoBanco.find(p => p.id_produto === itemRequest.id_produto);
      const preco = Number(produtoReal.preco);
      subtotal += preco * itemRequest.quantidade;
      itensParaSalvar.push({
        id_produto: itemRequest.id_produto,
        quantidade: itemRequest.quantidade,
        preco_unitario: preco
      });
    }

    // 4. ADICIONADO: Validar cupom real da tabela cupons
    let desconto = 0;
    let cupomUsado = null;

    if (codigo_cupom) {
      const cupom = await prisma.cupons.findUnique({
        where: { codigo: codigo_cupom.toUpperCase().trim() }
      });

      if (!cupom) {
        return res.status(400).json({ mensagem: 'Cupom inválido.' });
      }

      if (!cupom.ativo) {
        return res.status(400).json({ mensagem: 'Este cupom não está mais ativo.' });
      }

      if (cupom.validade && new Date(cupom.validade) < new Date()) {
        return res.status(400).json({ mensagem: 'Este cupom está expirado.' });
      }

      // Aplica desconto conforme o tipo
      if (cupom.tipo === 'percentual') {
        desconto = subtotal * (Number(cupom.valor) / 100);
      } else if (cupom.tipo === 'valor_fixo') {
        desconto = Math.min(Number(cupom.valor), subtotal); // não pode ser maior que o total
      }

      cupomUsado = cupom;
    }

    // 5. Calcular valor final
    const valor_total = Math.max(0, subtotal - desconto);

    // 6. Criar pedido + itens no banco
    const novoPedido = await prisma.pedidos.create({
      data: {
        id_usuario: usuarioId,
        valor_total,
        status: 'pendente',
        metodo_pagamento,
        ...(cupomUsado && { id_cupom: cupomUsado.id_cupom }),
        itens_pedido: { create: itensParaSalvar }
      },
      include: { itens_pedido: true }
    });

    // 7. Descontar estoque de cada produto
    for (const item of itensParaSalvar) {
      await prisma.produtos.update({
        where: { id_produto: item.id_produto },
        data: { quantidade: { decrement: item.quantidade } }
      });
    }

    // 8. Notificar admin sobre novo pedido
    const admin = await prisma.administradores.findFirst();
    if (admin) {
      await prisma.notificacoes.create({
        data: {
          id_usuario: admin.id_admin,
          titulo: 'Novo Pedido Recebido!',
          mensagem: `Pedido #${novoPedido.id_pedido} criado — R$ ${valor_total.toFixed(2)}${desconto > 0 ? ` (desconto: R$ ${desconto.toFixed(2)})` : ''}.`,
          tipo: 'venda',
          lido: false
        }
      });
    }

    return res.status(201).json({
      mensagem: 'Pedido realizado com sucesso!',
      pedido: novoPedido,
      resumo: {
        subtotal,
        desconto,
        valor_total,
        cupom_aplicado: cupomUsado?.codigo || null
      }
    });

  } catch (error) {
    console.error('Erro no checkout:', error);
    return res.status(500).json({ mensagem: 'Erro interno ao processar pedido' });
  }
});

export default router;