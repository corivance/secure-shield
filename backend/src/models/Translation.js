import mongoose from 'mongoose';

const { Schema } = mongoose;

// A translated field for a piece of compliance content. One doc per
// (entityType, entityId, field, lang). `source` stores the English text the
// translation was made from, so we can detect when the English has changed and
// the translation is stale. `edited` marks an admin-corrected (authoritative)
// translation that must never be overwritten by machine output.
const translationSchema = new Schema(
  {
    entityType: { type: String, required: true }, // 'regulation' | 'framework'
    entityId: { type: String, required: true }, // regulation id, or 'default' for framework
    field: { type: String, required: true }, // 'title' | 'text' | 'label' | 'labelLong' | 'disclaimer'
    lang: { type: String, required: true },
    source: { type: String, default: '' },
    value: { type: String, default: '' },
    machine: { type: Boolean, default: true },
    edited: { type: Boolean, default: false },
  },
  { timestamps: true }
);

translationSchema.index({ entityType: 1, entityId: 1, field: 1, lang: 1 }, { unique: true });

export const Translation = mongoose.model('Translation', translationSchema);
