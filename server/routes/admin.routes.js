import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';

// 1. Criamos o nosso "mini-gerenciador" de rotas
const router = express.Router();

router.get('/', authMiddleware, async (req, res) => {
    res.json({
        mensagem: 'Bem-vindo ao Dashboard Admin'
    })
});

export default router; // ← estava faltando isso