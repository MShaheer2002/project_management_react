import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Mail, ShieldCheck, ArrowRight } from 'lucide-react';
import { Logo, OTPInput, SubmitButton, BackLink, AuthFooter } from './shared';

export const VerifyEmailPage: React.FC = () => {
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate('/org-creation');
  };

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-bg-dark selection:bg-primary/30">
      {/* Top bar */}
      <div className="px-5 sm:px-8 py-5 flex items-center justify-between">
        <Logo />
        {/* Progress indicator */}
        <div className="hidden sm:flex items-center gap-2">
          {['Account', 'Verify', 'Workspace'].map((step, i) => (
            <React.Fragment key={step}>
              {i > 0 && <div className={`w-8 h-0.5 rounded-full ${i <= 1 ? 'bg-primary' : 'bg-gray-200 dark:bg-white/10'}`} />}
              <div className="flex items-center gap-1.5">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  i < 1 ? 'bg-primary text-white' : i === 1 ? 'bg-primary text-white ring-4 ring-primary/20' : 'bg-gray-200 dark:bg-white/10 text-gray-400'
                }`}>
                  {i < 1 ? <ShieldCheck size={12} /> : i + 1}
                </div>
                <span className={`text-xs font-medium ${i <= 1 ? 'text-gray-700 dark:text-gray-200' : 'text-gray-400'}`}>{step}</span>
              </div>
            </React.Fragment>
          ))}
        </div>
        <div className="w-24" />
      </div>

      {/* Center content */}
      <div className="flex-1 flex items-center justify-center px-5 sm:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="w-full max-w-md text-center"
        >
          {/* Large icon */}
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

          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            <OTPInput length={6} />

            <SubmitButton>Verify & Continue</SubmitButton>
          </form>

          <div className="mt-6 space-y-3">
            <p className="text-sm text-gray-400 dark:text-gray-500">
              Didn't receive the code?{' '}
              <button type="button" className="text-primary font-semibold hover:underline">Resend code</button>
            </p>
            <BackLink to="/signup" label="Back to sign up" />
          </div>
        </motion.div>
      </div>

      <AuthFooter />
    </div>
  );
};
