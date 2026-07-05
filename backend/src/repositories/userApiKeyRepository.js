import { UserApiKey } from '../models/UserApiKey.js';

export const userApiKeyRepository = {
  findByUserAndName(userId, keyName) {
    return UserApiKey.findOne({ user: userId, keyName }).select('+encryptedValue').exec();
  },

  listByUser(userId) {
    return UserApiKey.find({ user: userId }).select('+encryptedValue').exec();
  },

  upsert(userId, keyName, data) {
    return UserApiKey.findOneAndUpdate(
      { user: userId, keyName },
      { ...data, user: userId, keyName },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    )
      .select('+encryptedValue')
      .exec();
  },
};
