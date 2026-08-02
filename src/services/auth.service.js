import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';

const RONDAS_BCRYPT = 12; // costo del hash; más alto = más lento = más seguro

// ---- Contraseñas ----
export async function hashearPassword(password) {
  return bcrypt.hash(password, RONDAS_BCRYPT);
}

export async function verificarPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

// ---- Correo: se guarda hasheado, para poder buscarlo sin guardarlo en claro ----
export function hashearEmail(email) {
  const normalizado = email.trim().toLowerCase();
  return crypto.createHash('sha256').update(normalizado).digest('hex');
}

// ---- Tokens JWT ----
export function firmarToken(payload) {
  const secreto = process.env.JWT_SECRET;
  if (!secreto) throw new Error('Falta JWT_SECRET en el entorno');
  return jwt.sign(payload, secreto, {
    expiresIn: process.env.JWT_EXPIRES || '2h',
  });
}

export function verificarToken(token) {
  const secreto = process.env.JWT_SECRET;
  return jwt.verify(token, secreto); // lanza error si es inválido o expiró
}