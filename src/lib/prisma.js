import { PrismaClient } from '@prisma/client';

// Patrón singleton: una sola instancia del cliente para toda la app.
// Evita abrir conexiones nuevas cada vez que el servidor se reinicia.
const globalParaPrisma = globalThis;

export const prisma =
  globalParaPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalParaPrisma.prisma = prisma;
}