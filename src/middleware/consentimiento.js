import { prisma } from '../lib/prisma.js';
import { verificarToken } from '../services/auth.service.js';

export async function exigirConsentimiento(req, res, next) {
  try {
    let sesionId = null;

    // Opción 0: token JWT en cookie httpOnly (método seguro, no accesible por JS)
    const tokenCookie = req.cookies?.token;
    if (tokenCookie) {
      try {
        const payload = verificarToken(tokenCookie);
        sesionId = payload.sesionId;
      } catch {
        // cookie inválida o expirada: seguimos a las otras opciones
      }
    }

    // Opción 1: token JWT en Authorization: Bearer (lo que manda el frontend actual)
    if (!sesionId) {
      const authHeader = req.get('Authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.slice(7); // quita "Bearer "
        try {
          const payload = verificarToken(token);
          sesionId = payload.sesionId;
        } catch {
          return res.status(401).json({ error: 'token_invalido' });
        }
      }
    }

    // Opción 2: X-Sesion-Id directo (para pruebas con curl)
    if (!sesionId) {
      sesionId = req.get('X-Sesion-Id') || req.body?.sesionId;
    }

    if (!sesionId) {
      return res.status(401).json({ error: 'sesion_ausente' });
    }

    // Buscar la sesión y su consentimiento (a través de la cuenta)
    const sesion = await prisma.sesion.findUnique({
      where: { id: sesionId },
      include: {
        cuenta: {
          include: { participante: true },
        },
      },
    });

    if (!sesion) {
      return res.status(401).json({ error: 'sesion_invalida' });
    }

    if (sesion.finalizadaAt !== null) {
      return res.status(403).json({ error: 'sesion_cerrada' });
    }

    // Guardar la sesión para las rutas siguientes
    req.sesion = sesion;
    next();

  } catch (error) {
    console.error('[consentimiento] error:', error);
    return res.status(500).json({ error: 'error_interno' });
  }
}