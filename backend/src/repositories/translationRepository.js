import { Translation } from '../models/Translation.js';

export const translationRepository = {
  // All translations for one entity type in one language (for applying to a list).
  findFor(entityType, lang) {
    return Translation.find({ entityType, lang }).lean().exec();
  },

  upsert({ entityType, entityId, field, lang, source, value, machine, edited }) {
    return Translation.findOneAndUpdate(
      { entityType, entityId, field, lang },
      { $set: { source, value, machine, edited } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).exec();
  },

  // Admin listing — optionally filtered by entityType / lang.
  list({ entityType, lang } = {}) {
    const q = {};
    if (entityType) q.entityType = entityType;
    if (lang) q.lang = lang;
    return Translation.find(q).sort({ updatedAt: -1 }).lean().exec();
  },
};
