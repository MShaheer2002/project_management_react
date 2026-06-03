import React, { useState, useEffect, useCallback } from 'react';
import {
  CreditCard,
  Check,
  Crown,
  Zap,
  Download,
  Plus,
  Star,
  Trash2,
  Loader2,
  AlertCircle,
  ExternalLink,
  Users,
  HardDrive,
  Sparkles,
} from 'lucide-react';
import { useStripe } from '@stripe/react-stripe-js';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/app/stores/useAuthStore';
import { useToastStore } from '@/app/stores/useToastStore';
import {
  useSubscription,
  usePaymentMethods,
  useInvoices,
  useCreateSubscription,
  useChangePlan,
  useCancelSubscription,
  useCreateSetupIntent,
  useAttachPaymentMethod,
  useSetDefaultPaymentMethod,
  useRemovePaymentMethod,
  billingQueryKeys,
} from '@/features/billing/hooks/useBilling';
import { billingService } from '@/features/billing/services/billingService';
import { StripeProvider } from '@/features/billing/components/StripeProvider';
import { AddCardModal } from '@/features/billing/components/AddCardModal';
import type { BillingPlan } from '@/features/billing/services/billingService';

// ── Plan definitions ──

const PLANS = [
  {
    key: 'FREE' as BillingPlan,
    name: 'Free',
    price: 0,
    description: 'For individuals and small teams getting started.',
    features: [
      'Up to 10 members',
      'Unlimited issues',
      'All core features',
      'Community support',
      '2 GB storage',
    ],
    icon: Users,
    color: 'text-gray-500 dark:text-gray-400',
    bgColor: 'bg-gray-100 dark:bg-gray-500/10',
  },
  {
    key: 'STANDARD' as BillingPlan,
    name: 'Standard',
    price: 6,
    description: 'For growing product teams that need more.',
    popular: true,
    features: [
      'Unlimited members',
      'All Free features',
      'Advanced integrations',
      'Priority support',
      '50 GB storage',
    ],
    icon: Zap,
    color: 'text-primary',
    bgColor: 'bg-primary/10',
  },
  {
    key: 'PREMIUM' as BillingPlan,
    name: 'Premium',
    price: 10,
    description: 'For large organizations with advanced needs.',
    features: [
      'All Standard features',
      'AI-powered features',
      'Unlimited storage',
      'Dedicated support',
      'Advanced analytics',
    ],
    icon: Crown,
    color: 'text-amber-500 dark:text-amber-400',
    bgColor: 'bg-amber-50 dark:bg-amber-400/10',
  },
];

const CARD_BRAND_LABELS: Record<string, string> = {
  visa: 'Visa',
  mastercard: 'Mastercard',
  amex: 'Amex',
  discover: 'Discover',
  diners: 'Diners',
  jcb: 'JCB',
  unionpay: 'UnionPay',
};

