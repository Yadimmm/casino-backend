import { Router } from 'express';
import { prisma } from '../lib/prisma.js';

export const permisoRouter = Router();

// Listas blancas: solo aceptamos valores conocidos
const TIPOS_VALIDOS = new Set([
  'cookies', 'notificaciones', 'ubicacion', 'microfono', 'camara',
]);
const ESTADOS_VALIDOS = new Set([
  'concedido', 'denegado', 'ignorado', 'revocado',
]);

permisoRouter.post('/permiso', async (req, res) => {
  try {
    const sesionId = req.sesion.id;
    const { tipo, estado, msDecision } = req.body;

    // 1. Validar el tipo de permiso (lista blanca)
    if (!TIPOS_VALIDOS.has(tipo)) {
      return res.status(400).json({ error: 'tipo_no_valido' });
    }

    // 2. Validar el estado (lista blanca)
    if (!ESTADOS_VALIDOS.has(estado)) {
      return res.status(400).json({ error: 'estado_no_valido' });
    }

    // 3. Validar ms_decision: número razonable, o null
    let msLimpio = null;
    if (Number.isFinite(msDecision) && msDecision >= 0 && msDecision <= 300000) {
      msLimpio = Math.round(msDecision);
    }

    // 4. Guardar el permiso
    const permiso = await prisma.permiso.create({
      data: {
        sesionId,
        tipo,
        estado,
        msDecision: msLimpio,
        respondidoAt: new Date(),
      },
    });

    return res.status(201).json({ ok: true, permisoId: permiso.id });

  } catch (error) {
    console.error('[permiso] error:', error);
    return res.status(500).json({ error: 'error_interno' });
  }
});