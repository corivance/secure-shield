import crypto from 'node:crypto';
import axios from 'axios';
import { planRepository } from '../repositories/planRepository.js';
import { paymentOrderRepository } from '../repositories/paymentOrderRepository.js';
import { policyRepository } from '../repositories/policyRepository.js';
import { eligibilityRepository } from '../repositories/eligibilityRepository.js';
import { disputeRepository } from '../repositories/disputeRepository.js';
import { userRepository } from '../repositories/userRepository.js';
import { notificationService } from './notificationService.js';
import { resolveKey } from './keyService.js';
import { AppError } from '../utils/AppError.js';

const RESOURCES = ['policies', 'eligibilityChecks', 'disputes'];
const LABEL = { policies: 'policies', eligibilityChecks: 'eligibility checks', disputes: 'disputes' };

const countFor = (userId, resource) => {
  if (resource === 'policies') return policyRepository.countByUser(userId);
  if (resource === 'eligibilityChecks') return eligibilityRepository.countByUser(userId);
  if (resource === 'disputes') return disputeRepository.countByUser(userId);
  return 0;
};

export const planService = {
  listEnabled() {
    return planRepository.enabled();
  },
  listAll() {
    return planRepository.all();
  },

  async getUserPlan(userOrId) {
    const user = typeof userOrId === 'string' ? await userRepository.findById(userOrId) : userOrId;
    if (!user) return planRepository.findDefault();
    return (await planRepository.findBySlug(user.plan)) || (await planRepository.findDefault());
  },

  async usage(userId) {
    const [policies, eligibilityChecks, disputes] = await Promise.all(RESOURCES.map((r) => countFor(userId, r)));
    return { policies, eligibilityChecks, disputes };
  },

  // Throws PLAN_LIMIT_REACHED when a user is at their plan cap. Super-admins are
  // unlimited. A null/negative limit means unlimited.
  async checkLimit(userId, resource) {
    const user = await userRepository.findById(userId);
    if (!user || user.roleSlug === 'super-admin') return;
    const plan = await planService.getUserPlan(user);
    const limit = plan?.limits?.[resource];
    if (limit == null || limit < 0) return;
    const count = await countFor(userId, resource);
    if (count >= limit) {
      throw new AppError(
        `You've reached your ${plan.name} plan limit for ${LABEL[resource]} (${limit}). Upgrade to continue.`,
        403,
        'PLAN_LIMIT_REACHED',
        { resource, limit, plan: plan.slug }
      );
    }
  },

  // ── Admin CRUD ──
  async create(data) {
    if (data.isDefault) await planRepository.clearDefault();
    return planRepository.create(data);
  },
  async update(id, patch) {
    if (patch.isDefault) await planRepository.clearDefault();
    const plan = await planRepository.update(id, patch);
    if (!plan) throw new AppError('Plan not found', 404, 'PLAN_NOT_FOUND');
    return plan;
  },
  async remove(id) {
    const plan = await planRepository.findById(id);
    if (!plan) throw new AppError('Plan not found', 404, 'PLAN_NOT_FOUND');
    if (plan.isDefault) throw new AppError('Cannot delete the default plan', 400, 'DEFAULT_PLAN');
    await planRepository.remove(id);
    return { deleted: true };
  },

  // ── Razorpay one-time checkout ──
  async checkout(userId, planSlug) {
    const plan = await planRepository.findBySlug(planSlug);
    if (!plan || !plan.enabled) throw new AppError('Plan not available', 404, 'PLAN_NOT_FOUND');
    if (plan.price <= 0) throw new AppError('This plan is free — no payment needed', 400, 'FREE_PLAN');

    const keyId = await resolveKey('RAZORPAY_KEY_ID');
    const keySecret = await resolveKey('RAZORPAY_KEY_SECRET');
    if (!keyId || !keySecret) {
      throw new AppError('Payments are not configured. Ask an admin to add Razorpay keys.', 503, 'PAYMENTS_UNCONFIGURED');
    }

    const amountPaise = Math.round(plan.price * 100);
    let order;
    try {
      const { data } = await axios.post(
        'https://api.razorpay.com/v1/orders',
        { amount: amountPaise, currency: plan.currency || 'INR', receipt: `up_${userId}`.slice(0, 40), notes: { userId, planSlug } },
        { auth: { username: keyId, password: keySecret }, timeout: 20000 }
      );
      order = data;
    } catch (err) {
      throw new AppError(`Could not create payment order (${err.response?.data?.error?.description || err.message}).`, 502, 'GATEWAY_ERROR');
    }

    await paymentOrderRepository.create({
      user: userId,
      planSlug,
      amount: plan.price,
      currency: plan.currency || 'INR',
      razorpayOrderId: order.id,
      status: 'created',
    });
    return { orderId: order.id, amount: amountPaise, currency: plan.currency || 'INR', keyId, planName: plan.name };
  },

  // Verify the Razorpay signature, then upgrade the user — tied to a real paid order.
  async verify(userId, { razorpayOrderId, razorpayPaymentId, razorpaySignature }) {
    const order = await paymentOrderRepository.findByRazorpayOrderId(razorpayOrderId);
    if (!order || order.user.toString() !== userId) throw new AppError('Order not found', 404, 'ORDER_NOT_FOUND');

    const keySecret = await resolveKey('RAZORPAY_KEY_SECRET');
    const expected = crypto
      .createHmac('sha256', keySecret || '')
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest('hex');
    if (!keySecret || expected !== razorpaySignature) {
      await paymentOrderRepository.update(order._id, { status: 'failed' });
      throw new AppError('Payment verification failed', 400, 'VERIFY_FAILED');
    }

    await paymentOrderRepository.update(order._id, { status: 'paid', razorpayPaymentId });
    await userRepository.adminUpdate(userId, { plan: order.planSlug });
    await notificationService.emit({
      userId,
      type: 'account',
      title: 'Plan upgraded',
      body: `Payment received — you're now on the ${order.planSlug} plan.`,
      link: '/plans',
    });
    return { upgraded: true, plan: order.planSlug };
  },
};
