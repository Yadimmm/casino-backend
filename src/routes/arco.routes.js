import { Router } from 'express';
import { prisma } from '../lib/prisma.js';

export const arcoRouter = Router();

// ---- DERECHO DE ACCESO: "muéstrame todo lo que tienes de mí" ----
arcoRouter.get('/arco/acceso', async (req, res) => {
  try {
    const sesionId = req.sesion.id;
    const participanteId = req.sesion.participanteId;

    // Traer TODO lo asociado a este participante
    const participante = await prisma.participante.findUnique({
      where: { id: participanteId },
      include: {
        cuentas: true,
        sesiones: {
          include: {
            datosPasivos: true,
            permisos: true,
            consentimientos: true,
          },
        },
      },
    });

    if (!participante) {
      return res.status(404).json({ error: 'participante_no_encontrado' });
    }

    // Registrar que se ejerció el derecho (la ley pide constancia)
    await prisma.auditoriaAcceso.create({
      data: {
        accion: 'arco_acceso',
        entidad: 'participante',
        registroId: participanteId,
      },
    });

    return res.json({
      derecho: 'acceso',
      generadoAt: new Date().toISOString(),
      datos: participante,
    });

  } catch (error) {
    console.error('[arco-acceso] error:', error);
    return res.status(500).json({ error: 'error_interno' });
  }
});

// ---- DERECHO DE CANCELACIÓN: "bórralo todo" ----
arcoRouter.delete('/arco/cancelacion', async (req, res) => {
  try {
    const participanteId = req.sesion.participanteId;

    // Registrar en auditoría ANTES de borrar (después ya no existirá)
    await prisma.auditoriaAcceso.create({
      data: {
        accion: 'arco_cancelacion',
        entidad: 'participante',
        registroId: participanteId,
      },
    });

    // Borrar el participante. El ON DELETE CASCADE se encarga
    // de arrastrar sesiones, datos pasivos, permisos, consentimientos...
    await prisma.participante.delete({
      where: { id: participanteId },
    });

    return res.json({
      derecho: 'cancelacion',
      mensaje: 'Todos tus datos han sido eliminados de forma permanente.',
      participanteId,
    });

  } catch (error) {
    console.error('[arco-cancelacion] error:', error);
    return res.status(500).json({ error: 'error_interno' });
  }
});

// ---- DERECHO DE RECTIFICACIÓN: "corrige este dato mío" ----
arcoRouter.patch('/arco/rectificacion', async (req, res) => {
  try {
    const participanteId = req.sesion.participanteId;
    const { alias } = req.body;

    // Solo permitimos rectificar campos seguros (no ids, no fechas)
    if (typeof alias !== 'string' || alias.trim().length === 0) {
      return res.status(400).json({ error: 'alias_invalido' });
    }

    // Guardar el valor anterior para la auditoría
    const antes = await prisma.participante.findUnique({
      where: { id: participanteId },
      select: { alias: true },
    });

    const actualizado = await prisma.participante.update({
      where: { id: participanteId },
      data: { alias: alias.trim().slice(0, 100) },
    });

    // Registrar en auditoría, con el antes y el después
    await prisma.auditoriaAcceso.create({
      data: {
        accion: 'arco_rectificacion',
        entidad: 'participante',
        registroId: participanteId,
        datosAntes: { alias: antes?.alias },
        datosDespues: { alias: actualizado.alias },
      },
    });

    return res.json({
      derecho: 'rectificacion',
      mensaje: 'Tu dato ha sido actualizado.',
      alias: actualizado.alias,
    });

  } catch (error) {
    console.error('[arco-rectificacion] error:', error);
    return res.status(500).json({ error: 'error_interno' });
  }
});

// ---- DERECHO DE OPOSICIÓN: "deja de procesar mis datos" ----
arcoRouter.post('/arco/oposicion', async (req, res) => {
  try {
    const participanteId = req.sesion.participanteId;
    const sesionId = req.sesion.id;

    // Marcar al participante como inactivo y cerrar su sesión.
    // No se borran datos (eso es cancelación), solo se detiene el tratamiento.
    await prisma.$transaction([
      prisma.participante.update({
        where: { id: participanteId },
        data: { estado: 'oposicion' },
      }),
      prisma.sesion.update({
        where: { id: sesionId },
        data: { finalizadaAt: new Date() },
      }),
      prisma.auditoriaAcceso.create({
        data: {
          accion: 'arco_oposicion',
          entidad: 'participante',
          registroId: participanteId,
        },
      }),
    ]);

    return res.json({
      derecho: 'oposicion',
      mensaje: 'Se ha detenido el tratamiento de tus datos. Tu sesión ha finalizado.',
    });

  } catch (error) {
    console.error('[arco-oposicion] error:', error);
    return res.status(500).json({ error: 'error_interno' });
  }
});