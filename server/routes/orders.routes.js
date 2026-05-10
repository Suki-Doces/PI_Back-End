import express from 'express';
import { prisma } from '../lib/prisma.js';
import { authMiddleware, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

// GET / — lista todos os pedidos (admin)
// lista-pedidos.component.ts chama: GET /admin/pedidos
router.get('/', authMiddleware, adminOnly, async (req, res) => {
  try {
    const pedidos = await prisma.pedidos.findMany({
      orderBy: { data_pedido: 'desc' },
      include: {
        usuario: { select: { nome: true, email: true } },
        itens_pedido: {
          include: { produtos: { select: { nome: true } } }
        }
      }
    });

    return res.json(pedidos.map(p => ({
      id_pedido: p.id_pedido,
      cliente_nome: p.usuario?.nome || 'Cliente',
      data_pedido: p.data_pedido,
      status: p.status,
      valor_total: Number(p.valor_total),
      metodo_pagamento: p.metodo_pagamento,
      itens: p.itens_pedido.map(i => ({
        nome: i.produtos?.nome,
        quantidade: i.quantidade
      }))
    })));
  } catch (error) {
    console.error('Erro ao listar pedidos:', error);
    res.status(500).json({ mensagem: 'Erro ao buscar pedidos' });
  }
});

// POST / — cria novo pedido (cliente autenticado)
// CORRIGIDO: adicionado authMiddleware — antes qualquer um podia criar pedidos
router.post('/', authMiddleware, async (req, res) => {
  const { produtos, metodo_pagamento } = req.body;
  // CORRIGIDO: pega o usuário do token JWT, não do body
  const usuarioId = req.usuario.id;

  if (!produtos || produtos.length === 0 || !metodo_pagamento) {
    return res.status(400).json({ mensagem: 'Dados obrigatórios ausentes.' });
  }

  try {
    const idsProdutos = produtos.map(item => item.id_produto);
    const produtosDoBanco = await prisma.produtos.findMany({
      where: { id_produto: { in: idsProdutos } }
    });

    if (produtosDoBanco.length !== produtos.length) {
      return res.status(400).json({ mensagem: 'Um ou mais produtos não foram encontrados.' });
    }

    let valor_total = 0;
    const itensParaSalvar = [];

    for (const itemRequest of produtos) {
      const produtoReal = produtosDoBanco.find(p => p.id_produto === itemRequest.id_produto);
      const precoNumber = Number(produtoReal.preco);
      valor_total += precoNumber * itemRequest.quantidade;
      itensParaSalvar.push({
        id_produto: itemRequest.id_produto,
        quantidade: itemRequest.quantidade,
        preco_unitario: precoNumber
      });
    }

    // REGRA DE NEGÓCIO: frete grátis acima de R$50
    // (frete não é salvo no pedido, mas é considerado no frontend)

    const novoPedido = await prisma.pedidos.create({
      data: {
        id_usuario: usuarioId,
        valor_total,
        status: 'pendente',
        metodo_pagamento,
        itens_pedido: { create: itensParaSalvar }
      },
      include: { itens_pedido: true }
    });

    // Notifica o admin sobre o novo pedido
    // Busca o primeiro admin para notificar
    const admin = await prisma.administradores.findFirst();
    if (admin) {
      await prisma.notificacoes.create({
        data: {
          id_usuario: admin.id_admin,
          titulo: 'Novo Pedido Recebido!',
          mensagem: `Novo pedido #${novoPedido.id_pedido} de R$ ${valor_total.toFixed(2)}.`,
          tipo: 'venda',
          lido: false
        }
      });
    }

    return res.status(201).json({
      mensagem: 'Pedido realizado com sucesso!',
      pedido: novoPedido
    });
  } catch (error) {
    console.error('Erro no checkout:', error);
    return res.status(500).json({ mensagem: 'Erro interno ao processar pedido' });
  }
});

export default router;