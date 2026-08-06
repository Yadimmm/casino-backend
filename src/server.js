import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { huellaRouter } from './routes/huella.routes.js';
import { sesionRouter } from './routes/sesion.routes.js';
import { exigirConsentimiento } from './middleware/consentimiento.js';
import { expedienteRouter } from './routes/expediente.routes.js';
import { permisoRouter } from './routes/permiso.routes.js';
import { arcoRouter } from './routes/arco.routes.js';
import { eventoRouter } from './routes/evento.routes.js';
import { authRouter } from './routes/auth.routes.js';
import { publicoRouter } from './routes/publico.routes.js';
import cookieParser from 'cookie-parser';
const app = express();

// ===== MIDDLEWARES (preparan la petición) =====

// Capa 1: cabeceras de seguridad
app.use(helmet());

// Capa 2: quién puede llamar a la API
app.use(cors({
  origin: ['http://localhost:3001', 'http://localhost:5173','https://casino-frontend-seven-peach.vercel.app',],
  credentials: true,
}));

// Capa 3: límite de peticiones
app.use(rateLimit({
  windowMs: 60 * 1000,
  limit: 120,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
}));

// Capa 4: leer JSON del cuerpo (DEBE ir antes de las rutas)
app.use(express.json({ limit: '64kb' }));
// Capa 5: leer cookies (para el token httpOnly)
app.use(cookieParser());
// ===== RUTAS (usan lo que los middlewares prepararon) =====

app.get('/api/salud', (req, res) => {
  res.json({ ok: true, mensaje: 'Casino Zero Trust vivo' });
});
app.use('/api', authRouter);   // sin exigirConsentimiento: aquí nace todo
app.use('/api', sesionRouter); 
app.use('/api', publicoRouter);   // público: juegos y conteos para la home                         // sin puerta: aquí se crea el consentimiento
app.use('/api', exigirConsentimiento, huellaRouter);    // con puerta: requiere consentimiento previo
app.use('/api', exigirConsentimiento, expedienteRouter);
app.use('/api', exigirConsentimiento, permisoRouter);
app.use('/api', exigirConsentimiento, arcoRouter);
app.use('/api', exigirConsentimiento, eventoRouter);

// ===== ARRANQUE (siempre al final) =====
// ===== MANEJADOR DE ERRORES GLOBAL =====
// Atrapa TODO error que se escape, incluidos los de express.json
// (payload too large, JSON mal formado). Nunca expone trazas internas.
app.use((error, _req, res, _next) => {
  console.error('[error global]', error.type || error.name, '-', error.message);

  if (error.type === 'entity.too.large') {
    return res.status(413).json({ error: 'payload_excesivo' });
  }

  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'json_invalido' });
  }

  return res.status(500).json({ error: 'error_interno' });
});

// ===== ARRANQUE (siempre al final) =====
app.listen(3000, '0.0.0.0', () => {
  console.log('Servidor escuchando en http://0.0.0.0:3000');
});