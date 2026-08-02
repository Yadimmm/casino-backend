import crypto from 'node:crypto';
import { prisma } from '../lib/prisma.js';

// Señales que entran al hash. Son ESTABLES: no cambian
// entre visitas del mismo navegador/dispositivo.
const SENALES_ESTABLES = [
  'canvas.hash',
  'webgl.gpu',
  'webgl.vendor',
  'screen.resolucion',
  'screen.profundidadColor',
  'locale.zonaHoraria',
  'locale.idioma',
  'hw.nucleosCpu',
  'hw.memoria',
  'hw.soporteTactil',
  'fonts.hash',
];

// Señales que se GUARDAN pero NO entran al hash, porque
// cambian solas y romperían el reconocimiento.
const SENALES_VOLATILES = [
  'bateria.nivel',
  'bateria.cargando',
  'red.tipo',
  'red.velocidad',
  'prefs.temaOscuro',
];

export function calcularHashHuella(perfil) {
  const normalizado = SENALES_ESTABLES
    .map((clave) => {
      const valor = perfil[clave];
      const limpio = (valor === undefined || valor === null || valor === '')
        ? 'na'
        : String(valor).trim().toLowerCase();
      return `${clave}=${limpio}`;
    })
    .join('|');

  return crypto.createHash('sha256').update(normalizado).digest('hex');
}

export async function registrarHuella(perfil) {
  // 1. Calcular el hash con la función que ya hiciste
  const hashHuella = calcularHashHuella(perfil);

  // 2. Buscar si ese hash ya existe en la base
  const existente = await prisma.huella.findUnique({
    where: { hashHuella },
  });

  // 3a. Si existe: es un RETORNO. Sumar una visita (atómico)
  if (existente) {
    const actualizada = await prisma.huella.update({
      where: { hashHuella },
      data: { visitas: { increment: 1 } },
    });
    return {
      huella: actualizada,
      esRetorno: true,
      visitas: actualizada.visitas,
    };
  }

  // 3b. Si no existe: es la PRIMERA vez. Crear la huella
  const nueva = await prisma.huella.create({
    data: {
      hashHuella,
      canvasHash:  String(perfil['canvas.hash']        ?? 'na'),
      gpuWebgl:    String(perfil['webgl.gpu']          ?? 'na'),
      resolucion:  String(perfil['screen.resolucion']  ?? 'na'),
      zonaHoraria: String(perfil['locale.zonaHoraria'] ?? 'na'),
    },
  });

  return {
    huella: nueva,
    esRetorno: false,
    visitas: 1,
  };
}

// Convierte el perfil crudo en filas de datos_pasivos.
// Recibe TODAS las señales (estables + volátiles) porque
// todas tienen valor para el expediente del participante.
export async function guardarDatosPasivos(sesionId, perfil) {
  const categoriaDe = (clave) => clave.split('.')[0];

  // Todas las señales que conocemos, estables y volátiles juntas
  const todasLasSenales = [...SENALES_ESTABLES, ...SENALES_VOLATILES];

  // Filtrar solo las que realmente llegaron en el perfil
  const senalesPresentes = todasLasSenales.filter(
    (clave) => perfil[clave] !== undefined && perfil[clave] !== null
  );

  // Guardar cada señal con upsert (por el UNIQUE compuesto)
  const operaciones = senalesPresentes.map((clave) =>
    prisma.datoPasivo.upsert({
      where: {
        sesionId_clave: { sesionId, clave },
      },
      update: {
        valor: String(perfil[clave]).slice(0, 500),
      },
      create: {
        sesionId,
        categoria: categoriaDe(clave),
        clave,
        valor: String(perfil[clave]).slice(0, 500),
      },
    })
  );

  // Ejecutar todas dentro de una transacción: todo o nada
  await prisma.$transaction(operaciones);

  return senalesPresentes.length;
}