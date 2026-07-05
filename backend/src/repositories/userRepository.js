import { User } from '../models/User.js';

export const userRepository = {
  findByEmail(email, { withSecrets = false } = {}) {
    const q = User.findOne({ email: String(email).toLowerCase() });
    if (withSecrets) q.select('+passwordHash +refreshToken');
    return q.exec();
  },

  findById(id, { withSecrets = false } = {}) {
    const q = User.findById(id);
    if (withSecrets) q.select('+passwordHash +refreshToken');
    return q.exec();
  },

  create(data) {
    return User.create(data);
  },

  async setRefreshToken(id, token) {
    return User.findByIdAndUpdate(id, { refreshToken: token }, { new: true });
  },

  updateProfile(id, patch) {
    return User.findByIdAndUpdate(id, patch, { new: true, runValidators: true }).exec();
  },

  // Assigns plaintext to passwordHash and saves so the pre('save') hook hashes it.
  async changePassword(doc, newPlaintext) {
    doc.passwordHash = newPlaintext;
    await doc.save();
    return doc;
  },

  async touchLogin(id) {
    return User.findByIdAndUpdate(id, { lastLoginAt: new Date() });
  },

  // ── Admin ──────────────────────────────────────────────────────────────────
  listAll({ search = '' } = {}) {
    const filter = search
      ? { $or: [{ email: new RegExp(escapeRegex(search), 'i') }, { fullName: new RegExp(escapeRegex(search), 'i') }] }
      : {};
    return User.find(filter).sort({ createdAt: -1 }).limit(500).exec();
  },

  adminUpdate(id, patch) {
    return User.findByIdAndUpdate(id, patch, { new: true, runValidators: true }).exec();
  },

  deleteById(id) {
    return User.findByIdAndDelete(id).exec();
  },

  findByRole(roleSlug) {
    return User.find({ roleSlug }).exec();
  },

  count() {
    return User.countDocuments().exec();
  },
};

const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
