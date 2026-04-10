import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();

export default prisma;


//Pronto — sem `pool`, sem `testConnection`, só o essencial. O `server.js` já testa a conexão com `prisma.$connect()` então a função `testConnection` não é mais necessária.

// **Resumo das 3 correções agora:**

// 1. `package.json` → mude para `"nodemon server/server.js"`
// 2. `prisma.js` → remova tudo da `testConnection` e o `pool`, adicione os dois exports
// 3. Salve e o nodemon vai reiniciar automaticamente

// Depois disso você deve ver no terminal:
//```
// ✓ Conexão com o banco de dados bem-sucedida!
// ✓ Servidor da loja rodando na porta 3000