import { planService } from '../services/planService.js';
import { ok } from '../utils/respond.js';
import { AppError } from '../utils/AppError.js';

// Member-facing: list enabled plans, the user's current plan + usage, and pay.
export const planController = {
  async list(req, res) {
    const [plans, usage, current] = await Promise.all([
      planService.listEnabled(),
      planService.usage(req.user.id),
      planService.getUserPlan(req.user.id),
    ]);
    return ok(res, { plans, usage, currentPlan: current?.slug, current }, 'OK');
  },

  async checkout(req, res) {
    const { planSlug } = req.body || {};
    if (!planSlug) throw new AppError('planSlug is required', 400, 'PLAN_REQUIRED');
    const order = await planService.checkout(req.user.id, planSlug);
    return ok(res, order, 'Order created');
  },

  async verify(req, res) {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body || {};
    const result = await planService.verify(req.user.id, { razorpayOrderId, razorpayPaymentId, razorpaySignature });
    return ok(res, result, 'Upgraded');
  },
};
