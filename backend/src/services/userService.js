import { userRepository } from '../repositories/userRepository.js';
import { notificationService } from './notificationService.js';
import { AppError } from '../utils/AppError.js';

export const userService = {
  async updateProfile({ userId, fullName, email }) {
    const patch = {};
    if (fullName != null) patch.fullName = fullName.trim();
    if (email != null) {
      const normalized = String(email).toLowerCase().trim();
      const existing = await userRepository.findByEmail(normalized);
      if (existing && existing._id.toString() !== userId) {
        throw new AppError('That email is already in use', 409, 'EMAIL_TAKEN');
      }
      patch.email = normalized;
    }
    if (!Object.keys(patch).length) throw new AppError('Nothing to update', 400, 'NO_CHANGES');

    const user = await userRepository.updateProfile(userId, patch);
    if (!user) throw new AppError('User not found', 404, 'USER_NOT_FOUND');

    await notificationService.emit({
      userId,
      type: 'account',
      title: 'Profile updated',
      body: 'Your account details were changed successfully.',
      link: '/settings',
    });
    return user.toPublic();
  },

  async changePassword({ userId, currentPassword, newPassword }) {
    const user = await userRepository.findById(userId, { withSecrets: true });
    if (!user) throw new AppError('User not found', 404, 'USER_NOT_FOUND');

    const ok = await user.comparePassword(currentPassword);
    if (!ok) throw new AppError('Current password is incorrect', 400, 'WRONG_PASSWORD');
    if (!newPassword || newPassword.length < 8) {
      throw new AppError('New password must be at least 8 characters', 400, 'WEAK_PASSWORD');
    }

    await userRepository.changePassword(user, newPassword);
    await notificationService.emit({
      userId,
      type: 'account',
      title: 'Password changed',
      body: 'Your password was updated. If this wasn’t you, contact support.',
      link: '/settings',
    });
    return { changed: true };
  },
};
