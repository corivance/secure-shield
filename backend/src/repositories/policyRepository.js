import { Policy } from '../models/Policy.js';

export const policyRepository = {
  create(data) {
    return Policy.create(data);
  },

  listByUser(userId) {
    return Policy.find({ user: userId }).sort({ createdAt: -1 }).exec();
  },

  countByUser(userId) {
    return Policy.countDocuments({ user: userId }).exec();
  },

  findByIdForUser(id, userId) {
    return Policy.findOne({ _id: id, user: userId }).exec();
  },

  freeze(id) {
    return Policy.findByIdAndUpdate(id, { frozen: true, frozenAt: new Date() }, { new: true });
  },

  updateForUser(id, userId, data) {
    return Policy.findOneAndUpdate({ _id: id, user: userId }, { $set: data }, { new: true }).exec();
  },

  deleteByIdForUser(id, userId) {
    return Policy.findOneAndDelete({ _id: id, user: userId }).exec();
  },
};
