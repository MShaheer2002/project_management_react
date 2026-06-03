import React, { useState } from 'react';
import { CardNumberElement, CardExpiryElement, CardCvcElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { X, CreditCard, Lock } from 'lucide-react';
import { useThemeStore } from '@/app/stores/useThemeStore';

interface AddCardModalProps {
  clientSecret: string;
  onSuccess: (paymentMethodId: string) => void;
  onClose: () => void;
}

/**
 * Returns the resolved theme ('light' | 'dark') accounting for 'system'.
 */
function useResolvedTheme() {
  const theme = useThemeStore((s) => s.theme);
  if (theme !== 'system') return theme;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export const AddCardModal: React.FC<AddCardModalProps> = ({ clientSecret, onSuccess, onClose }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const resolvedTheme = useResolvedTheme();

  const ELEMENT_OPTIONS = {
    style: {
      base: {
        fontSize: '14px',
        color: resolvedTheme === 'dark' ? '#e5e7eb' : '#1E1E1E',
        fontFamily: 'Inter, system-ui, sans-serif',
        '::placeholder': { color: resolvedTheme === 'dark' ? '#6b7280' : '#9CA3AF' },
      },
      invalid: { color: '#ef4444' },
    },
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    const cardNumber = elements.getElement(CardNumberElement);
    if (!cardNumber) return;

    setLoading(true);
    setError(null);

    const { error: confirmError, setupIntent } = await stripe.confirmCardSetup(clientSecret, {
      payment_method: { card: cardNumber },
    });

    if (confirmError) {
      setError(confirmError.message || 'Failed to save card.');
      setLoading(false);
      return;
    }

    if (setupIntent?.payment_method) {
      onSuccess(typeof setupIntent.payment_method === 'string' ? setupIntent.payment_method : setupIntent.payment_method.id);
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 dark:bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md mx-4 bg-white dark:bg-card-dark border border-gray-200 dark:border-border-dark rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-border-dark">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <CreditCard size={18} className="text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Add payment method</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">Card details are stored securely by Stripe</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition-colors">
            <X size={16} className="text-gray-400 dark:text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Card Number */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Card number</label>
            <div className="px-3 py-3 rounded-lg border border-gray-200 dark:border-border-dark bg-gray-50 dark:bg-black/20 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/30 transition-all">
              <CardNumberElement options={ELEMENT_OPTIONS} />
            </div>
          </div>

          {/* Expiry + CVC row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Expiry date</label>
              <div className="px-3 py-3 rounded-lg border border-gray-200 dark:border-border-dark bg-gray-50 dark:bg-black/20 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/30 transition-all">
                <CardExpiryElement options={ELEMENT_OPTIONS} />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">CVC</label>
              <div className="px-3 py-3 rounded-lg border border-gray-200 dark:border-border-dark bg-gray-50 dark:bg-black/20 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/30 transition-all">
                <CardCvcElement options={ELEMENT_OPTIONS} />
              </div>
            </div>
          </div>

          {error && (
            <p className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 rounded-lg px-3 py-2">{error}</p>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
              <Lock size={12} />
              <span>Secured by Stripe</span>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-200 dark:border-border-dark text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!stripe || loading}
                className="px-4 py-2 text-sm font-semibold rounded-lg bg-primary text-white hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-primary/20"
              >
                {loading ? 'Saving...' : 'Save card'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
