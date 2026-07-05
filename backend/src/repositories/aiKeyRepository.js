import { AiKeyConfig } from '../models/AiKeyConfig.js';

export const aiKeyRepository = {
  findByName(keyName) {
    return AiKeyConfig.findOne({ keyName, enabled: true }).select('+encryptedValue').exec();
  },

  listEnabled() {
    return AiKeyConfig.find({ enabled: true }).exec();
  },

  // All configs WITH ciphertext (so the service can compute "is it set?"). The
  // service must never return the decrypted value to clients.
  listAll() {
    return AiKeyConfig.find({}).select('+encryptedValue').exec();
  },

  upsert(keyName, data) {
    return AiKeyConfig.findOneAndUpdate({ keyName }, data, { upsert: true, new: true, setDefaultsOnInsert: true }).select(
      '+encryptedValue'
    );
  },
};
