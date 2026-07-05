import { Plan } from '../models/Plan.js';

export const planRepository = {
  all() {
    return Plan.find({}).sort({ order: 1, price: 1 }).exec();
  },
  enabled() {
    return Plan.find({ enabled: true }).sort({ order: 1, price: 1 }).exec();
  },
  findBySlug(slug) {
    return Plan.findOne({ slug }).exec();
  },
  findById(id) {
    return Plan.findById(id).exec();
  },
  findDefault() {
    return Plan.findOne({ isDefault: true }).exec();
  },
  create(data) {
    return Plan.create(data);
  },
  update(id, patch) {
    return Plan.findByIdAndUpdate(id, patch, { new: true, runValidators: true }).exec();
  },
  remove(id) {
    return Plan.findByIdAndDelete(id).exec();
  },
  count() {
    return Plan.countDocuments().exec();
  },
  insertMany(docs) {
    return Plan.insertMany(docs);
  },
  clearDefault() {
    return Plan.updateMany({ isDefault: true }, { isDefault: false }).exec();
  },
};
