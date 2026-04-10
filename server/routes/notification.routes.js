import express from 'express';

const router = express.Router();

router.get('/', (req, res) => {
  res.status(200).json({
    mensagem: "Aqui vai listar as notificações da Suki Doces! (Em construção)"
  })
});

export default router; // ← adicione essa linha