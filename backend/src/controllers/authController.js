import { authService } from '../services/authService.js';
import { userService } from '../services/userService.js';
import { ok } from '../utils/respond.js';
import { AppError } from '../utils/AppError.js';

const validateEmail = (email) => {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export const authController = {
  async signup(req, res) {
    const { fullName, email, password } = req.body || {};
    if (!fullName || !fullName.trim()) throw new AppError('Full name is required', 400, 'NAME_REQUIRED');
    if (!validateEmail(email)) throw new AppError('A valid email is required', 400, 'INVALID_EMAIL');
    if (!password || password.length < 8) throw new AppError('Password must be at least 8 characters', 400, 'WEAK_PASSWORD');

    const result = await authService.signup({ fullName: fullName.trim(), email, password });
    return ok(res, result, 'Account created', 201);
  },

  async login(req, res) {
    const { email, password } = req.body || {};
    if (!validateEmail(email) || !password) throw new AppError('Email and password are required', 400, 'CREDENTIALS_REQUIRED');
    const result = await authService.login({ email, password });
    return ok(res, result, 'Logged in');
  },

  async refresh(req, res) {
    const { refreshToken } = req.body || {};
    if (!refreshToken) throw new AppError('Refresh token required', 400, 'REFRESH_REQUIRED');
    const result = await authService.refresh(refreshToken);
    return ok(res, result, 'Token refreshed');
  },

  async logout(req, res) {
    await authService.logout({ token: req.token?.raw, exp: req.token?.exp });
    return ok(res, {}, 'Logged out');
  },

  async me(req, res) {
    return ok(res, { user: req.user.doc ? req.user.doc.toPublic() : req.user }, 'OK');
  },

  async updateProfile(req, res) {
    const { fullName, email } = req.body || {};
    if (fullName != null && !String(fullName).trim()) throw new AppError('Full name cannot be empty', 400, 'NAME_REQUIRED');
    if (email != null && !validateEmail(email)) throw new AppError('A valid email is required', 400, 'INVALID_EMAIL');
    const user = await userService.updateProfile({ userId: req.user.id, fullName, email });
    return ok(res, { user }, 'Profile updated');
  },

  async changePassword(req, res) {
    const { currentPassword, newPassword } = req.body || {};
    if (!currentPassword || !newPassword) throw new AppError('Current and new password are required', 400, 'PASSWORD_REQUIRED');
    const result = await userService.changePassword({ userId: req.user.id, currentPassword, newPassword });
    return ok(res, result, 'Password changed');
  },
};
