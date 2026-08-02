import { prisma } from '../src/lib/prisma.js';

// Cada entrada conecta una CLAVE de dato pasivo con su explicación.
// El expediente cruzará los datos capturados contra este catálogo.
const riesgos = [
  {
    codigo: 'webgl-gpu',
    categoria: 'grafico',
    nivel: 'medio',
    titulo: 'Modelo de tu tarjeta gráfica',
    descripcion: 'Tu navegador revela el modelo exacto de tu GPU sin pedirte permiso. Combinado con otros datos, ayuda a identificarte de forma única.',
    recomendacion: 'Extensiones anti-fingerprinting pueden falsear este dato. Firefox tiene protección integrada en modo estricto.',
  },
  {
    codigo: 'canvas-hash',
    categoria: 'grafico',
    nivel: 'alto',
    titulo: 'Huella de renderizado (canvas)',
    descripcion: 'La forma en que tu dispositivo dibuja gráficos es casi única. Esta "huella de canvas" te identifica aunque borres las cookies.',
    recomendacion: 'Es de las técnicas más difíciles de evadir. Navegadores como Tor la neutralizan añadiendo ruido aleatorio.',
  },
  {
    codigo: 'screen-resolucion',
    categoria: 'pantalla',
    nivel: 'bajo',
    titulo: 'Resolución de pantalla',
    descripcion: 'Tu resolución y profundidad de color son visibles para cualquier sitio. Por sí solas no te identifican, pero suman a tu huella.',
    recomendacion: 'Difícil de ocultar sin afectar la experiencia. Su impacto es bajo comparado con canvas o WebGL.',
  },
  {
    codigo: 'hw-nucleosCpu',
    categoria: 'hardware',
    nivel: 'medio',
    titulo: 'Núcleos de tu procesador',
    descripcion: 'El número de núcleos de tu CPU se expone vía JavaScript. Es un dato estable que ayuda a distinguir tu dispositivo.',
    recomendacion: 'Algunos navegadores permiten limitar o falsear este valor mediante configuración avanzada.',
  },
  {
    codigo: 'locale-zonaHoraria',
    categoria: 'ubicacion',
    nivel: 'medio',
    titulo: 'Tu zona horaria',
    descripcion: 'Tu zona horaria revela aproximadamente en qué región del mundo estás, sin haberte pedido permiso de ubicación.',
    recomendacion: 'Una VPN no cambia tu zona horaria del sistema. Hay que ajustarla manualmente o usar navegadores especializados.',
  },
];

async function main() {
  console.log('Poblando catálogo de riesgos...');

  for (const riesgo of riesgos) {
    await prisma.catalogoRiesgo.upsert({
      where: { codigo: riesgo.codigo },
      update: riesgo,
      create: riesgo,
    });
  }

  const total = await prisma.catalogoRiesgo.count();
  console.log(`Catálogo listo: ${total} riesgos registrados.`);
}

main()
  .catch((e) => console.error('Error en seed:', e))
  .finally(() => prisma.$disconnect());