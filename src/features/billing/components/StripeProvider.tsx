import React from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useThemeStore } from '@/app/stores/useThemeStore';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

function useResolvedTheme() {
  const theme = useThemeStore((s) => s.theme);
  if (theme !== 'system') return theme;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export const StripeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const resolvedTheme = useResolvedTheme();
  const isDark = resolvedTheme === 'dark';

  return (
    <Elements
      stripe={stripePromise}
      options={{
        appearance: {
          theme: isDark ? 'night' : 'stripe',
          variables: {
            colorPrimary: '#5f72ea',
            colorBackground: isDark ? '#1C1F2B' : '#FFFFFF',
            colorText: isDark ? '#e5e7eb' : '#1E1E1E',
            colorDanger: '#ef4444',
            borderRadius: '8px',
            fontFamily: 'Inter, system-ui, sans-serif',
          },
        },
      }}
    >
      {children}
    </Elements>
  );
};
