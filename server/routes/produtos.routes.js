import express from 'express';
import prisma from '../lib/prisma.js';

const router = express.Router();

// ✅ PRIMEIRO as rotas específicas
router.get('/categorias', async (req, res, next) => {
  try {
    const categorias = await prisma.categorias.findMany({
      select: { id_categoria: true, nome: true, descricao: true },
      orderBy: { nome: 'asc' }
    });
    res.json({ categorias });
  } catch (error) {
    next(error);
  }
});

router.get('/', async (req, res, next) => {
  try {
    const produtos = await prisma.produtos.findMany();
    return res.status(200).json(produtos);
  } catch (error) {
    next(error);
  }
});

// EDITAR PRODUTO
router.put('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const { nome, descricao, preco, quantidade, id_categoria } = req.body;

    const produto = await prisma.produtos.findUnique({
      where: { id_produto: id }
    });

    if (!produto) {
      return res.status(404).json({ mensagem: 'Produto não encontrado' });
    }

    const atualizado = await prisma.produtos.update({
      where: { id_produto: id },
      data: {
        ...(nome && { nome }),
        ...(descricao && { descricao }),
        ...(preco && { preco }),
        ...(quantidade && { quantidade }),
        ...(id_categoria && { id_categoria })
      }
    });

    return res.status(200).json({
      mensagem: 'Produto atualizado com sucesso',
      produto: atualizado
    });
  } catch (error) {
    next(error);
  }
});

export default router;