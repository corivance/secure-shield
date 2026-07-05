import { Regulation } from '../models/Regulation.js';

export const regulationRepository = {
  all() {
    return Regulation.find({}).sort({ category: 1, createdAt: 1 }).exec();
  },

  enabled() {
    return Regulation.find({ enabled: true }).sort({ createdAt: 1 }).exec();
  },

  findById(id) {
    return Regulation.findById(id).exec();
  },

  create(data) {
    return Regulation.create(data);
  },

  update(id, patch) {
    return Regulation.findByIdAndUpdate(id, patch, { new: true, runValidators: true }).exec();
  },

  remove(id) {
    return Regulation.findByIdAndDelete(id).exec();
  },

  count() {
    return Regulation.countDocuments().exec();
  },

  insertMany(docs) {
    return Regulation.insertMany(docs);
  },

  deleteAll() {
    return Regulation.deleteMany({});
  },
};
