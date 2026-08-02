import crypto from 'node:crypto';
import geoip from 'geoip-lite';

// ------------------------------------------------------------
//  1. Extraer la IP real de la petición
// ------------------------------------------------------------
export function obtenerIp(req) {
  // Detrás de un proxy (Render, Vercel), la IP real viene aquí
  const reenviada = req.headers['x-forwarded-for'];
  if (typeof reenviada === 'string' && reenviada.length > 0) {
    return reenviada.split(',')[0].trim();
  }
  // Conexión directa (desarrollo local)
  return req.ip || req.socket?.remoteAddress || 'desconocida';
}

// ------------------------------------------------------------
//  2. Hashear la IP: guardamos el hash, nunca la IP cruda
// ------------------------------------------------------------
export function hashearIp(ip) {
  const sal = process.env.SAL_IP || 'sal-temporal-de-desarrollo';
  return crypto.createHash('sha256').update(`${sal}:${ip}`).digest('hex');
}

// ------------------------------------------------------------
//  3. Derivar la ciudad desde la IP (el contraste del laboratorio)
// ------------------------------------------------------------
export function derivarCiudad(ip) {
  // IPs locales: no hay geolocalización posible en desarrollo
  if (!ip || ip === 'desconocida' ||
      ip === '::1' || ip === '127.0.0.1' ||
      ip.startsWith('192.168.') || ip.startsWith('10.')) {
    return null;
  }

  const resultado = geoip.lookup(ip);
  if (!resultado) return null;

  // Devolvemos "Ciudad, País"
  return [resultado.city, resultado.country].filter(Boolean).join(', ');
}