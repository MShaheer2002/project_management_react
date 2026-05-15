import React, { useState, useRef, useEffect } from 'react';
import {
  Mail, Lock, Github, Chrome, ArrowRight, User, Building,
  ShieldCheck, Sparkles, Layers, BarChart3, Users, Star,
  CheckCircle2, Zap, ArrowLeft,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../AppContext';
import { MOCK_USERS } from '../constants';

type AuthMode = 'login' | 'signup' | 'org' | 'forgot-password' | 'reset-password' | 'email-verification';

/* ─── animation ─── */
const pageTransition = {
  initial: { opacity: 0, x: 12 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
  exit: { opacity: 0, x: -12, transition: { duration: 0.2 } },
};

/* ══════════════════════════════════════
   LEFT PANEL — immersive brand showcase
   ══════════════════════════════════════ */
const BrandPanel: React.FC<{ mode: AuthMode }> = ({ mode }) => {
  const navigate = useNavigate();

  return (
    <div className="hidden lg:flex lg:w-[50%] xl:w-[55%] shrink-0 flex-col relative bg-[#0c0e1a] overflow-hidden select-none">
      {/* Layered gradient background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-transparent to-violet-600/20" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-violet-500/10 rounded-full blur-[120px]" />
        <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-blue-500/10 rounded-full blur-[100px]" />
        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col h-full p-8 xl:p-12">
        {/* Logo */}
        <div
          className="flex items-center gap-2.5 cursor-pointer"
          onClick={() => navigate('/marketing')}
        >
          <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center text-white text-lg font-bold shadow-lg shadow-primary/30">
            L
          </div>
          <span className="text-lg font-bold text-white/90 tracking-tight">Linearis</span>
        </div>

        {/* Center — App mockup card */}
        <div className="flex-1 flex items-center justify-center py-12">
          <div className="w-full max-w-md">
            {/* Floating app preview */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="relative"
            >
              {/* Glow behind card */}
              <div className="absolute -inset-4 bg-primary/10 rounded-3xl blur-2xl" />

              <div className="relative bg-white/[0.06] backdrop-blur-xl rounded-2xl border border-white/[0.08] p-6 space-y-5">
                {/* Mock header */}
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                    <Layers size={14} className="text-primary" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white/90">Sprint 14 — Active</div>
                    <div className="text-[10px] text-white/40">12 issues &middot; 4 team members</div>
                  </div>
                </div>

                {/* Mock progress */}
                <div className="space-y-3">
                  {[
                    { label: 'Completed', pct: 68, color: 'bg-green-400' },
                    { label: 'In Progress', pct: 24, color: 'bg-blue-400' },
                    { label: 'Remaining', pct: 8, color: 'bg-white/20' },
                  ].map((r) => (
                    <div key={r.label} className="flex items-center gap-3">
                      <span className="text-[10px] text-white/50 w-16">{r.label}</span>
                      <div className="flex-1 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${r.pct}%` }}
                          transition={{ duration: 1.2, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
                          className={`h-full ${r.color} rounded-full`}
                        />
                      </div>
                      <span className="text-[10px] text-white/40 w-6 text-right">{r.pct}%</span>
                    </div>
                  ))}
                </div>

                {/* Mock task rows */}
                <div className="space-y-2">
                  {[
                    { id: 'LIN-42', title: 'Implement OAuth2 flow', priority: 'bg-orange-400', status: 'In Progress' },
                    { id: 'LIN-43', title: 'Design system tokens', priority: 'bg-blue-400', status: 'Review' },
                    { id: 'LIN-44', title: 'API rate limiting', priority: 'bg-red-400', status: 'Todo' },
                  ].map((t) => (
                    <div key={t.id} className="flex items-center gap-3 py-2.5 px-3 rounded-xl bg-white/[0.04] border border-white/[0.04]">
                      <div className={`w-1.5 h-1.5 rounded-full ${t.priority} shrink-0`} />
                      <div className="flex-1 min-w-0">
                        <div className="text-[11px] text-white/80 font-medium truncate">{t.title}</div>
                        <div className="text-[9px] text-white/30">{t.id}</div>
                      </div>
                      <span className="text-[9px] text-white/40 bg-white/[0.06] px-2 py-0.5 rounded-md">{t.status}</span>
                    </div>
                  ))}
                </div>

                {/* Mock team avatars */}
                <div className="flex items-center justify-between pt-1">
                  <div className="flex -space-x-2">
                    {['from-primary to-violet-500', 'from-emerald-400 to-cyan-500', 'from-orange-400 to-rose-500', 'from-blue-400 to-indigo-500'].map((g, i) => (
                      <div key={i} className={`w-7 h-7 rounded-full bg-gradient-to-br ${g} border-2 border-[#0c0e1a] ring-1 ring-white/5`} />
                    ))}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                    <span className="text-[10px] text-white/40">4 online</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Testimonial */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              className="mt-8 text-center"
            >
              <div className="flex items-center justify-center gap-0.5 mb-3">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={12} className="text-yellow-400 fill-yellow-400" />
                ))}
              </div>
              <p className="text-sm text-white/50 italic leading-relaxed max-w-xs mx-auto">
                "Linearis replaced 3 tools for us. Our velocity increased 40% in the first month."
              </p>
              <p className="mt-3 text-[11px] text-white/30 font-medium">Emily Zhang, VP Engineering at ScaleAI</p>
            </motion.div>
          </div>
        </div>

        {/* Bottom stats */}
        <div className="flex items-center gap-6 text-white/30">
          {[
            { value: '10k+', label: 'Teams' },
            { value: '2M+', label: 'Issues tracked' },
            { value: '99.9%', label: 'Uptime' },
          ].map((s) => (
            <div key={s.label}>
              <div className="text-sm font-bold text-white/60">{s.value}</div>
              <div className="text-[10px]">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════
   REUSABLE FORM COMPONENTS
   ══════════════════════════════════════ */
const FormInput: React.FC<{
  icon: React.ReactNode;
  type?: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  label: string;
  rightElement?: React.ReactNode;
}> = ({ icon, type = 'text', placeholder, value, onChange, label, rightElement }) => (
  <div className="space-y-2">
    <div className="flex justify-between items-center">
      <label className="text-[13px] font-medium text-gray-700 dark:text-gray-300">{label}</label>
      {rightElement}
    </div>
    <div className="relative group">
      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 group-focus-within:text-primary transition-colors">{icon}</span>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.08] rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all text-sm dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-600"
      />
    </div>
  </div>
);

const OTPInput: React.FC = () => {
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  const handleInput = (idx: number, val: string) => {
    if (val.length === 1 && idx < 3) refs.current[idx + 1]?.focus();
  };

  const handleKeyDown = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !(e.target as HTMLInputElement).value && idx > 0) {
      refs.current[idx - 1]?.focus();
    }
  };

  return (
    <div className="flex justify-center gap-3 sm:gap-4 py-2">
      {[0, 1, 2, 3].map((i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          onChange={(e) => handleInput(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          className="w-14 h-16 sm:w-16 sm:h-[72px] text-center text-2xl font-bold bg-gray-50 dark:bg-white/[0.04] border-2 border-gray-200 dark:border-white/[0.08] rounded-2xl outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all dark:text-white caret-primary"
        />
      ))}
    </div>
  );
};

const SocialButton: React.FC<{ icon: React.ReactNode; label: string }> = ({ icon, label }) => (
  <button className="flex items-center justify-center gap-2.5 py-3 bg-gray-50 dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.08] rounded-xl text-sm font-medium hover:bg-gray-100 dark:hover:bg-white/[0.07] hover:border-gray-300 dark:hover:border-white/[0.12] dark:text-white transition-all">
    {icon}
    {label}
  </button>
);

const Divider: React.FC<{ text: string }> = ({ text }) => (
  <div className="relative my-7">
    <div className="absolute inset-0 flex items-center">
      <div className="w-full border-t border-gray-200 dark:border-white/[0.06]" />
    </div>
    <div className="relative flex justify-center">
      <span className="bg-white dark:bg-bg-dark px-4 text-xs font-medium text-gray-400 dark:text-gray-600 uppercase tracking-wider">{text}</span>
    </div>
  </div>
);

const SubmitButton: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <button
    type="submit"
    className="w-full py-3.5 bg-primary text-white rounded-xl font-semibold text-sm hover:bg-primary/90 transition-all flex items-center justify-center gap-2 group shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 active:scale-[0.98]"
  >
    {children}
    <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
  </button>
);

/* ══════════════════════════════════════
   AUTH FORM — all modes
   ══════════════════════════════════════ */
const AuthForm: React.FC<{ mode: AuthMode }> = ({ mode }) => {
  const { setCurrentUser, setOrganization } = useApp();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [orgName, setOrgName] = useState('');
  const [workspaceUrl, setWorkspaceUrl] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'login') {
      setCurrentUser(MOCK_USERS[0]);
      setOrganization({ id: 'org1', name: 'Linearis Inc.', slug: 'linearis' });
      navigate('/');
    } else if (mode === 'signup') {
      navigate('/email-verification');
    } else if (mode === 'email-verification') {
      navigate('/org-creation');
    } else if (mode === 'org') {
      setCurrentUser(MOCK_USERS[0]);
      setOrganization({ id: 'org1', name: orgName || 'My Workspace', slug: workspaceUrl || 'my-workspace' });
      navigate('/');
    } else if (mode === 'forgot-password') {
      alert('Password reset link sent to your email.');
      navigate('/login');
    } else if (mode === 'reset-password') {
      alert('Password has been reset.');
      navigate('/login');
    }
  };

  const showBackButton = ['forgot-password', 'reset-password', 'email-verification'].includes(mode);

  return (
    <AnimatePresence mode="wait">
      <motion.div key={mode} {...pageTransition} className="w-full">
        {/* Back button for sub-flows */}
        {showBackButton && (
          <button
            onClick={() => navigate(mode === 'email-verification' ? '/signup' : '/login')}
            className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors mb-8 group"
          >
            <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
            Back
          </button>
        )}

        {/* Header */}
        <div className="mb-8">
          {mode === 'email-verification' && (
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-5">
              <Mail size={24} className="text-primary" />
            </div>
          )}
          {mode === 'org' && (
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-5">
              <Building size={24} className="text-primary" />
            </div>
          )}
          {mode === 'forgot-password' && (
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-5">
              <Lock size={24} className="text-primary" />
            </div>
          )}
          {mode === 'reset-password' && (
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-5">
              <ShieldCheck size={24} className="text-primary" />
            </div>
          )}

          <h1 className="text-2xl sm:text-3xl font-bold dark:text-white tracking-tight">
            {mode === 'login' && 'Welcome back'}
            {mode === 'signup' && 'Create an account'}
            {mode === 'org' && 'Create your workspace'}
            {mode === 'forgot-password' && 'Forgot password?'}
            {mode === 'reset-password' && 'Set new password'}
            {mode === 'email-verification' && 'Check your email'}
          </h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
            {mode === 'login' && 'Sign in to your workspace to continue.'}
            {mode === 'signup' && 'Start managing projects with your team for free.'}
            {mode === 'org' && 'This is your team\'s home on Linearis.'}
            {mode === 'forgot-password' && 'No worries — we\'ll send you reset instructions.'}
            {mode === 'reset-password' && 'Must be at least 8 characters.'}
            {mode === 'email-verification' && (
              <>We sent a code to <span className="text-gray-700 dark:text-gray-200 font-medium">{email || 'your email'}</span></>
            )}
          </p>
        </div>

        {/* ── LOGIN ── */}
        {mode === 'login' && (
          <>
            {/* Demo shortcuts */}
            <div className="mb-6">
              <p className="text-xs font-medium text-gray-400 dark:text-gray-500 mb-3 uppercase tracking-wider">Quick demo access</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {MOCK_USERS.map((user) => (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => {
                      setCurrentUser(user);
                      setOrganization({ id: 'org1', name: 'Linearis Inc.', slug: 'linearis' });
                      navigate('/');
                    }}
                    className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.02] hover:border-primary/40 hover:bg-primary/[0.03] transition-all text-left group"
                  >
                    <img
                      src={user.avatar}
                      className="w-9 h-9 rounded-full object-cover ring-2 ring-gray-100 dark:ring-white/10 group-hover:ring-primary/30 transition-all"
                      alt=""
                      referrerPolicy="no-referrer"
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold dark:text-white truncate">{user.name}</p>
                      <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">{user.role}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <Divider text="Or continue with" />

            <div className="grid grid-cols-2 gap-3 mb-6">
              <SocialButton icon={<Chrome size={18} />} label="Google" />
              <SocialButton icon={<Github size={18} />} label="GitHub" />
            </div>

            <Divider text="Or use email" />

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
                <SubmitButton>Sign In</SubmitButton>
              </div>
            </form>

            <p className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
              Don't have an account?{' '}
              <button onClick={() => navigate('/signup')} className="text-primary font-semibold hover:underline">Sign up</button>
            </p>
          </>
        )}

        {/* ── SIGNUP ── */}
        {mode === 'signup' && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <SocialButton icon={<Chrome size={18} />} label="Google" />
              <SocialButton icon={<Github size={18} />} label="GitHub" />
            </div>

            <Divider text="Or register with email" />

            <form onSubmit={handleSubmit} className="space-y-4">
              <FormInput icon={<User size={16} />} placeholder="John Doe" value={fullName} onChange={setFullName} label="Full name" />
              <FormInput icon={<Mail size={16} />} type="email" placeholder="name@company.com" value={email} onChange={setEmail} label="Email" />
              <FormInput icon={<Lock size={16} />} type="password" placeholder="Create a password" value={password} onChange={setPassword} label="Password" />
              <div className="pt-1">
                <SubmitButton>Create Account</SubmitButton>
              </div>
            </form>

            <p className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
              Already have an account?{' '}
              <button onClick={() => navigate('/login')} className="text-primary font-semibold hover:underline">Log in</button>
            </p>

            <p className="mt-4 text-center text-[11px] text-gray-400 dark:text-gray-600 leading-relaxed">
              By creating an account, you agree to our{' '}
              <span className="hover:underline cursor-pointer text-gray-500 dark:text-gray-400">Terms</span> and{' '}
              <span className="hover:underline cursor-pointer text-gray-500 dark:text-gray-400">Privacy Policy</span>.
            </p>
          </>
        )}

        {/* ── EMAIL VERIFICATION ── */}
        {mode === 'email-verification' && (
          <form onSubmit={handleSubmit} className="space-y-6">
            <OTPInput />
            <SubmitButton>Verify Email</SubmitButton>
            <p className="text-center text-sm text-gray-400">
              Didn't get the code?{' '}
              <button type="button" className="text-primary font-semibold hover:underline">Click to resend</button>
            </p>
          </form>
        )}

        {/* ── ORG CREATION ── */}
        {mode === 'org' && (
          <form onSubmit={handleSubmit} className="space-y-5">
            <FormInput icon={<Building size={16} />} placeholder="Acme Corp" value={orgName} onChange={setOrgName} label="Organization name" />
            <div className="space-y-2">
              <label className="text-[13px] font-medium text-gray-700 dark:text-gray-300">Workspace URL</label>
              <div className="flex group">
                <div className="relative flex-1">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 group-focus-within:text-primary transition-colors">
                    <Layers size={16} />
                  </span>
                  <input
                    type="text"
                    placeholder="acme"
                    value={workspaceUrl}
                    onChange={(e) => setWorkspaceUrl(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.08] rounded-l-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all text-sm dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-600"
                  />
                </div>
                <span className="inline-flex items-center px-4 py-3 bg-gray-100 dark:bg-white/[0.06] border border-l-0 border-gray-200 dark:border-white/[0.08] rounded-r-xl text-xs text-gray-400 dark:text-gray-500 font-medium whitespace-nowrap">
                  .linearis.app
                </span>
              </div>
            </div>
            <div className="pt-1">
              <SubmitButton>Create Workspace</SubmitButton>
            </div>
            <p className="text-center text-[11px] text-gray-400 dark:text-gray-600 leading-relaxed">
              By continuing, you agree to our{' '}
              <span className="hover:underline cursor-pointer text-gray-500 dark:text-gray-400">Terms</span> and{' '}
              <span className="hover:underline cursor-pointer text-gray-500 dark:text-gray-400">Privacy Policy</span>.
            </p>
          </form>
        )}

        {/* ── FORGOT PASSWORD ── */}
        {mode === 'forgot-password' && (
          <form onSubmit={handleSubmit} className="space-y-5">
            <FormInput icon={<Mail size={16} />} type="email" placeholder="name@company.com" value={email} onChange={setEmail} label="Email address" />
            <SubmitButton>Send Reset Link</SubmitButton>
            <p className="text-center text-sm text-gray-500 dark:text-gray-400">
              Remember your password?{' '}
              <button type="button" onClick={() => navigate('/login')} className="text-primary font-semibold hover:underline">Log in</button>
            </p>
          </form>
        )}

        {/* ── RESET PASSWORD ── */}
        {mode === 'reset-password' && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <FormInput icon={<Lock size={16} />} type="password" placeholder="Enter new password" value={password} onChange={setPassword} label="New password" />
            <FormInput icon={<ShieldCheck size={16} />} type="password" placeholder="Confirm new password" value="" onChange={() => {}} label="Confirm password" />
            <div className="pt-1">
              <SubmitButton>Reset Password</SubmitButton>
            </div>
            <p className="text-center text-sm text-gray-500 dark:text-gray-400">
              Remember your password?{' '}
              <button type="button" onClick={() => navigate('/login')} className="text-primary font-semibold hover:underline">Log in</button>
            </p>
          </form>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

/* ══════════════════════════════════════
   PAGE EXPORT
   ══════════════════════════════════════ */
export const AuthPage: React.FC<{ mode: AuthMode }> = ({ mode }) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex bg-white dark:bg-bg-dark selection:bg-primary/30">
      {/* Left — immersive brand panel */}
      <BrandPanel mode={mode} />

      {/* Right — form */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Mobile-only header */}
        <div className="lg:hidden flex items-center justify-between px-5 py-4">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/marketing')}>
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold shadow-lg shadow-primary/25">L</div>
            <span className="text-lg font-bold tracking-tight dark:text-white">Linearis</span>
          </div>
        </div>

        {/* Form area */}
        <div className="flex-1 flex items-center justify-center px-5 sm:px-8 lg:px-12 py-8">
          <div className="w-full max-w-[420px]">
            <AuthForm mode={mode} />
          </div>
        </div>

        {/* Bottom bar */}
        <div className="px-5 sm:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-gray-400 dark:text-gray-600">
          <span>&copy; 2025 Linearis Inc.</span>
          <div className="flex items-center gap-5">
            {['Privacy', 'Terms', 'Help'].map((l) => (
              <span key={l} className="hover:text-primary cursor-pointer transition-colors">{l}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
