import express from 'express';
// No ES6, precisamos colocar o .js no final do arquivo que estamos importando!
import * as categoriaController from '../controller/categoria.controller.js';
import { authMiddleware, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

// Definindo os endpoints da API
router.get('/', authMiddleware, adminOnly, categoriaController.getCategorias);
router.post('/', authMiddleware, adminOnly, categoriaController.createCategoria);
router.put('/:id', authMiddleware, adminOnly, categoriaController.updateCategoria);
router.delete('/:id', authMiddleware, adminOnly, categoriaController.deleteCategoria);

export default router;