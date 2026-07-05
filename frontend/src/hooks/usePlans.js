import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { planService } from '../services/planService.js';
import { loadRazorpay } from '../lib/razorpay.js';

export const usePlans = () => useQuery({ queryKey: ['plans'], queryFn: planService.list });

// Orchestrates a one-time upgrade: create order → Razorpay checkout → verify.
export const useUpgradePlan = () => {
  const qc = useQueryClient();
  const checkout = useMutation({ mutationFn: planService.checkout });
  const verify = useMutation({ mutationFn: planService.verify });

  const upgrade = async (plan, user) => {
    const order = await checkout.mutateAsync(plan.slug); // { orderId, amount, currency, keyId, planName }
    const ready = await loadRazorpay();
    if (!ready) throw new Error('Could not load the payment gateway. Check your connection.');

    return new Promise((resolve, reject) => {
      const rzp = new window.Razorpay({
        key: order.keyId,
        order_id: order.orderId,
        amount: order.amount,
        currency: order.currency,
        name: 'SecureShield',
        description: `Upgrade to ${order.planName}`,
        prefill: { name: user?.fullName, email: user?.email },
        theme: { color: '#554940' },
        handler: async (resp) => {
          try {
            await verify.mutateAsync({
              razorpayOrderId: resp.razorpay_order_id,
              razorpayPaymentId: resp.razorpay_payment_id,
              razorpaySignature: resp.razorpay_signature,
            });
            qc.invalidateQueries({ queryKey: ['plans'] });
            qc.invalidateQueries({ queryKey: ['me'] });
            resolve(true);
          } catch (e) {
            reject(e);
          }
        },
        modal: { ondismiss: () => reject(new Error('Payment cancelled.')) },
      });
      rzp.open();
    });
  };

  return { upgrade, isPending: checkout.isPending || verify.isPending };
};
