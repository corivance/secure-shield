import crypto from 'node:crypto';
import { env } from '../config/env.js';

// AES-256-GCM for ai_key_configs at rest. Key is a 64-char hex string in env.
const ALGO = 'aes-256-gcm';

const keyBuffer = () => {
  const raw = env.aesKey;
  // Accept hex (64 chars) or arbitrary string (hashed to 32 bytes).
  if (/^[0-9a-fA-F]{64}$/.test(raw)) return Buffer.from(raw, 'hex');
  return crypto.createHash('sha256').update(raw).digest();
}

export const encrypt = (plaintext) => {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGO, keyBuffer(), iv);
  const enc = Buffer.concat([cipher.update(String(plaintext), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${tag.toString('hex')}:${enc.toString('hex')}`;
}

export const decrypt = (payload) => {
  const [ivHex, tagHex, dataHex] = String(payload).split(':');
  const decipher = crypto.createDecipheriv(ALGO, keyBuffer(), Buffer.from(ivHex, 'hex'));
  decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
  return decipher.update(Buffer.from(dataHex, 'hex')).toString('utf8') + decipher.final('utf8');
}

// HMAC for the master X-API-Key fallback.
export const hmac = (value) => {
  return crypto.createHmac('sha256', keyBuffer()).update(String(value)).digest('hex');
}

export const timingSafeEqual = (a, b) => {
  const ba = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}
