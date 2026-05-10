import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import dotenv from 'dotenv';

dotenv.config();

// 1. Configurar o Cloudinary com as tuas chaves
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// 2. Configurar o destino (Storage)
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'suki-doces-produtos', // Cria uma pasta com este nome lá no Cloudinary
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'avif'],
    // transformation: [{ width: 800, height: 800, crop: 'limit' }] // Opcional: redimensiona imagens gigantes automaticamente
  }
});

// 3. Exportar o upload
export const upload = multer({ storage: storage });