/** Inline SVG card brand icons — no image assets needed */
const CardBrandIcon: React.FC<{ brand: string; className?: string }> = ({ brand, className = '' }) => {
  const b = brand.toLowerCase();
  const base = `shrink-0 ${className}`;

  if (b === 'visa') {
    return (
      <svg viewBox="0 0 48 32" className={base} fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="48" height="32" rx="4" fill="#1A1F71" />
        <path d="M19.5 21H17L18.8 11H21.3L19.5 21ZM15.4 11L13 18L12.7 16.5L12.7 16.5L11.8 12C11.8 12 11.7 11 10.4 11H6.1L6 11.2C6 11.2 7.5 11.5 9.3 12.6L11.4 21H14L18 11H15.4ZM35.2 21H37.5L35.5 11H33.5C32.4 11 32.1 11.8 32.1 11.8L28.3 21H30.9L31.4 19.5H34.5L34.8 21H35.2ZM32.2 17.5L33.5 13.8L34.2 17.5H32.2ZM28.2 13.5L28.5 11.8C28.5 11.8 27.2 11.3 25.8 11.3C24.3 11.3 21 12 21 14.7C21 17.2 24.5 17.2 24.5 18.5C24.5 19.8 21.4 19.5 20.2 18.6L19.9 20.4C19.9 20.4 21.2 21 23 21C24.8 21 28.1 20.1 28.1 17.6C28.1 15 24.6 14.8 24.6 13.7C24.6 12.6 26.9 12.7 28.2 13.5Z" fill="white" />
      </svg>
    );
  }

  if (b === 'mastercard') {
    return (
      <svg viewBox="0 0 48 32" className={base} fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="48" height="32" rx="4" fill="#252525" />
        <circle cx="19" cy="16" r="8" fill="#EB001B" />
        <circle cx="29" cy="16" r="8" fill="#F79E1B" />
        <path d="M24 10.3C25.8 11.7 27 13.7 27 16C27 18.3 25.8 20.3 24 21.7C22.2 20.3 21 18.3 21 16C21 13.7 22.2 11.7 24 10.3Z" fill="#FF5F00" />
      </svg>
    );
  }

  if (b === 'amex') {
    return (
      <svg viewBox="0 0 48 32" className={base} fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="48" height="32" rx="4" fill="#2E77BC" />
        <text x="24" y="18" textAnchor="middle" fill="white" fontSize="8" fontWeight="bold" fontFamily="Arial">AMEX</text>
      </svg>
    );
  }

  if (b === 'discover') {
    return (
      <svg viewBox="0 0 48 32" className={base} fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="48" height="32" rx="4" fill="#F9F9F9" />
        <rect x="0.5" y="0.5" width="47" height="31" rx="3.5" stroke="#E5E7EB" />
        <circle cx="28" cy="16" r="6" fill="#F47216" />
        <text x="16" y="18" textAnchor="middle" fill="#1A1A1A" fontSize="6" fontWeight="bold" fontFamily="Arial">DISC</text>
      </svg>
    );
  }

  if (b === 'jcb') {
    return (
      <svg viewBox="0 0 48 32" className={base} fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="48" height="32" rx="4" fill="#FFFFFF" />
        <rect x="0.5" y="0.5" width="47" height="31" rx="3.5" stroke="#E5E7EB" />
        <rect x="12" y="8" width="8" height="16" rx="2" fill="#0E4C96" />
        <rect x="20" y="8" width="8" height="16" rx="2" fill="#E0142E" />
        <rect x="28" y="8" width="8" height="16" rx="2" fill="#00873A" />
      </svg>
    );
  }

  if (b === 'unionpay') {
    return (
      <svg viewBox="0 0 48 32" className={base} fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="48" height="32" rx="4" fill="#034A67" />
        <text x="24" y="18" textAnchor="middle" fill="white" fontSize="6" fontWeight="bold" fontFamily="Arial">UnionPay</text>
      </svg>
    );
  }

  if (b === 'diners') {
    return (
      <svg viewBox="0 0 48 32" className={base} fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="48" height="32" rx="4" fill="#FFFFFF" />
        <rect x="0.5" y="0.5" width="47" height="31" rx="3.5" stroke="#E5E7EB" />
        <circle cx="24" cy="16" r="8" stroke="#0165AC" strokeWidth="2" fill="none" />
        <line x1="20" y1="11" x2="20" y2="21" stroke="#0165AC" strokeWidth="1.5" />
        <line x1="28" y1="11" x2="28" y2="21" stroke="#0165AC" strokeWidth="1.5" />
      </svg>
    );
  }

  // Fallback for unknown brands
  return <CreditCard size={18} className="text-gray-400 dark:text-gray-500" />;
};

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatCurrency(amount: number, currency = 'usd'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount / 100);
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const value = bytes / Math.pow(1024, i);
  return `${value % 1 === 0 ? value : value.toFixed(1)} ${units[i]}`;
}

// ── Storage usage bar ──

