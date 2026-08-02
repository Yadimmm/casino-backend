import { Router } from 'express';
import { prisma } from '../lib/prisma.js';

export const publicoRouter = Router();

// ---- Lista de juegos (público) ----
publicoRouter.get('/juegos', async (req, res) => {
  try {
    const soloActivos = req.query.solo_activos === 'true';

    const juegos = await prisma.juego.findMany({
      where: soloActivos ? { activo: true } : {},
      orderBy: { orden: 'asc' },
    });

    return res.json({
      juegos,
      paginacion: { total: juegos.length },
    });
  } catch (error) {
    console.error('[juegos] error:', error);
    return res.status(500).json({ error: 'error_interno' });
  }
});

// ---- Conteo de usuarios activos (solo el número, no la lista) ----
publicoRouter.get('/usuarios', async (req, res) => {
  try {
    const total = await prisma.participante.count({
      where: { estado: 'activo' },
    });
    return res.json({ paginacion: { total } });
  } catch (error) {
    console.error('[usuarios] error:', error);
    return res.status(500).json({ error: 'error_interno' });
  }
});

// ---- Conteo de sesiones activas (solo el número) ----
publicoRouter.get('/sesiones', async (req, res) => {
  try {
    const total = await prisma.sesion.count({
      where: { finalizadaAt: null },
    });
    return res.json({ paginacion: { total } });
  } catch (error) {
    console.error('[sesiones] error:', error);
    return res.status(500).json({ error: 'error_interno' });
  }
});