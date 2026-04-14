import express from 'express';
import { loginAdmin } from '../controller/auth.controller.js'; // Importa a função nova
import { authMiddleware, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

// Porta de entrada pública para o dono da loja
router.post('/login', loginAdmin);

// === Daqui pra baixo ficam as rotas protegidas do admin ===
// Exemplo da sua rota de dashboard:
router.get('/', authMiddleware, adminOnly, async (req, res) => {
  res.json({ mensagem: 'Bem-vindo ao Dashboard Admin' });
});

export default router;