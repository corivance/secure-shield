import { WatchState } from '../models/WatchState.js';

export const watchStateRepository = {
  get(key) {
    return WatchState.findOne({ key }).exec();
  },

  upsert(key, patch) {
    return WatchState.findOneAndUpdate({ key }, patch, { upsert: true, new: true, setDefaultsOnInsert: true }).exec();
  },
};
