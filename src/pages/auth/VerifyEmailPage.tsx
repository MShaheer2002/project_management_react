import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Mail, ShieldCheck } from 'lucide-react';
import { useSignUp } from '@clerk/clerk-react';
import { useToastStore } from '@/app/stores/useToastStore';
import { Logo, OTPInput, SubmitButton, BackLink, AuthFooter } from './shared';

/**
 * VerifyEmailPage — /email-verification
 *
 * User enters the 6-digit OTP code sent to their email by Clerk.
 * On success: activates the Clerk session → navigates to /org-creation.
 *
 * This page uses the same useSignUp hook from the signup flow.
 * Clerk persists the sign-up attempt across pages, so signUp.attemptEmailAddressVerification
 * works even though we navigated here from /signup.
 */
export const VerifyEmailPage: React.FC = () => {
  const navigate = useNavigate();
  const showToast = useToastStore((s) => s.showToast);

  // Clerk's sign-up hook — persists the in-progress sign-up across navigation
  const { signUp, setActive, isLoaded } = useSignUp();

  // Form state
  const [code, setCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Submit the 6-digit OTP code to Clerk for verification.
   * On success: session is created, user is redirected to workspace creation.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded || !signUp) return;

    console.log('[VerifyEmail] Submitting OTP code:', code);
    setIsSubmitting(true);
    try {
      // Attempt to verify the email with the 6-digit code
      const result = await signUp.attemptEmailAddressVerification({ code });
      console.log('[VerifyEmail] Verification result status:', result.status);

      if (result.status === 'complete') {
        // Email verified! Activate the session so the user is now logged in
        console.log('[VerifyEmail] Email verified. Activating session:', result.createdSessionId);
        await setActive({ session: result.createdSessionId });
        console.log('[VerifyEmail] Session active. Redirecting to /org-creation');
        // New user → redirect to workspace creation
        navigate('/org-creation');
      } else {
        console.log('[VerifyEmail] Verification not complete. Status:', result.status);
      }
    } catch (err: any) {
      const clerkError = err.errors?.[0];
      const message = clerkError?.longMessage || clerkError?.message || 'Invalid verification code';
      console.error('[VerifyEmail] Verification failed:', clerkError?.code, message);
      showToast(message, 'error', 'Verification failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Resend the OTP verification code.
   * Clerk sends a new code to the same email address.
   */
  const handleResend = async () => {
    if (!isLoaded || !signUp) return;

    try {
      console.log('[VerifyEmail] Resending verification code...');
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      console.log('[VerifyEmail] Code resent successfully');
      showToast('Verification code resent!', 'success');
    } catch (err: any) {
      console.error('[VerifyEmail] Resend failed:', err);
      showToast('Failed to resend code. Try again.', 'error', 'Resend failed');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-bg-dark selection:bg-primary/30">
      {/* Top bar with progress stepper */}
      <div className="px-5 sm:px-8 py-5 flex items-center justify-between">
        <Logo />
        {/* 3-step progress: Account ✓ → Verify (active) → Workspace */}
        <div className="hidden sm:flex items-center gap-2">
          {['Account', 'Verify', 'Workspace'].map((step, i) => (
            <React.Fragment key={step}>
              {i > 0 && <div className={`w-8 h-0.5 rounded-full ${i <= 1 ? 'bg-primary' : 'bg-gray-200 dark:bg-white/10'}`} />}
              <div className="flex items-center gap-1.5">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  i < 1 ? 'bg-primary text-white'                    // completed
                    : i === 1 ? 'bg-primary text-white ring-4 ring-primary/20'  // active
                    : 'bg-gray-200 dark:bg-white/10 text-gray-400'  // upcoming
                }`}>
                  {i < 1 ? <ShieldCheck size={12} /> : i + 1}
                </div>
                <span className={`text-xs font-medium ${i <= 1 ? 'text-gray-700 dark:text-gray-200' : 'text-gray-400'}`}>{step}</span>
              </div>
            </React.Fragment>
          ))}
        </div>
        <div className="w-24" /> {/* Spacer for centering */}
      </div>

      {/* Center content */}
      <div className="flex-1 flex items-center justify-center px-5 sm:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="w-full max-w-md text-center"
        >
          {/* Animated mail icon */}
          <div className="mx-auto w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center mb-6">
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.2, type: 'spring', stiffness: 200 }}
            >
              <Mail size={36} className="text-primary" />
            </motion.div>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold dark:text-white tracking-tight">Check your email</h1>
          <p className="mt-3 text-sm text-gray-500 dark:text-gray-400 leading-relaxed max-w-sm mx-auto">
            We sent a 6-digit verification code to your email. Enter it below to continue.
          </p>

          {/* OTP form */}
          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            {/* OTPInput component handles auto-advance, backspace, and paste */}
            <OTPInput length={6} onComplete={setCode} />

            <SubmitButton disabled={isSubmitting}>
              {isSubmitting ? 'Verifying...' : 'Verify & Continue'}
            </SubmitButton>
          </form>

          {/* Resend + back links */}
          <div className="mt-6 space-y-3">
            <p className="text-sm text-gray-400 dark:text-gray-500">
              Didn't receive the code?{' '}
              <button type="button" onClick={handleResend} className="text-primary font-semibold hover:underline">
                Resend code
              </button>
            </p>
            <BackLink to="/signup" label="Back to sign up" />
          </div>
        </motion.div>
      </div>

      <AuthFooter />
    </div>
  );
};
