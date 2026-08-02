import { prisma } from './lib/prisma.js';

async function main() {
  console.log('Creando una huella de prueba...');

  const huella = await prisma.huella.create({
    data: {
      hashHuella: 'prueba-' + Date.now(),
      canvasHash: 'abc123',
      gpuWebgl: 'Intel Iris Xe',
      resolucion: '1920x1080',
      zonaHoraria: 'America/Monterrey',
    },
  });

  console.log('¡Huella creada!');
  console.log(huella);

  const total = await prisma.huella.count();
  console.log('Total de huellas en la base:', total);
}

main()
  .catch((e) => console.error('Error:', e))
  .finally(() => prisma.$disconnect());