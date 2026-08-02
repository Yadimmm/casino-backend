import { Router } from 'express';
import { registrarHuella } from '../services/huella.service.js';

export const huellaRouter = Router();

huellaRouter.post('/huella', async (req, res) => {
  try {
    // 1. El navegador manda su perfil en el cuerpo de la petición
    const { perfil } = req.body;

    // 2. Validar que llegó algo usable
    if (!perfil || typeof perfil !== 'object') {
      return res.status(400).json({ error: 'perfil_ausente' });
    }

    // 3. Llamar a tu servicio: calcula hash, busca, reconoce o crea
    const resultado = await registrarHuella(perfil);

    // 4. Responder según sea retorno o primera vez
    return res.json({
      esRetorno: resultado.esRetorno,
      visitas: resultado.visitas,
      mensaje: resultado.esRetorno
        ? `Bienvenido de vuelta. Llevas ${resultado.visitas} visitas.`
        : 'Primera vez que te vemos. Bienvenido.',
    });

  } catch (error) {
    console.error('[huella] error:', error);
    return res.status(500).json({ error: 'error_interno' });
  }
});