const StorageUsageBar: React.FC<{ usedBytes: number; limitBytes: number | null }> = ({ usedBytes, limitBytes }) => {
  const isUnlimited = limitBytes === null;
  const percentage = isUnlimited ? 0 : limitBytes > 0 ? Math.min((usedBytes / limitBytes) * 100, 100) : 0;
  const isNearLimit = percentage >= 80;
  const isOverLimit = percentage >= 95;

  return (
    <div className="space-y-1.5">
      <p className="text-lg font-bold text-gray-900 dark:text-white">
        {formatBytes(usedBytes)}
        <span className="text-sm font-normal text-gray-400 dark:text-gray-500">
          {' '}/ {isUnlimited ? 'Unlimited' : formatBytes(limitBytes)}
        </span>
      </p>
      {!isUnlimited && (
        <div className="w-full h-1.5 rounded-full bg-gray-100 dark:bg-white/5 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isOverLimit
                ? 'bg-red-500'
                : isNearLimit
                ? 'bg-amber-500'
                : 'bg-primary'
            }`}
            style={{ width: `${Math.max(percentage, 1)}%` }}
          />
        </div>
      )}
    </div>
  );
};

// ── Inner content (needs Stripe context for AddCardModal) ──

const BillingContent: React.FC = () => {
  const stripe = useStripe();
  const queryClient = useQueryClient();
  const workspaceId = useAuthStore((s) => s.workspace?.id);
  const role = useAuthStore((s) => s.workspace?.role);
  const isOwner = role === 'owner';
  const showToast = useToastStore((s) => s.showToast);

  const { data: subscription, isLoading: subLoading } = useSubscription();
  const { data: paymentMethods = [], isLoading: pmLoading } = usePaymentMethods();
  const { data: invoices = [], isLoading: invLoading } = useInvoices();

  const createSubscription = useCreateSubscription();
  const changePlan = useChangePlan();
  const cancelSubscription = useCancelSubscription();
  const createSetupIntent = useCreateSetupIntent();
  const attachPaymentMethod = useAttachPaymentMethod();
  const setDefaultPM = useSetDefaultPaymentMethod();
  const removePM = useRemovePaymentMethod();

  const [showAddCard, setShowAddCard] = useState(false);
  const [setupClientSecret, setSetupClientSecret] = useState<string | null>(null);
  const [pendingPlanAfterCard, setPendingPlanAfterCard] = useState<'STANDARD' | 'PREMIUM' | null>(null);
  const [confirmingPlan, setConfirmingPlan] = useState<'STANDARD' | 'PREMIUM' | null>(null);
  const [cancelConfirm, setCancelConfirm] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const currentPlan = subscription?.accessPlan || subscription?.plan || 'FREE';
  const isFreePlan = currentPlan === 'FREE';
  const isPaid = !isFreePlan && subscription?.status?.toUpperCase() === 'ACTIVE';
  const seatCount = subscription?.seatCount || 1;

  /** Invalidate all billing queries after a successful payment */
  const refreshBillingState = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: billingQueryKeys.subscription(workspaceId) });
    queryClient.invalidateQueries({ queryKey: billingQueryKeys.invoices(workspaceId) });
    queryClient.invalidateQueries({ queryKey: billingQueryKeys.paymentMethods(workspaceId) });
  }, [queryClient, workspaceId]);

  /**
   * Poll payment-status until hasPaidAccess=true or max retries.
   * This waits for Stripe webhooks to reach the backend.
   */
  const pollUntilActive = useCallback(async (): Promise<boolean> => {
    for (let i = 0; i < 15; i++) {
      await new Promise((r) => setTimeout(r, 2000));
      try {
        const status = await billingService.getPaymentStatus();
        if (status.hasPaidAccess) return true;
        // If still requires action with a new clientSecret, retry confirmation
        if (status.requiresAction && status.clientSecret && stripe) {
          const { error } = await stripe.confirmCardPayment(status.clientSecret);
          if (error) return false;
        }
      } catch {
        // Keep polling on transient errors
      }
    }
    return false;
  }, [stripe]);

  /**
   * Payment confirmation flow:
   * 1. Call backend create/change
   * 2. If clientSecret returned, call stripe.confirmCardPayment
   * 3. Poll payment-status until active
   * 4. Refresh billing state
   */
  const confirmPaymentFlow = useCallback(async (
    backendCall: () => Promise<{ clientSecret: string | null; requiresAction: boolean }>,
    planLabel: string,
  ) => {
    setPaymentProcessing(true);
    setPaymentError(null);

    try {
      const response = await backendCall();
      console.log('[Billing] Backend response:', JSON.stringify(response, null, 2));

      // Step 2: Confirm payment with Stripe if required
      if (response.clientSecret) {
        if (!stripe) {
          setPaymentError('Stripe not loaded. Please refresh and try again.');
          setPaymentProcessing(false);
          return;
        }
        const { error } = await stripe.confirmCardPayment(response.clientSecret);
        if (error) {
          setPaymentError(error.message || 'Payment could not be completed. Try another card or retry.');
          setPaymentProcessing(false);
          return;
        }
      }

      // Step 3: Poll until backend reflects the completed payment
      const activated = await pollUntilActive();

      // Step 4: Refresh billing state from backend
      refreshBillingState();

      setConfirmingPlan(null);
      setPaymentProcessing(false);

      if (activated) {
        showToast(`Successfully subscribed to ${planLabel}!`, 'success');
      } else {
        showToast('Payment is still processing. Your plan will update shortly.', 'info');
      }
    } catch (err: any) {
      const msg = err?.response?.data?.error?.message || 'Failed to update subscription.';
      setPaymentError(msg);
      setPaymentProcessing(false);
    }
  }, [stripe, pollUntilActive, refreshBillingState, showToast]);

  // ── Page reload recovery: check if there's a pending payment ──
  useEffect(() => {
    if (!stripe || !isOwner) return;
    let cancelled = false;

    const checkPendingPayment = async () => {
      try {
        const status = await billingService.getPaymentStatus();
        if (cancelled) return;
        if (status.requiresAction && status.clientSecret) {
          setPaymentProcessing(true);
          const { error } = await stripe.confirmCardPayment(status.clientSecret);
          if (error) {
            setPaymentError(error.message || 'Payment requires attention.');
            setPaymentProcessing(false);
            return;
          }
          const activated = await pollUntilActive();
          refreshBillingState();
          setPaymentProcessing(false);
          if (activated) {
            showToast('Payment completed successfully!', 'success');
          }
        }
      } catch {
        // No pending payment or endpoint not available yet
      }
    };

    checkPendingPayment();
    return () => { cancelled = true; };
  }, [stripe, isOwner, pollUntilActive, refreshBillingState, showToast]);

  // ── Handlers ──

  const handleAddCard = async () => {
    try {
      const { clientSecret } = await createSetupIntent.mutateAsync();
      setSetupClientSecret(clientSecret);
      setShowAddCard(true);
    } catch {
      showToast('Failed to initialize card setup.', 'error');
    }
  };

  const handleCardSaved = async (paymentMethodId: string) => {
    try {
      await attachPaymentMethod.mutateAsync(paymentMethodId);
      setShowAddCard(false);
      setSetupClientSecret(null);
      showToast('Card saved successfully.', 'success');

      if (pendingPlanAfterCard) {
        setConfirmingPlan(pendingPlanAfterCard);
        setPendingPlanAfterCard(null);
      }
    } catch {
      showToast('Failed to save card.', 'error');
    }
  };

  const handlePlanClick = (plan: 'STANDARD' | 'PREMIUM') => {
    if (!isOwner) return;
    if (paymentMethods.length === 0) {
      setPendingPlanAfterCard(plan);
      showToast('Please add a payment method first.', 'info');
      handleAddCard();
      return;
    }
    setPaymentError(null);
    setConfirmingPlan(plan);
  };

  const handleConfirmSubscribe = async () => {
    if (!isOwner || !confirmingPlan) return;
    const planLabel = confirmingPlan === 'STANDARD' ? 'Standard' : 'Premium';

    if (!isPaid) {
      await confirmPaymentFlow(
        () => createSubscription.mutateAsync(confirmingPlan),
        planLabel,
      );
    } else {
      await confirmPaymentFlow(
        () => changePlan.mutateAsync(confirmingPlan),
        planLabel,
      );
    }
  };

  const handleCancel = async () => {
    if (!isOwner) return;
    try {
      await cancelSubscription.mutateAsync();
      setCancelConfirm(false);
      showToast('Subscription will cancel at period end.', 'success');
    } catch {
      showToast('Failed to cancel subscription.', 'error');
    }
  };

  const handleSetDefault = async (paymentMethodId: string) => {
    try {
      await setDefaultPM.mutateAsync(paymentMethodId);
      showToast('Default card updated.', 'success');
    } catch {
      showToast('Failed to update default card.', 'error');
    }
  };

  const handleRemoveCard = async (id: string) => {
    try {
      await removePM.mutateAsync(id);
      showToast('Card removed.', 'success');
    } catch (err: any) {
      const msg = err?.response?.data?.error?.message || 'Failed to remove card.';
      showToast(msg, 'error');
    }
  };

  const isMutating = createSubscription.isPending || changePlan.isPending || cancelSubscription.isPending || paymentProcessing;

  if (subLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={24} className="animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* ── Header ── */}
      <header className="px-8 py-6 border-b border-gray-200 dark:border-border-dark">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Billing & Subscription</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {isOwner
            ? "Manage your workspace's plan, payment methods, and invoices."
            : 'View your workspace billing details.'}
        </p>
      </header>

      <div className="flex-1 overflow-y-auto p-8 max-w-5xl space-y-10">

        {/* ══════════════════════════════════════════════════
            CURRENT PLAN
           ══════════════════════════════════════════════════ */}
        <section className="bg-white dark:bg-card-dark border border-gray-200 dark:border-border-dark rounded-2xl p-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2.5">
                <span className="px-2.5 py-0.5 rounded-md bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider">
                  Current Plan
                </span>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {PLANS.find((p) => p.key === currentPlan)?.name || 'Free'} Plan
                </h2>
              </div>
              {isPaid && subscription?.currentPeriodEnd ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {subscription.cancelAtPeriodEnd ? (
                    <>
                      Cancels on <strong className="text-gray-700 dark:text-gray-200">{formatDate(subscription.currentPeriodEnd)}</strong>. You retain access until then.
                    </>
                  ) : (
                    <>
                      Next billing date is{' '}
                      <strong className="text-gray-700 dark:text-gray-200">{formatDate(subscription.currentPeriodEnd)}</strong> for{' '}
                      <strong className="text-gray-700 dark:text-gray-200">
                        ${(PLANS.find((p) => p.key === currentPlan)?.price || 0) * (subscription.seatCount || 1)}/mo
                      </strong>
                    </>
                  )}
                </p>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Free plan — no billing. Upgrade when you're ready.
                </p>
              )}
            </div>
            {isOwner && isPaid && !subscription?.cancelAtPeriodEnd && (
              <button
                onClick={() => setCancelConfirm(true)}
                className="px-4 py-2 rounded-lg border border-gray-200 dark:border-border-dark text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-all shrink-0"
              >
                Cancel Plan
              </button>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-8 pt-6 border-t border-gray-100 dark:border-border-dark">
            {/* Seats */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5">
                <Users size={13} className="text-gray-400 dark:text-gray-500" />
                <p className="text-[11px] text-gray-500 dark:text-gray-400 uppercase font-bold tracking-wider">Seats</p>
              </div>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {subscription?.seatCount || 1}
                <span className="text-sm font-normal text-gray-400 dark:text-gray-500">
                  {' '}/ {subscription?.entitlements?.memberInviteCap ?? 'Unlimited'}
                </span>
              </p>
            </div>

            {/* Storage with usage bar */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5">
                <HardDrive size={13} className="text-gray-400 dark:text-gray-500" />
                <p className="text-[11px] text-gray-500 dark:text-gray-400 uppercase font-bold tracking-wider">Storage</p>
              </div>
              <StorageUsageBar
                usedBytes={subscription?.storageUsedBytes ?? 0}
                limitBytes={subscription?.entitlements?.storageLimitBytes ?? null}
              />
            </div>

            {/* AI Features */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5">
                <Sparkles size={13} className="text-gray-400 dark:text-gray-500" />
                <p className="text-[11px] text-gray-500 dark:text-gray-400 uppercase font-bold tracking-wider">AI Features</p>
              </div>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {subscription?.entitlements?.aiEnabled ? (
                  <span className="text-green-600 dark:text-green-400">Enabled</span>
                ) : (
                  <span className="text-gray-400 dark:text-gray-500">Not available</span>
                )}
              </p>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════
            CANCEL CONFIRMATION
           ══════════════════════════════════════════════════ */}
        {cancelConfirm && (
          <div className="bg-red-50 dark:bg-red-500/5 border border-red-200 dark:border-red-500/20 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <AlertCircle size={18} className="text-red-500 dark:text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Are you sure you want to cancel?</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  You'll retain access until {formatDate(subscription?.currentPeriodEnd || null)}.
                  After that, your workspace downgrades to Free.
                </p>
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                onClick={() => setCancelConfirm(false)}
                className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 dark:border-border-dark text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
              >
                Keep plan
              </button>
              <button
                onClick={handleCancel}
                disabled={cancelSubscription.isPending}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-red-500 text-white hover:bg-red-600 disabled:opacity-50 transition-colors"
              >
                {cancelSubscription.isPending ? 'Cancelling...' : 'Confirm cancel'}
              </button>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════
            PLANS
           ══════════════════════════════════════════════════ */}
        <section className="space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Plans</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {PLANS.map((plan) => {
              const isCurrent = currentPlan === plan.key;
              const isPopular = plan.popular;
              const PlanIcon = plan.icon;

              return (
                <div
                  key={plan.key}
                  className={`relative bg-white dark:bg-card-dark border rounded-2xl p-5 transition-all ${
                    isCurrent
                      ? 'border-primary ring-1 ring-primary/20 shadow-md shadow-primary/5'
                      : 'border-gray-200 dark:border-border-dark hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  {isPopular && (
                    <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-primary text-white text-[10px] font-bold uppercase tracking-wider shadow-lg shadow-primary/25">
                      Most Popular
                    </span>
                  )}

                  <div className="space-y-4">
                    {/* Icon + name */}
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-lg ${plan.bgColor} flex items-center justify-center`}>
                        <PlanIcon size={16} className={plan.color} />
                      </div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">{plan.name}</h4>
                    </div>

                    {/* Price */}
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold text-gray-900 dark:text-white">${plan.price}</span>
                      <span className="text-sm text-gray-400 dark:text-gray-500">/seat/month</span>
                    </div>

                    {/* Description */}
                    <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{plan.description}</p>

                    {/* Features */}
                    <ul className="space-y-2.5 pt-1">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-center gap-2.5 text-sm text-gray-700 dark:text-gray-300">
                          <div className="w-4 h-4 rounded-full bg-green-50 dark:bg-green-500/10 flex items-center justify-center shrink-0">
                            <Check size={10} className="text-green-600 dark:text-green-400" />
                          </div>
                          {f}
                        </li>
                      ))}
                    </ul>

                    {/* Action */}
                    {isOwner && (
                      <div className="pt-3">
                        {isCurrent ? (
                          <div className="text-center text-xs font-semibold text-primary py-2.5 bg-primary/5 rounded-lg">
                            Current plan
                          </div>
                        ) : plan.key === 'FREE' ? (
                          isPaid ? (
                            <div className="text-center text-xs text-gray-400 dark:text-gray-500 py-2.5">
                              Cancel paid plan to downgrade
                            </div>
                          ) : null
                        ) : (
                          <button
                            onClick={() => handlePlanClick(plan.key as 'STANDARD' | 'PREMIUM')}
                            disabled={isMutating}
                            className={`w-full py-2.5 text-sm font-semibold rounded-lg transition-all disabled:opacity-50 ${
                              isPopular
                                ? 'bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/20'
                                : 'border border-gray-200 dark:border-border-dark text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5'
                            }`}
                          >
                            {isMutating ? (
                              <Loader2 size={14} className="animate-spin mx-auto" />
                            ) : isPaid ? (
                              `Switch to ${plan.name}`
                            ) : (
                              `Upgrade to ${plan.name}`
                            )}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ══════════════════════════════════════════════════
            PAYMENT METHODS
           ══════════════════════════════════════════════════ */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Payment Methods</h3>
            {isOwner && (
              <button
                onClick={handleAddCard}
                disabled={createSetupIntent.isPending}
                className="text-xs text-primary font-semibold flex items-center gap-1.5 hover:text-primary/80 disabled:opacity-50 transition-colors"
              >
                {createSetupIntent.isPending ? <Loader2 size={12} className="animate-spin" /> : <Plus size={14} />}
                Add card
              </button>
            )}
          </div>

          {pmLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 size={20} className="animate-spin text-gray-400" />
            </div>
          ) : paymentMethods.length === 0 ? (
            <div className="bg-white dark:bg-card-dark border border-dashed border-gray-300 dark:border-border-dark rounded-xl p-10 text-center">
              <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-white/5 flex items-center justify-center mx-auto mb-3">
                <CreditCard size={22} className="text-gray-400 dark:text-gray-500" />
              </div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">No payment methods saved</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Add a card to upgrade your workspace plan.</p>
              {isOwner && (
                <button
                  onClick={handleAddCard}
                  disabled={createSetupIntent.isPending}
                  className="mt-4 px-4 py-2 text-xs font-semibold rounded-lg bg-primary text-white hover:bg-primary/90 transition-all disabled:opacity-50 shadow-lg shadow-primary/20"
                >
                  Add your first card
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {paymentMethods.map((pm) => (
                <div
                  key={pm.id}
                  className="bg-white dark:bg-card-dark border border-gray-200 dark:border-border-dark rounded-xl p-4 flex items-center justify-between group hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <CardBrandIcon brand={pm.brand} className="w-12 h-8 rounded-md" />
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                          {CARD_BRAND_LABELS[pm.brand.toLowerCase()] || pm.brand} ending in {pm.last4}
                        </p>
                        {pm.isDefault && (
                          <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary text-[9px] font-bold uppercase tracking-wide">
                            Default
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                        Expires {String(pm.expiryMonth).padStart(2, '0')}/{pm.expiryYear}
                      </p>
                    </div>
                  </div>
                  {isOwner && (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {!pm.isDefault && (
                        <button
                          onClick={() => handleSetDefault(pm.id)}
                          disabled={setDefaultPM.isPending}
                          className="px-2.5 py-1.5 text-xs text-gray-500 dark:text-gray-400 hover:text-primary font-medium transition-colors flex items-center gap-1 rounded-md hover:bg-gray-50 dark:hover:bg-white/5"
                        >
                          <Star size={12} />
                          Set default
                        </button>
                      )}
                      <button
                        onClick={() => handleRemoveCard(pm.id)}
                        disabled={removePM.isPending}
                        className="p-1.5 rounded-md text-gray-400 dark:text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ══════════════════════════════════════════════════
            INVOICES
           ══════════════════════════════════════════════════ */}
        <section className="space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Invoice History</h3>

          {invLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 size={20} className="animate-spin text-gray-400" />
            </div>
          ) : invoices.length === 0 ? (
            <div className="bg-white dark:bg-card-dark border border-dashed border-gray-300 dark:border-border-dark rounded-xl p-10 text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">No invoices yet.</p>
              {isFreePlan && (
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Invoices will appear here once you upgrade to a paid plan.</p>
              )}
            </div>
          ) : (
            <div className="bg-white dark:bg-card-dark border border-gray-200 dark:border-border-dark rounded-xl overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 dark:bg-black/10 text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-border-dark">
                  <tr>
                    <th className="px-6 py-3">Invoice</th>
                    <th className="px-6 py-3">Date</th>
                    <th className="px-6 py-3">Amount</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-border-dark">
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4 font-medium text-gray-700 dark:text-gray-200">{inv.invoiceNumber || inv.stripeInvoiceId}</td>
                      <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{formatDate(inv.paidAt || inv.issuedAt || inv.createdAt)}</td>
                      <td className="px-6 py-4 font-semibold text-gray-800 dark:text-gray-100">{formatCurrency(inv.amount, inv.currency)}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            inv.status === 'paid'
                              ? 'bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400'
                              : inv.status === 'open'
                              ? 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400'
                              : 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400'
                          }`}
                        >
                          {inv.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {inv.pdfUrl && (
                            <a
                              href={inv.pdfUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-white/5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                              title="Download PDF"
                            >
                              <Download size={14} />
                            </a>
                          )}
                          {inv.hostedUrl && (
                            <a
                              href={inv.hostedUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-white/5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                              title="View invoice"
                            >
                              <ExternalLink size={14} />
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* ── Seat billing note (paid plans only) ── */}
        {isPaid && subscription?.prorationNotice && (
          <div className="bg-blue-50 dark:bg-blue-500/5 border border-blue-100 dark:border-blue-500/10 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle size={16} className="text-blue-500 dark:text-blue-400 shrink-0 mt-0.5" />
            <p className="text-xs text-blue-700 dark:text-blue-300/80 leading-relaxed">
              {subscription.prorationNotice}
            </p>
          </div>
        )}
      </div>

      {/* ── Upgrade confirmation modal ── */}
      {confirmingPlan && (() => {
        const targetPlan = PLANS.find((p) => p.key === confirmingPlan)!;
        const PlanIcon = targetPlan.icon;
        const totalMonthly = targetPlan.price * seatCount;
        const isSwitch = isPaid;
        const defaultCard = paymentMethods.find((pm) => pm.isDefault) || paymentMethods[0];

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50 dark:bg-black/60 backdrop-blur-sm" onClick={() => setConfirmingPlan(null)} />
            <div className="relative w-full max-w-lg mx-4 bg-white dark:bg-card-dark border border-gray-200 dark:border-border-dark rounded-2xl shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="px-6 py-5 border-b border-gray-100 dark:border-border-dark">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl ${targetPlan.bgColor} flex items-center justify-center`}>
                    <PlanIcon size={20} className={targetPlan.color} />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                      {isSwitch ? 'Switch' : 'Upgrade'} to {targetPlan.name}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Review your subscription details</p>
                  </div>
                </div>
              </div>

              {/* Pricing breakdown */}
              <div className="px-6 py-5 space-y-4">
                <div className="bg-gray-50 dark:bg-black/20 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Plan</span>
                    <span className="font-semibold text-gray-900 dark:text-white">{targetPlan.name}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Price per seat</span>
                    <span className="font-semibold text-gray-900 dark:text-white">${targetPlan.price}/month</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Current seats</span>
                    <span className="font-semibold text-gray-900 dark:text-white">{seatCount} {seatCount === 1 ? 'member' : 'members'}</span>
                  </div>
                  <div className="border-t border-gray-200 dark:border-border-dark pt-3 flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">Estimated monthly total</span>
                    <span className="text-lg font-bold text-gray-900 dark:text-white">${totalMonthly}/mo</span>
                  </div>
                </div>

                {/* Payment method */}
                {defaultCard && (
                  <div className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 dark:border-border-dark">
                    <CardBrandIcon brand={defaultCard.brand} className="w-10 h-7 rounded" />
                    <div className="flex-1">
                      <p className="text-xs font-medium text-gray-700 dark:text-gray-200">
                        {CARD_BRAND_LABELS[defaultCard.brand.toLowerCase()] || defaultCard.brand} ending in {defaultCard.last4}
                      </p>
                      <p className="text-[10px] text-gray-400 dark:text-gray-500">
                        Expires {String(defaultCard.expiryMonth).padStart(2, '0')}/{defaultCard.expiryYear}
                      </p>
                    </div>
                    {defaultCard.isDefault && (
                      <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary text-[9px] font-bold uppercase">Default</span>
                    )}
                  </div>
                )}

                {/* Proration note */}
                <div className="flex items-start gap-2 text-[11px] text-gray-400 dark:text-gray-500 leading-relaxed">
                  <AlertCircle size={13} className="shrink-0 mt-0.5" />
                  <span>
                    {isSwitch
                      ? 'Plan change takes effect immediately. Stripe will prorate the charge for the remainder of your current billing period.'
                      : 'Your card will be charged after confirmation. Seat count adjusts automatically as members join or leave.'}
                  </span>
                </div>

                {/* Payment error */}
                {paymentError && (
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20">
                    <AlertCircle size={14} className="text-red-500 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-xs text-red-700 dark:text-red-300 font-medium">{paymentError}</p>
                      <p className="text-[10px] text-red-500 dark:text-red-400">Try another card or retry the payment.</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="px-6 py-4 border-t border-gray-100 dark:border-border-dark flex items-center justify-end gap-3 bg-gray-50/50 dark:bg-black/10">
                <button
                  onClick={() => { setConfirmingPlan(null); setPaymentError(null); }}
                  disabled={paymentProcessing}
                  className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-200 dark:border-border-dark text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 disabled:opacity-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmSubscribe}
                  disabled={isMutating}
                  className="px-5 py-2 text-sm font-semibold rounded-lg bg-primary text-white hover:bg-primary/90 disabled:opacity-50 transition-all shadow-lg shadow-primary/20 flex items-center gap-2"
                >
                  {paymentProcessing ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Confirming payment...
                    </>
                  ) : isMutating ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Processing...
                    </>
                  ) : paymentError ? (
                    <>Retry payment</>
                  ) : (
                    <>Confirm & {isSwitch ? 'Switch' : 'Subscribe'}</>
                  )}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── Add card modal ── */}
      {showAddCard && setupClientSecret && (
        <AddCardModal
          clientSecret={setupClientSecret}
          onSuccess={handleCardSaved}
          onClose={() => {
            setShowAddCard(false);
            setSetupClientSecret(null);
            setPendingPlanAfterCard(null);
          }}
        />
      )}
    </div>
  );
};

// ── Exported page wraps content in Stripe provider ──

export const BillingPage: React.FC = () => {
  return (
    <StripeProvider>
      <BillingContent />
    </StripeProvider>
  );
};
