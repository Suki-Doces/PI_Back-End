import multer from 'multer';
import path from 'path';

// Configuração de onde e como salvar os arquivos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Aponta para a pasta 'uploads' que já criamos na raiz do projeto
    cb(null, 'uploads/'); 
  },
  filename: function (req, file, cb) {
    // Gera um nome único: Data atual + número aleatório + extensão original (.jpg, .png, etc.)
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

// Exporta o middleware pronto para uso nas rotas
export const upload = multer({ storage: storage });