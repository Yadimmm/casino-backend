import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { calcularHashHuella, guardarDatosPasivos } from '../services/huella.service.js';
import { obtenerIp, hashearIp, derivarCiudad } from '../services/geo.service.js';
import crypto from 'node:crypto';

export const sesionRouter = Router();

sesionRouter.post('/sesion/iniciar', async (req, res) => {
  try {
    const { perfil, aceptado, alcance, msDecision } = req.body;

    // 1. No se entra sin aceptar el consentimiento
    if (aceptado !== true) {
      return res.status(403).json({ error: 'consentimiento_no_otorgado' });
    }

    if (!perfil || typeof perfil !== 'object') {
      return res.status(400).json({ error: 'perfil_ausente' });
    }

    const hashHuella = calcularHashHuella(perfil);

    // Capturar la IP y derivar ciudad ANTES de crear la sesión
    const ip = obtenerIp(req);
    const ipHash = hashearIp(ip);
    const ciudadIp = derivarCiudad(ip);

    // 2. TRANSACCIÓN: o se crea todo, o no se crea nada
    const resultado = await prisma.$transaction(async (tx) => {

      // a) Crear el participante (persona real)
      const participante = await tx.participante.create({
        data: {
          alias: 'Participante ' + Date.now(),
          rangoEdad: 'no_especificado',
          estado: 'activo',
        },
      });

      // b) Crear su cuenta ficticia de casino
      const cuenta = await tx.cuenta.create({
        data: {
          participanteId: participante.id,
          emailHash: crypto.randomUUID(),
          passwordHash: crypto.randomUUID(),
          rol: 'jugador',
        },
      });

      // c) Reconocer o crear la huella
      const huella = await tx.huella.upsert({
        where: { hashHuella },
        update: { visitas: { increment: 1 } },
        create: {
          hashHuella,
          canvasHash:  String(perfil['canvas.hash']        ?? 'na'),
          gpuWebgl:    String(perfil['webgl.gpu']          ?? 'na'),
          resolucion:  String(perfil['screen.resolucion']  ?? 'na'),
          zonaHoraria: String(perfil['locale.zonaHoraria'] ?? 'na'),
        },
      });

      // d) Crear la sesión que une todo
      const sesion = await tx.sesion.create({
        data: {
          participanteId: participante.id,
          cuentaId: cuenta.id,
          huellaId: huella.id,
          estado: 'abierta',
          versionLaboratorio: '1.0',
          userAgent: String(perfil['navegador.userAgent'] ?? 'na'),
          ipHash,        
          ciudadIp,    
        },
      });

      // e) Registrar el consentimiento
      await tx.consentimiento.create({
        data: {
          sesionId: sesion.id,
          versionAviso: '1.0',
          aceptado: true,
          alcance: alcance ?? {},
          msDecision: Number.isFinite(msDecision) ? msDecision : null,
          respondidoAt: new Date(),
        },
      });

      return { sesion, huella };
    });
    // Guardar los datos pasivos de esta sesión (el "golpe" del laboratorio)
    await guardarDatosPasivos(resultado.sesion.id, perfil);
    // 3. Devolver el sesionId para las siguientes peticiones
    return res.json({
      sesionId: resultado.sesion.id,
      esRetorno: resultado.huella.visitas > 1,
      visitas: resultado.huella.visitas,
    });

  } catch (error) {
    console.error('[sesion] error:', error);
    return res.status(500).json({ error: 'error_interno' });
  }
});