import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Mail, Lock, Chrome, Github, Layers, Star } from 'lucide-react';
import { useSignIn } from '@clerk/clerk-react';
import { useToastStore } from '@/app/stores/useToastStore';
import { Logo, FormInput, SocialButton, Divider, SubmitButton, AuthFooter } from './shared';

/**
 * LoginPage — /login
 *
 * Uses Clerk's useSignIn hook for authentication.
 * Supports: email/password login, Google OAuth, GitHub OAuth.
 * On success: sets active session → AuthSync populates the Zustand store.
 */
export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const showToast = useToastStore((s) => s.showToast);

  // Clerk's headless sign-in hook — handles all auth logic
  const { signIn, setActive, isLoaded } = useSignIn();

  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Handle email + password sign in.
   * Clerk validates credentials and returns a session.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded || !signIn) return;

    console.log('[Login] Attempting email/password sign-in for:', email);
    setIsSubmitting(true);
    try {
      // Attempt sign-in with Clerk
      const result = await signIn.create({
        identifier: email,
        password,
      });
      console.log('[Login] Clerk signIn result status:', result.status);

      // If sign-in is complete, activate the session
      if (result.status === 'complete') {
        console.log('[Login] Sign-in complete. Activating session:', result.createdSessionId);
        await setActive({ session: result.createdSessionId });
        console.log('[Login] Session activated. Redirecting to /dashboard');
        // AuthSync will detect the session and populate the store
        navigate('/dashboard');
      } else {
        console.log('[Login] Sign-in not complete. Status:', result.status);
      }
    } catch (err: any) {
      // Extract Clerk error message for user display
      const clerkError = err.errors?.[0];
      const message = clerkError?.longMessage || clerkError?.message || 'Invalid email or password';
      console.error('[Login] Sign-in failed:', clerkError?.code, message);
      showToast(message, 'error', 'Sign-in failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Handle OAuth sign-in (Google or GitHub).
   * Redirects to the provider's login page, then back to /sso-callback.
   */
  const handleOAuth = async (provider: 'oauth_google' | 'oauth_github') => {
    if (!isLoaded || !signIn) return;

    console.log('[Login] Starting OAuth flow with provider:', provider);
    try {
      await signIn.authenticateWithRedirect({
        strategy: provider,
        redirectUrl: '/sso-callback',        // Clerk processes the OAuth code here
        redirectUrlComplete: '/dashboard',   // Final destination after auth is done
      });
      // Note: this line won't execute — the browser redirects to the provider
    } catch (err: any) {
      const message = err.errors?.[0]?.message || 'OAuth sign-in failed';
      console.error('[Login] OAuth failed:', message);
      showToast(message, 'error', 'OAuth failed');
    }
  };

  return (
    <div className="min-h-screen flex bg-white dark:bg-bg-dark selection:bg-primary/30">
      {/* ── Left: Immersive brand panel (desktop only) ── */}
      <div className="hidden lg:flex lg:w-[50%] xl:w-[55%] shrink-0 flex-col relative bg-[#0a0c16] overflow-hidden select-none">
        {/* Gradient background layers */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/25 via-transparent to-violet-600/15" />
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[700px] h-[700px] bg-primary/15 rounded-full blur-[160px]" />
          <div className="absolute bottom-0 left-0 w-[350px] h-[350px] bg-violet-500/10 rounded-full blur-[120px]" />
          {/* Subtle grid pattern */}
          <div
            className="absolute inset-0 opacity-[0.025]"
            style={{
              backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)',
              backgroundSize: '56px 56px',
            }}
          />
        </div>

        <div className="relative z-10 flex flex-col h-full p-8 xl:p-12">
          {/* Logo with light styling for dark background */}
          <Logo className="[&_span]:text-white/90 [&_div]:bg-white/15 [&_div]:border [&_div]:border-white/10 [&_div]:shadow-none" />

          {/* Center content — glassmorphic app preview card */}
          <div className="flex-1 flex items-center justify-center">
            <div className="w-full max-w-sm">
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
              >
                {/* Glow behind card */}
                <div className="relative">
                  <div className="absolute -inset-3 bg-primary/10 rounded-3xl blur-xl" />
                  <div className="relative bg-white/[0.05] backdrop-blur-xl rounded-2xl border border-white/[0.07] p-6 space-y-4">
                    {/* Mock sprint header */}
                    <div className="flex items-center gap-3 mb-1">
                      <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                        <Layers size={14} className="text-primary" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-white/90">Sprint 14</div>
                        <div className="text-[10px] text-white/35">12 issues &middot; 4 members</div>
                      </div>
                    </div>
                    {/* Animated progress bars */}
                    {[
                      { label: 'Completed', pct: 68, color: 'bg-green-400' },
                      { label: 'In Progress', pct: 24, color: 'bg-blue-400' },
                      { label: 'Remaining', pct: 8, color: 'bg-white/20' },
                    ].map((r) => (
                      <div key={r.label} className="flex items-center gap-3">
                        <span className="text-[10px] text-white/40 w-16">{r.label}</span>
                        <div className="flex-1 h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${r.pct}%` }}
                            transition={{ duration: 1, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
                            className={`h-full ${r.color} rounded-full`}
                          />
                        </div>
                        <span className="text-[10px] text-white/35 w-6 text-right">{r.pct}%</span>
                      </div>
                    ))}
                    {/* Mock task rows */}
                    {[
                      { id: 'LIN-42', t: 'OAuth2 flow', c: 'bg-orange-400', s: 'In Progress' },
                      { id: 'LIN-43', t: 'Design tokens', c: 'bg-blue-400', s: 'Review' },
                      { id: 'LIN-44', t: 'Rate limiting', c: 'bg-red-400', s: 'Todo' },
                    ].map((t) => (
                      <div key={t.id} className="flex items-center gap-3 py-2 px-3 rounded-xl bg-white/[0.03] border border-white/[0.04]">
                        <div className={`w-1.5 h-1.5 rounded-full ${t.c}`} />
                        <span className="text-[11px] text-white/75 font-medium flex-1">{t.t}</span>
                        <span className="text-[9px] text-white/35 bg-white/[0.05] px-2 py-0.5 rounded-md">{t.s}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Testimonial */}
                <div className="mt-8 text-center">
                  <div className="flex justify-center gap-0.5 mb-3">
                    {[...Array(5)].map((_, i) => <Star key={i} size={12} className="text-yellow-400 fill-yellow-400" />)}
                  </div>
                  <p className="text-[13px] text-white/45 italic leading-relaxed">"Replaced 3 tools. Velocity up 40% in month one."</p>
                  <p className="mt-2 text-[11px] text-white/25 font-medium">Emily Z. — VP Eng, ScaleAI</p>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Bottom stats */}
          <div className="flex gap-6 text-white/25">
            {[{ v: '10k+', l: 'Teams' }, { v: '2M+', l: 'Issues' }, { v: '99.9%', l: 'Uptime' }].map((s) => (
              <div key={s.l}>
                <div className="text-sm font-bold text-white/50">{s.v}</div>
                <div className="text-[10px]">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right: Login form ── */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Mobile-only logo header */}
        <div className="lg:hidden px-5 py-4"><Logo /></div>

        <div className="flex-1 flex items-center justify-center px-5 sm:px-8 lg:px-12 py-8">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="w-full max-w-[420px]"
          >
            <h1 className="text-2xl sm:text-3xl font-bold dark:text-white tracking-tight">Welcome back</h1>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Sign in to your workspace to continue.</p>

            {/* OAuth buttons — Google and GitHub */}
            <div className="mt-8 grid grid-cols-2 gap-3">
              <SocialButton icon={<Chrome size={18} />} label="Google" onClick={() => handleOAuth('oauth_google')} />
              <SocialButton icon={<Github size={18} />} label="GitHub" onClick={() => handleOAuth('oauth_github')} />
            </div>

            <Divider text="Or use email" />

            {/* Email + password form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <FormInput icon={<Mail size={16} />} type="email" placeholder="name@company.com" value={email} onChange={setEmail} label="Email" />
              <FormInput
                icon={<Lock size={16} />}
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={setPassword}
                label="Password"
                rightElement={
                  <button type="button" onClick={() => navigate('/forgot-password')} className="text-xs text-primary font-medium hover:underline">
                    Forgot?
                  </button>
                }
              />
              <div className="pt-1">
                <SubmitButton disabled={isSubmitting}>
                  {isSubmitting ? 'Signing in...' : 'Sign In'}
                </SubmitButton>
              </div>
            </form>

            {/* Link to signup */}
            <p className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
              Don't have an account?{' '}
              <button onClick={() => navigate('/signup')} className="text-primary font-semibold hover:underline">Sign up</button>
            </p>
          </motion.div>
        </div>

        <AuthFooter />
      </div>
    </div>
  );
};
