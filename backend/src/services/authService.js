import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { userRepository } from '../repositories/userRepository.js';
import { getRedis } from '../config/redis.js';
import { AppError } from '../utils/AppError.js';

const signAccess = (user) => {
  return jwt.sign({ sub: user._id.toString(), roleSlug: user.roleSlug }, env.jwtSecret, { expiresIn: env.jwtAccessTtl });
}
const signRefresh = (user) => {
  return jwt.sign({ sub: user._id.toString(), type: 'refresh' }, env.jwtRefreshSecret, { expiresIn: env.jwtRefreshTtl });
}

export const authService = {
  async signup({ fullName, email, password }) {
    const existing = await userRepository.findByEmail(email);
    if (existing) throw new AppError('An account with this email already exists', 409, 'EMAIL_TAKEN');
    // Assign plaintext to passwordHash — the model pre('save') hook hashes it.
    const user = await userRepository.create({ fullName, email, passwordHash: password });
    return authService.issueTokens(user);
  },

  async login({ email, password }) {
    const user = await userRepository.findByEmail(email, { withSecrets: true });
    if (!user) throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    const ok = await user.comparePassword(password);
    if (!ok) throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    await userRepository.touchLogin(user._id);
    return authService.issueTokens(user);
  },

  async issueTokens(user) {
    const accessToken = signAccess(user);
    const refreshToken = signRefresh(user);
    await userRepository.setRefreshToken(user._id, refreshToken);
    return { user: user.toPublic(), accessToken, refreshToken };
  },

  async refresh(refreshToken) {
    let payload;
    try {
      payload = jwt.verify(refreshToken, env.jwtRefreshSecret);
    } catch {
      throw new AppError('Invalid refresh token', 401, 'INVALID_REFRESH');
    }
    const user = await userRepository.findById(payload.sub, { withSecrets: true });
    if (!user || user.refreshToken !== refreshToken) throw new AppError('Refresh token revoked', 401, 'REFRESH_REVOKED');
    return authService.issueTokens(user);
  },

  // Logout blacklists the access token in Redis until its natural expiry.
  async logout({ token, exp }) {
    if (!token) return;
    const redis = getRedis();
    const ttl = Math.max(1, (exp || 0) - Math.floor(Date.now() / 1000));
    await redis.set(`bl:${token}`, '1', 'EX', ttl).catch(() => {});
  },

  async isBlacklisted(token) {
    const redis = getRedis();
    const hit = await redis.get(`bl:${token}`).catch(() => null);
    return Boolean(hit);
  },
};
