import { Comparison } from '../models/Comparison.js';

export const comparisonRepository = {
  create(data) {
    return Comparison.create(data);
  },

  listByUser(userId) {
    return Comparison.find({ user: userId }).sort({ createdAt: -1 }).exec();
  },

  findByIdForUser(id, userId) {
    return Comparison.findOne({ _id: id, user: userId }).exec();
  },

  deleteByIdForUser(id, userId) {
    return Comparison.findOneAndDelete({ _id: id, user: userId }).exec();
  },
};
