import { Router } from 'express';
import { prisma } from '../lib/prisma.js';

export const expedienteRouter = Router();

expedienteRouter.get('/expediente', async (req, res) => {
  try {
    // El sesionId viene de la cabecera (lo puso la puerta)
    const sesionId = req.sesion.id;

    // 1. Traer todos los datos pasivos capturados en esta sesión
    const datosPasivos = await prisma.datoPasivo.findMany({
      where: { sesionId },
    });

    // 2. Traer todo el catálogo de riesgos
    const catalogo = await prisma.catalogoRiesgo.findMany();

    // 3. Cruzar: por cada dato capturado, buscar su riesgo
    const hallazgos = [];
    for (const dato of datosPasivos) {
      const codigo = dato.clave.replaceAll('.', '-');
      const riesgo = catalogo.find((r) => r.codigo === codigo);

    if (riesgo) {
    // Dato CON riesgo identificado
    hallazgos.push({
      dato: dato.clave,
      valorCapturado: dato.valor,
      titulo: riesgo.titulo,
      nivel: riesgo.nivel,
      explicacion: riesgo.descripcion,
      recomendacion: riesgo.recomendacion,
    });
    } else {
    // Dato SIN riesgo en el catálogo (se muestra, pero como "ninguno")
    hallazgos.push({
      dato: dato.clave,
      valorCapturado: dato.valor,
      titulo: dato.clave,
      nivel: 'ninguno',
      explicacion: 'Dato capturado sin riesgo identificado.',
      recomendacion: null,
    });
  }
}

    // 4. Contar por nivel de riesgo
    const resumen = {
      alto: hallazgos.filter((h) => h.nivel === 'alto').length,
      medio: hallazgos.filter((h) => h.nivel === 'medio').length,
      bajo: hallazgos.filter((h) => h.nivel === 'bajo').length,
    };

    // 5. Devolver el expediente completo
    return res.json({
      totalDatosCapturados: datosPasivos.length,
      totalConRiesgoIdentificado: hallazgos.length,
      resumen,
      hallazgos,
    });

  } catch (error) {
    console.error('[expediente] error:', error);
    return res.status(500).json({ error: 'error_interno' });
  }
});