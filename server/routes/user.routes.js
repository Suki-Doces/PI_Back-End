import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { register, login } from '../controller/auth.controller.js';

// 1. Criamos o nosso "mini-gerenciador" de rotas
const router = express.Router();

// 2. Trocamos o "app.post" por "router.post"
router.post('/registro', register);
router.post('/login', login);

// LOGOUT
router.post('/logout', authMiddleware, async (req, res) => {
  res.json({ mensagem: 'Logout realizado com sucesso' });
});

export default router;