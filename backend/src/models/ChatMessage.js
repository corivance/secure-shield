import mongoose from 'mongoose';

const { Schema } = mongoose;

const chatMessageSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    question: { type: String, required: true },
    answer: { type: String, default: '' },
    // Which tier resolved it: faq | llm | ocr
    source: { type: String, enum: ['faq', 'llm', 'ocr'], default: 'faq' },
    model: { type: String, default: '' },
  },
  { timestamps: true }
);

export const ChatMessage = mongoose.model('ChatMessage', chatMessageSchema);
