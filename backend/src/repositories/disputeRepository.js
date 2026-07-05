import { Dispute } from '../models/Dispute.js';

export const disputeRepository = {
  create(data) {
    return Dispute.create(data);
  },

  countByUser(userId) {
    return Dispute.countDocuments({ user: userId }).exec();
  },

  findByIdForUser(id, userId) {
    return Dispute.findOne({ _id: id, user: userId }).exec();
  },

  update(id, patch) {
    return Dispute.findByIdAndUpdate(id, patch, { new: true });
  },

  listByUser(userId) {
    return Dispute.find({ user: userId }).sort({ createdAt: -1 }).exec();
  },
};
