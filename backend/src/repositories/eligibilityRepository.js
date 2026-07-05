import { EligibilityCheck } from '../models/EligibilityCheck.js';

export const eligibilityRepository = {
  create(data) {
    return EligibilityCheck.create(data);
  },

  countByUser(userId) {
    return EligibilityCheck.countDocuments({ user: userId }).exec();
  },

  findByIdForUser(id, userId) {
    return EligibilityCheck.findOne({ _id: id, user: userId }).populate('policy').exec();
  },

  listByUser(userId, limit = 25) {
    return EligibilityCheck.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('policy', 'planName insurer')
      .exec();
  },
};
