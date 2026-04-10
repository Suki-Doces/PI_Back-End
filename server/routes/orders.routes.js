import express from 'express';
import prisma from '../lib/prisma.js';

const router = express.Router();

// 1. Buscar preços dos produtos
// 2. Calcular valor total
// 3. prisma.$transaction([...]) para criar pedido + itens
// 4. Retornar pedido criado com status 201

router.post('/', async (req, res) => {
  const { usuarioId, produtos } = req.body;
  if (!usuarioId || !produtos) {
    return res.status(400).json({ mensagem: 'Dados obrigatórios ausentes' });
  }
  // TODO: lógica de pedido aqui
  return res.status(201).json({ mensagem: 'Pedido recebido (em construção)' });
});

export default router; // ← essa linha estava faltando