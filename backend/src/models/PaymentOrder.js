import mongoose from 'mongoose';

const { Schema } = mongoose;

// One-time upgrade payment, tracked so verification ties an upgrade to a real,
// paid Razorpay order (not a client-claimed plan).
const paymentOrderSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    planSlug: { type: String, required: true },
    amount: { type: Number, required: true }, // rupees
    currency: { type: String, default: 'INR' },
    razorpayOrderId: { type: String, required: true, index: true },
    razorpayPaymentId: { type: String },
    status: { type: String, enum: ['created', 'paid', 'failed'], default: 'created' },
  },
  { timestamps: true }
);

export const PaymentOrder = mongoose.model('PaymentOrder', paymentOrderSchema, 'payment_orders');
