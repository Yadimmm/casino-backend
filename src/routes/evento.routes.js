import { Router } from 'express';
import { prisma } from '../lib/prisma.js';

export const eventoRouter = Router();

// Lista blanca de tipos de evento válidos
const TIPOS_VALIDOS = new Set([
  'sesion.iniciada',
  'juego.abierto',
  'juego.jugada',
  'permiso.solicitado',
  'zona.bloqueada',
  'zona.desbloqueada',
  'expediente.abierto',
  'aviso.leido',
]);

const MAX_DETALLE_BYTES = 8 * 1024; // 8 KB por evento

eventoRouter.post('/evento', async (req, res) => {
  try {
    const sesionId = req.sesion.id;
    const { tipoEvento, detalle = {} } = req.body;

    // 1. Validar el tipo (lista blanca)
    if (!TIPOS_VALIDOS.has(tipoEvento)) {
      return res.status(400).json({ error: 'tipo_evento_no_valido' });
    }

    // 2. Validar que el detalle sea un objeto y no gigante
    if (typeof detalle !== 'object' || Array.isArray(detalle)) {
      return res.status(400).json({ error: 'detalle_no_valido' });
    }
    if (Buffer.byteLength(JSON.stringify(detalle), 'utf8') > MAX_DETALLE_BYTES) {
      return res.status(413).json({ error: 'detalle_excesivo' });
    }

    // 3. Guardar el evento en la bitácora
    const evento = await prisma.eventoNavegador.create({
      data: {
        sesionId,
        tipoEvento,
        detalle,
      },
    });

    return res.status(201).json({ ok: true, eventoId: evento.id });

  } catch (error) {
    console.error('[evento] error:', error);
    return res.status(500).json({ error: 'error_interno' });
  }
});

// ---- Consultar la línea de tiempo de una sesión ----
eventoRouter.get('/eventos', async (req, res) => {
  try {
    const sesionId = req.sesion.id;

    const eventos = await prisma.eventoNavegador.findMany({
      where: { sesionId },
      orderBy: { ocurridoAt: 'asc' },
    });

    return res.json({
      total: eventos.length,
      linea_de_tiempo: eventos,
    });

  } catch (error) {
    console.error('[eventos] error:', error);
    return res.status(500).json({ error: 'error_interno' });
  }
});