import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Mail, Lock, ShieldCheck, KeyRound } from 'lucide-react';
import { useSignIn } from '@clerk/clerk-react';
import { useToastStore } from '@/app/stores/useToastStore';
import { Logo, FormInput, OTPInput, SubmitButton, BackLink, AuthFooter } from './shared';

/**
 * ForgotPasswordPage — /forgot-password
 *
 * Uses Clerk's useSignIn with the 'reset_password_email_code' strategy.
 * Flow:
 * 1. User enters email
 * 2. Clerk sends a reset code to that email
 * 3. Navigate to /reset-password where user enters code + new password
 */
export const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const showToast = useToastStore((s) => s.showToast);

  // Clerk's sign-in hook — used for password reset flow
  const { signIn, isLoaded } = useSignIn();

  // Form state
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Request a password reset code from Clerk.
   * Clerk sends a 6-digit code to the user's email.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded || !signIn) return;

    console.log('[ForgotPassword] Requesting reset code for:', email);
    setIsSubmitting(true);
    try {
      // Tell Clerk to send a reset code to this email
      await signIn.create({
        strategy: 'reset_password_email_code',
        identifier: email,
      });
      console.log('[ForgotPassword] Reset code sent. Redirecting to /reset-password');

      // Code sent successfully → navigate to reset page
      navigate('/reset-password');
    } catch (err: any) {
      const clerkError = err.errors?.[0];
      const message = clerkError?.longMessage || clerkError?.message || 'Failed to send reset code';
      console.error('[ForgotPassword] Failed:', clerkError?.code, message);
      showToast(message, 'error', 'Reset failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-bg-dark selection:bg-primary/30">
      <div className="px-5 sm:px-8 py-5"><Logo /></div>

      <div className="flex-1 flex items-center justify-center px-5 sm:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="w-full max-w-md text-center"
        >
          {/* Animated key icon */}
          <div className="mx-auto w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center mb-6">
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            >
              <KeyRound size={36} className="text-primary" />
            </motion.div>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold dark:text-white tracking-tight">Forgot password?</h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
            No worries — enter your email and we'll send you a code to reset it.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5 text-left">
            <FormInput icon={<Mail size={16} />} type="email" placeholder="name@company.com" value={email} onChange={setEmail} label="Email address" />
            <SubmitButton disabled={isSubmitting}>
              {isSubmitting ? 'Sending...' : 'Send Reset Code'}
            </SubmitButton>
          </form>

          <div className="mt-6">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Remember your password?{' '}
              <button onClick={() => navigate('/login')} className="text-primary font-semibold hover:underline">Log in</button>
            </p>
          </div>

          <div className="mt-4">
            <BackLink to="/login" label="Back to login" />
          </div>
        </motion.div>
      </div>

      <AuthFooter />
    </div>
  );
};

/**
 * ResetPasswordPage — /reset-password
 *
 * User enters the 6-digit code from their email + a new password.
 * Uses Clerk's signIn.attemptFirstFactor to verify code and set new password in one step.
 * On success: session is created, user is logged in and redirected to dashboard.
 */
export const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const showToast = useToastStore((s) => s.showToast);

  // Clerk's sign-in hook — persists the in-progress reset flow
  const { signIn, setActive, isLoaded } = useSignIn();

  // Form state
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Verify the reset code and set the new password.
   * Clerk handles both in a single attemptFirstFactor call.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded || !signIn) return;

    // Client-side validation: passwords must match
    if (password !== confirm) {
      showToast('Passwords do not match', 'error');
      return;
    }

    console.log('[ResetPassword] Attempting password reset with code');
    setIsSubmitting(true);
    try {
      // Verify the code and set the new password in one step
      const result = await signIn.attemptFirstFactor({
        strategy: 'reset_password_email_code',
        code,
        password,
      });
      console.log('[ResetPassword] Reset result status:', result.status);

      if (result.status === 'complete') {
        // Password reset successful! Activate the session
        console.log('[ResetPassword] Password reset complete. Activating session.');
        await setActive({ session: result.createdSessionId });
        showToast('Password reset successfully!', 'success');
        console.log('[ResetPassword] Redirecting to /dashboard');
        navigate('/dashboard');
      } else {
        console.log('[ResetPassword] Reset not complete. Status:', result.status);
      }
    } catch (err: any) {
      const clerkError = err.errors?.[0];
      const message = clerkError?.longMessage || clerkError?.message || 'Reset failed. Check your code.';
      console.error('[ResetPassword] Failed:', clerkError?.code, message);
      showToast(message, 'error', 'Password reset failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-bg-dark selection:bg-primary/30">
      <div className="px-5 sm:px-8 py-5"><Logo /></div>

      <div className="flex-1 flex items-center justify-center px-5 sm:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="w-full max-w-md text-center"
        >
          {/* Animated shield icon */}
          <div className="mx-auto w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center mb-6">
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            >
              <ShieldCheck size={36} className="text-primary" />
            </motion.div>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold dark:text-white tracking-tight">Set new password</h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
            Enter the code from your email and choose a new password.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5 text-left">
            {/* 6-digit reset code */}
            <div className="space-y-2">
              <label className="text-[13px] font-medium text-gray-700 dark:text-gray-300">Reset code</label>
              <OTPInput length={6} onComplete={setCode} />
            </div>

            <FormInput icon={<Lock size={16} />} type="password" placeholder="Enter new password" value={password} onChange={setPassword} label="New password" />
            <FormInput icon={<ShieldCheck size={16} />} type="password" placeholder="Confirm new password" value={confirm} onChange={setConfirm} label="Confirm password" />

            <div className="pt-1">
              <SubmitButton disabled={isSubmitting}>
                {isSubmitting ? 'Resetting...' : 'Reset Password'}
              </SubmitButton>
            </div>
          </form>

          <div className="mt-6">
            <BackLink to="/login" label="Back to login" />
          </div>
        </motion.div>
      </div>

      <AuthFooter />
    </div>
  );
};
