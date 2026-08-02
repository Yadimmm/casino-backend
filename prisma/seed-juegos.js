import { prisma } from '../src/lib/prisma.js';

const juegos = [
  { slug: 'tragamonedas', nombre: 'Tragamonedas', descripcion: 'Gira y gana con nuestras slots clásicas.', tecnologiaDemo: 'canvas', instruccionesSeguridad: 'Acceso libre, sin permisos.', orden: 1 },
  { slug: 'ruleta', nombre: 'Ruleta', descripcion: 'La clásica ruleta europea.', tecnologiaDemo: 'canvas', instruccionesSeguridad: 'Solicita permiso de notificaciones.', orden: 2 },
  { slug: 'rasca-y-gana', nombre: 'Rasca y Gana', descripcion: 'Raspa y descubre premios al instante.', tecnologiaDemo: 'canvas', instruccionesSeguridad: 'Acceso libre, sin permisos.', orden: 3 },
  { slug: 'blackjack-vip', nombre: 'Blackjack VIP', descripcion: 'Mesa VIP de 21 con crupier.', tecnologiaDemo: 'canvas', instruccionesSeguridad: 'Solicita permiso de ubicación.', orden: 4 },
  { slug: 'mesa-en-vivo', nombre: 'Mesa en Vivo', descripcion: 'Juega en tiempo real con crupier en vivo.', tecnologiaDemo: 'webrtc', instruccionesSeguridad: 'Solicita permiso de micrófono.', orden: 5 },
  { slug: 'cajero', nombre: 'Caja / Retiro', descripcion: 'Gestiona tus depósitos y retiros.', tecnologiaDemo: 'formulario', instruccionesSeguridad: 'Solicita permiso de cámara (KYC).', orden: 6 },
];

async function main() {
  console.log('Poblando juegos...');
  for (const juego of juegos) {
    await prisma.juego.upsert({
      where: { slug: juego.slug },
      update: juego,
      create: { ...juego, activo: true },
    });
  }
  const total = await prisma.juego.count();
  console.log(`Juegos listos: ${total}`);
}

main()
  .catch((e) => console.error('Error:', e))
  .finally(() => prisma.$disconnect());