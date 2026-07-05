import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { authService } from '../services/authService.js';
import { userRepository } from '../repositories/userRepository.js';
import { timingSafeEqual } from '../utils/crypto.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// Accepts either a Bearer JWT or the master X-API-Key fallback (CLI/MCP).
export const auth = asyncHandler(async (req, res, next) => {
  const apiKey = req.header('X-API-Key');
  if (apiKey) {
    if (!timingSafeEqual(apiKey, env.masterApiKey)) throw new AppError('Invalid API key', 401, 'INVALID_API_KEY');
    // Master key acts as a service principal.
    req.user = { id: 'master', roleSlug: 'super-admin', viaApiKey: true };
    return next();
  }

  const header = req.header('Authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) throw new AppError('Authentication required', 401, 'NO_TOKEN');

  if (await authService.isBlacklisted(token)) throw new AppError('Session expired', 401, 'TOKEN_REVOKED');

  let payload;
  try {
    payload = jwt.verify(token, env.jwtSecret);
  } catch {
    throw new AppError('Invalid or expired token', 401, 'INVALID_TOKEN');
  }

  const user = await userRepository.findById(payload.sub);
  if (!user) throw new AppError('User no longer exists', 401, 'USER_GONE');

  req.user = { id: user._id.toString(), roleSlug: user.roleSlug, plan: user.plan, doc: user };
  req.token = { raw: token, exp: payload.exp };
  next();
});
