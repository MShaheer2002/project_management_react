import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { Mail, Lock, Chrome, Github, User, CheckCircle2, Zap, Shield, Globe } from 'lucide-react';
import { useSignUp } from '@clerk/clerk-react';
import { useToastStore } from '@/app/stores/useToastStore';
import { Logo, FormInput, SocialButton, Divider, SubmitButton, AuthFooter, TermsText } from './shared';

/**
 * SignupPage — /signup
 *
 * Uses Clerk's useSignUp hook to create a new account.
 * Flow: Fill form → Clerk creates sign-up attempt → sends OTP email → navigate to /email-verification.
 * Supports: email/password signup, Google OAuth, GitHub OAuth.
 */
export const SignupPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const showToast = useToastStore((s) => s.showToast);
  const redirectTo = getSafeRedirect(searchParams.get('redirect')) || '/org-creation';

  // Clerk's headless sign-up hook
  const { signUp, isLoaded } = useSignUp();

  // Form state
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Handle email + password sign up.
   * 1. Create the sign-up attempt with Clerk
   * 2. Clerk sends a verification code to the user's email
   * 3. Navigate to /email-verification where the user enters the code
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded || !signUp) return;

    console.log('[Signup] Attempting sign-up for:', email, '| Name:', fullName);
    setIsSubmitting(true);
    try {
      // Step 1: Create sign-up attempt in Clerk
      console.log('[Signup] Step 1: Creating sign-up attempt in Clerk...');
      await signUp.create({
        emailAddress: email,
        password,
        firstName: fullName.split(' ')[0] || '',
        lastName: fullName.split(' ').slice(1).join(' ') || '',
      });
      console.log('[Signup] Step 1 complete. Sign-up attempt created.');

      // Step 2: Request email verification code (6-digit OTP)
      console.log('[Signup] Step 2: Sending email verification code...');
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      console.log('[Signup] Step 2 complete. OTP sent to:', email);

      // Step 3: Redirect to OTP verification page
      console.log('[Signup] Step 3: Redirecting to /email-verification');
      navigate(`/email-verification?redirect=${encodeURIComponent(redirectTo)}`);
    } catch (err: any) {
      // Extract Clerk error for display
      const clerkError = err.errors?.[0];
      const message = clerkError?.longMessage || clerkError?.message || 'Sign up failed. Please try again.';
      console.error('[Signup] Sign-up failed:', clerkError?.code, message);
      showToast(message, 'error',);
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Handle OAuth sign-up (Google or GitHub).
   * Uses signUp (not signIn) so Clerk knows this is a new user flow.
   * After OAuth completes, Clerk redirects to /sso-callback → onboarding or the preserved invite link.
   */
  const handleOAuth = async (provider: 'oauth_google' | 'oauth_github') => {
    if (!isLoaded || !signUp) return;

    console.log('[Signup] Starting OAuth flow with provider:', provider);
    try {
      await signUp.authenticateWithRedirect({
        strategy: provider,
        redirectUrl: '/sso-callback',
        redirectUrlComplete: redirectTo,
      });
      // Note: browser redirects — this line won't execute
    } catch (err: any) {
      const message = err.errors?.[0]?.message || 'OAuth sign-up failed';
      console.error('[Signup] OAuth failed:', message);
      showToast(message, 'error',);
    }
  };

  return (
    <div className="min-h-screen flex bg-white dark:bg-bg-dark selection:bg-primary/30">
      {/* ── Left: Feature showcase panel (desktop only) ── */}
      <div
        className="hidden lg:flex lg:w-[50%] xl:w-[55%] shrink-0 flex-col relative overflow-hidden select-none"
        style={{ background: 'linear-gradient(135deg, #1a1040 0%, #0f0d24 40%, #0a0c16 100%)' }}
      >
        {/* Background effects */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 right-0 w-[500px] h-[500px] bg-violet-600/15 rounded-full blur-[150px]" />
          <div className="absolute bottom-1/4 left-0 w-[400px] h-[400px] bg-primary/10 rounded-full blur-[130px]" />
          <div
            className="absolute inset-0 opacity-[0.02]"
            style={{
              backgroundImage: 'radial-gradient(circle, rgba(255,255,255,.15) 1px, transparent 1px)',
              backgroundSize: '32px 32px',
            }}
          />
        </div>

        <div className="relative z-10 flex flex-col h-full p-8 xl:p-12">
          <Logo className="[&_span]:text-white/90 [&_div]:bg-white/15 [&_div]:border [&_div]:border-white/10 [&_div]:shadow-none" />

          {/* Feature bullets */}
          <div className="flex-1 flex flex-col justify-center max-w-md">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
            >
              <h2 className="text-3xl xl:text-4xl font-bold text-white leading-tight">
                Start building<br />something great.
              </h2>
              <p className="mt-4 text-white/40 leading-relaxed">
                Join 10,000+ teams already using Trussen to ship faster.
              </p>

              <div className="mt-10 space-y-5">
                {[
                  { icon: <Zap size={18} className="text-yellow-400" />, title: 'Lightning fast', desc: 'Keyboard-first, sub-50ms interactions' },
                  { icon: <Shield size={18} className="text-emerald-400" />, title: 'Enterprise secure', desc: 'SAML SSO, 2FA, audit logs' },
                  { icon: <Globe size={18} className="text-blue-400" />, title: 'Real-time sync', desc: 'Live updates across your whole team' },
                  { icon: <CheckCircle2 size={18} className="text-purple-400" />, title: 'Free to start', desc: 'No credit card. Up to 10 members free.' },
                ].map((f, i) => (
                  <motion.div
                    key={f.title}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 + i * 0.1 }}
                    className="flex gap-4"
                  >
                    <div className="w-10 h-10 rounded-xl bg-white/[0.06] border border-white/[0.05] flex items-center justify-center shrink-0">
                      {f.icon}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-white/85">{f.title}</div>
                      <div className="text-xs text-white/35 mt-0.5">{f.desc}</div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>

          <p className="text-[10px] text-white/20">&copy; 2025 Trussen Inc.</p>
        </div>
      </div>

      {/* ── Right: Signup form ── */}
      <div className="flex-1 flex flex-col min-h-screen">
        <div className="lg:hidden px-5 py-4"><Logo /></div>

        <div className="flex-1 flex items-center justify-center px-5 sm:px-8 lg:px-12 py-8">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="w-full max-w-[420px]"
          >
            <h1 className="text-2xl sm:text-3xl font-bold dark:text-white tracking-tight">Create an account</h1>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Start managing projects with your team for free.</p>

            {/* OAuth buttons */}
            <div className="mt-8 grid grid-cols-2 gap-3">
              <SocialButton icon={<Chrome size={18} />} label="Google" onClick={() => handleOAuth('oauth_google')} />
              <SocialButton icon={<Github size={18} />} label="GitHub" onClick={() => handleOAuth('oauth_github')} />
            </div>

            <Divider text="Or register with email" />

            {/* Email signup form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <FormInput icon={<User size={16} />} placeholder="John Doe" value={fullName} onChange={setFullName} label="Full name" />
              <FormInput icon={<Mail size={16} />} type="email" placeholder="name@company.com" value={email} onChange={setEmail} label="Email" />
              <FormInput icon={<Lock size={16} />} type="password" placeholder="Create a password" value={password} onChange={setPassword} label="Password" />
              <div className="pt-1">
                <SubmitButton disabled={isSubmitting}>
                  {isSubmitting ? 'Creating account...' : 'Create Account'}
                </SubmitButton>
              </div>
            </form>

            {/* Link to login */}
            <p className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
              Already have an account?{' '}
              <button onClick={() => navigate(`/login?redirect=${encodeURIComponent(redirectTo)}`)} className="text-primary font-semibold hover:underline">Log in</button>
            </p>
            <TermsText />
          </motion.div>
        </div>

        <AuthFooter />
      </div>
    </div>
  );
};

function getSafeRedirect(value: string | null): string | null {
  if (!value) return null;
  return value.startsWith('/') && !value.startsWith('//') ? value : null;
}
