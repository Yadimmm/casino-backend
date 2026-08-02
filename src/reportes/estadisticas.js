import { prisma } from './lib/prisma.js';

async function main() {
  // Promedio de tiempo de decisión, por tipo de permiso
  const porTipo = await prisma.permiso.groupBy({
    by: ['tipo', 'estado'],
    _avg: { msDecision: true },
    _count: { id: true },
  });

  console.log('=== Tiempos de decisión por permiso ===\n');
  for (const fila of porTipo) {
    const ms = fila._avg.msDecision;
    const segundos = ms ? (ms / 1000).toFixed(2) + ' s' : 'sin dato';
    console.log(`${fila.tipo} (${fila.estado}): ${segundos} — ${fila._count.id} caso(s)`);
  }

  // Promedio general de aceptaciones
  const aceptados = await prisma.permiso.aggregate({
    where: { estado: 'concedido' },
    _avg: { msDecision: true },
  });

  const prom = aceptados._avg.msDecision;
  console.log('\n=== El número estrella ===');
  console.log('Tiempo promedio para CONCEDER:',
    prom ? (prom / 1000).toFixed(2) + ' segundos' : 'sin datos aún');
}

main()
  .catch((e) => console.error('Error:', e))
  .finally(() => prisma.$disconnect());