import { Precedent } from '../models/Precedent.js';

export const precedentRepository = {
  all() {
    return Precedent.find({}).exec();
  },

  count() {
    return Precedent.countDocuments().exec();
  },

  insertMany(docs) {
    return Precedent.insertMany(docs);
  },

  deleteAll() {
    return Precedent.deleteMany({});
  },
};
