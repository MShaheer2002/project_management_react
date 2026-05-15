import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Mail, Lock, ShieldCheck, KeyRound } from 'lucide-react';
import { Logo, FormInput, SubmitButton, BackLink, AuthFooter } from './shared';

/* ── Forgot Password ── */
export const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Password reset link sent to your email.');
    navigate('/login');
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
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto">No worries — enter your email and we'll send you a link to reset it.</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5 text-left">
            <FormInput icon={<Mail size={16} />} type="email" placeholder="name@company.com" value={email} onChange={setEmail} label="Email address" />
            <SubmitButton>Send Reset Link</SubmitButton>
          </form>

          <div className="mt-6">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Remember your password? <button onClick={() => navigate('/login')} className="text-primary font-semibold hover:underline">Log in</button>
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

/* ── Reset Password ── */
export const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Password has been reset.');
    navigate('/login');
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
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto">Must be at least 8 characters with one uppercase and one number.</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4 text-left">
            <FormInput icon={<Lock size={16} />} type="password" placeholder="Enter new password" value={password} onChange={setPassword} label="New password" />
            <FormInput icon={<ShieldCheck size={16} />} type="password" placeholder="Confirm new password" value={confirm} onChange={setConfirm} label="Confirm password" />
            <div className="pt-1"><SubmitButton>Reset Password</SubmitButton></div>
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
