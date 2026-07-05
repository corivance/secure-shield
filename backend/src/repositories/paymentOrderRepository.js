import { PaymentOrder } from '../models/PaymentOrder.js';

export const paymentOrderRepository = {
  create(data) {
    return PaymentOrder.create(data);
  },
  findByRazorpayOrderId(razorpayOrderId) {
    return PaymentOrder.findOne({ razorpayOrderId }).exec();
  },
  update(id, patch) {
    return PaymentOrder.findByIdAndUpdate(id, patch, { new: true }).exec();
  },
};
