import mongoose from 'mongoose';

const { Schema } = mongoose;

// IRDAI / Ombudsman / NCDRC / Supreme Court rulings for grievance support.
// embedding holds a small vector for in-app cosine similarity (MongoDB has no
// pgvector; CLAUDE.MD mandates Mongo, so semantic search runs in-process).
const precedentSchema = new Schema(
  {
    citation: { type: String, required: true },
    forum: { type: String, enum: ['IRDAI', 'Ombudsman', 'NCDRC', 'Supreme Court', 'High Court'], required: true },
    year: { type: Number },
    summary: { type: String, required: true },
    holding: { type: String, required: true },
    tags: { type: [String], default: [] },
    embedding: { type: [Number], default: [] },
  },
  { timestamps: true }
);

export const Precedent = mongoose.model('Precedent', precedentSchema);
