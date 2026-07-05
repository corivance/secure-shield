import { userRepository } from '../repositories/userRepository.js';
import { planRepository } from '../repositories/planRepository.js';
import { notificationService } from './notificationService.js';
import { AppError } from '../utils/AppError.js';

// Allowed values for admin edits (kept in sync with the frontend select options).
export const ASSIGNABLE_ROLES = ['member', 'reviewer', 'super-admin'];
export const ASSIGNABLE_PLANS = ['free', 'pro', 'enterprise'];

const validateEmail = (email) => typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export const adminUserService = {
  async list({ search } = {}) {
    const users = await userRepository.listAll({ search });
    return users.map((u) => u.toPublic());
  },

  async get(id) {
    const user = await userRepository.findById(id);
    if (!user) throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    return user.toPublic();
  },

  async update(id, { fullName, email, roleSlug, plan, canUseAdminKeys }) {
    const patch = {};
    if (canUseAdminKeys !== undefined) {
      patch.canUseAdminKeys = Boolean(canUseAdminKeys);
      if (canUseAdminKeys) patch.keyAccessRequested = false; // granting clears any pending request
    }
    if (fullName != null) {
      if (!String(fullName).trim()) throw new AppError('Full name cannot be empty', 400, 'NAME_REQUIRED');
      patch.fullName = String(fullName).trim();
    }
    if (email != null) {
      if (!validateEmail(email)) throw new AppError('A valid email is required', 400, 'INVALID_EMAIL');
      const normalized = String(email).toLowerCase().trim();
      const existing = await userRepository.findByEmail(normalized);
      if (existing && existing._id.toString() !== id) throw new AppError('That email is already in use', 409, 'EMAIL_TAKEN');
      patch.email = normalized;
    }
    if (roleSlug != null) {
      if (!ASSIGNABLE_ROLES.includes(roleSlug)) throw new AppError('Invalid role', 400, 'INVALID_ROLE', { allowed: ASSIGNABLE_ROLES });
      patch.roleSlug = roleSlug;
    }
    if (plan != null) {
      const exists = await planRepository.findBySlug(plan);
      if (!exists) throw new AppError('Invalid plan', 400, 'INVALID_PLAN');
      patch.plan = plan;
    }
    if (!Object.keys(patch).length) throw new AppError('Nothing to update', 400, 'NO_CHANGES');

    const user = await userRepository.adminUpdate(id, patch);
    if (!user) throw new AppError('User not found', 404, 'USER_NOT_FOUND');

    if (patch.canUseAdminKeys === true) {
      await notificationService.emit({
        userId: user._id,
        type: 'account',
        title: 'Shared key access approved',
        body: 'You can now use the shared admin LLM key. See Settings → AI provider keys.',
        link: '/settings',
      });
    }
    return user.toPublic();
  },

  async remove(id, actingUserId) {
    if (id === actingUserId) throw new AppError('You cannot delete your own account', 400, 'SELF_DELETE');
    const user = await userRepository.deleteById(id);
    if (!user) throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    return { deleted: true };
  },
};
