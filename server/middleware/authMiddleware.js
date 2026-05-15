import jwt from 'jsonwebtoken';
import { AppError } from './errorHandler.js';

export const authMiddleware = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      throw new AppError('Token not provided', 401);
    }

    // CORRIGIDO: Removido o fallback inseguro 'seu-secret-key'
    // Se JWT_SECRET não estiver no .env, o servidor deve falhar em vez de usar chave fraca
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      // Normaliza erros JWT para respostas mais amigáveis
      if (err.name === 'TokenExpiredError') return next(new AppError('Token expired', 401));
      if (err.name === 'JsonWebTokenError') return next(new AppError('Invalid token', 401));
      return next(err);
    }

    // CORRIGIDO: era req.user, agora req.usuario
    // cart.routes.js e notification.routes.js usam req.usuario
    req.usuario = decoded;
    next();
  } catch (error) {
    next(error);
  }
};

export const optionalAuth = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.usuario = decoded; // CORRIGIDO: era req.user
    }
  } catch (error) {
    // Continua sem usuário autenticado
  }
  next();
};

export const adminOnly = (req, res, next) => {
  // CORRIGIDO: era req.user, agora req.usuario
  if (!req.usuario || req.usuario.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};
