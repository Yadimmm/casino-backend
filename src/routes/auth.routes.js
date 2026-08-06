import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import {
  hashearPassword, verificarPassword,
  hashearEmail, firmarToken,
} from '../services/auth.service.js';

export const authRouter = Router();

// ---- REGISTRO: crea cuenta + consentimiento en un solo paso ----
authRouter.post('/auth/registro', async (req, res) => {
  try {
    const { alias, correo, rango_edad, contrasena, aceptado } = req.body;

    // 1. Validaciones de entrada
    if (!alias || typeof alias !== 'string' || alias.trim().length === 0) {
      return res.status(400).json({ error: 'alias_invalido' });
    }
    if (!correo || typeof correo !== 'string' || !correo.includes('@')) {
      return res.status(400).json({ error: 'correo_invalido' });
    }
    if (!contrasena || contrasena.length < 6) {
      return res.status(400).json({ error: 'contrasena_muy_corta' });
    }
    // El consentimiento es obligatorio para registrarse
    if (aceptado !== true) {
      return res.status(403).json({ error: 'consentimiento_no_otorgado' });
    }

    const emailHash = hashearEmail(correo);

    // 2. ¿Ya existe una cuenta con ese correo?
    const existe = await prisma.cuenta.findUnique({
      where: { emailHash },
    });
    if (existe) {
      return res.status(409).json({ error: 'correo_ya_registrado' });
    }

    // 3. Hashear la contraseña (nunca se guarda en claro)
    const passwordHash = await hashearPassword(contrasena);

    // 4. Crear participante + cuenta en transacción
    const resultado = await prisma.$transaction(async (tx) => {
      const participante = await tx.participante.create({
        data: {
          alias: alias.trim().slice(0, 100),
          rangoEdad: rango_edad || 'no_especificado',
          estado: 'activo',
        },
      });

      const cuenta = await tx.cuenta.create({
        data: {
          participanteId: participante.id,
          emailHash,
          passwordHash,
          rol: 'jugador',
        },
      });

      return { participante, cuenta };
    });

    // 5. Registrar en auditoría
    await prisma.auditoriaAcceso.create({
      data: {
        accion: 'registro',
        entidad: 'participante',
        registroId: resultado.participante.id,
      },
    });

    return res.status(201).json({
      ok: true,
      mensaje: 'Cuenta creada. Ya puedes iniciar sesión.',
    });

  } catch (error) {
    console.error('[registro] error:', error);
    return res.status(500).json({ error: 'error_interno' });
  }
});

// ---- LOGIN: verifica credenciales y arranca sesión con fingerprinting ----
import { calcularHashHuella, guardarDatosPasivos } from '../services/huella.service.js';
import { obtenerIp, hashearIp, derivarCiudad } from '../services/geo.service.js';

authRouter.post('/auth/login', async (req, res) => {
  try {
    const { correo, contrasena, perfil } = req.body;

    // Validar que sean texto (previene error 500 e inyecciones NoSQL)
    if (
      typeof correo !== 'string' ||
      typeof contrasena !== 'string' ||
      correo.length === 0 ||
      contrasena.length === 0
    ) {
      return res.status(400).json({ error: 'credenciales_invalidas' });
    }

    const emailHash = hashearEmail(correo);

    // 1. Buscar la cuenta por el hash del correo
    const cuenta = await prisma.cuenta.findUnique({
      where: { emailHash },
      include: { participante: true },
    });

    // 2. Verificar credenciales (mensaje genérico para no revelar cuál falló)
    if (!cuenta || !(await verificarPassword(contrasena, cuenta.passwordHash))) {
      return res.status(401).json({ error: 'credenciales_invalidas' });
    }

    // 3. Capturar huella e IP para la nueva sesión
    const perfilSeguro = perfil && typeof perfil === 'object' ? perfil : {};
    const hashHuella = calcularHashHuella(perfilSeguro);
    const ip = obtenerIp(req);
    const ipHash = hashearIp(ip);
    const ciudadIp = derivarCiudad(ip);

    // 4. Crear la sesión (con huella) en transacción
    const resultado = await prisma.$transaction(async (tx) => {
      const huella = await tx.huella.upsert({
        where: { hashHuella },
        update: { visitas: { increment: 1 } },
        create: {
          hashHuella,
          canvasHash:  String(perfilSeguro['canvas.hash']        ?? 'na'),
          gpuWebgl:    String(perfilSeguro['webgl.gpu']          ?? 'na'),
          resolucion:  String(perfilSeguro['screen.resolucion']  ?? 'na'),
          zonaHoraria: String(perfilSeguro['locale.zonaHoraria'] ?? 'na'),
        },
      });

      const sesion = await tx.sesion.create({
        data: {
          participanteId: cuenta.participanteId,
          cuentaId: cuenta.id,
          huellaId: huella.id,
          estado: 'abierta',
          versionLaboratorio: '1.0',
          userAgent: String(perfilSeguro['navegador.userAgent'] ?? 'na'),
          ipHash,
          ciudadIp,
        },
      });

      return { sesion, huella };
    });

    // 5. Guardar datos pasivos
    await guardarDatosPasivos(resultado.sesion.id, perfilSeguro);

    // 6. Firmar el token JWT con el id de sesión y de participante
    const token = firmarToken({
      sesionId: resultado.sesion.id,
      participanteId: cuenta.participanteId,
    });

    // Enviar el token también como cookie httpOnly (protección contra robo por XSS)
    const esProd = process.env.NODE_ENV === 'production';
    res.cookie('token', token, {
      httpOnly: true,                       // JavaScript NO puede leerla
      secure: esProd,                       // requiere HTTPS en producción
      sameSite: esProd ? 'none' : 'lax',    // cross-domain en producción
      maxAge: 2 * 60 * 60 * 1000,           // 2 horas (igual que el JWT)
    });

    return res.json({
      token,
      participante: {
        id: cuenta.participante.id,
        alias: cuenta.participante.alias,
        estado: cuenta.participante.estado,
      },
      cuenta: { id: cuenta.id, rol: cuenta.rol },
      esRetorno: resultado.huella.visitas > 1,
      visitas: resultado.huella.visitas,
    });

  } catch (error) {
    console.error('[login] error:', error);
    return res.status(500).json({ error: 'error_interno' });
  }
});