import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ArrowLeft } from 'lucide-react';

/* ─── logo ─── */
export const Logo: React.FC<{ className?: string }> = ({ className = '' }) => {
  const navigate = useNavigate();
  return (
    <div className={`flex items-center gap-2.5 cursor-pointer ${className}`} onClick={() => navigate('/marketing')}>
      <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center text-white text-lg font-bold shadow-lg shadow-primary/25">
        L
      </div>
      <span className="text-lg font-bold tracking-tight dark:text-white">Linearis</span>
    </div>
  );
};

/* ─── form input ─── */
export const FormInput: React.FC<{
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

/* ─── OTP input (6 digits) ─── */
export const OTPInput: React.FC<{ length?: number }> = ({ length = 6 }) => {
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  const handleInput = (idx: number, val: string) => {
    if (val.length === 1 && idx < length - 1) refs.current[idx + 1]?.focus();
  };
  const handleKeyDown = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !(e.target as HTMLInputElement).value && idx > 0)
      refs.current[idx - 1]?.focus();
  };
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const data = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    data.split('').forEach((ch, i) => {
      if (refs.current[i]) {
        refs.current[i]!.value = ch;
        if (i < length - 1) refs.current[i + 1]?.focus();
      }
    });
  };

  return (
    <div className="flex justify-center gap-2 sm:gap-3" onPaste={handlePaste}>
      {Array.from({ length }).map((_, i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          onChange={(e) => handleInput(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          className="w-11 h-14 sm:w-12 sm:h-16 text-center text-xl sm:text-2xl font-bold bg-gray-50 dark:bg-white/[0.04] border-2 border-gray-200 dark:border-white/[0.08] rounded-xl outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all dark:text-white caret-primary"
        />
      ))}
    </div>
  );
};

/* ─── social button ─── */
export const SocialButton: React.FC<{ icon: React.ReactNode; label: string }> = ({ icon, label }) => (
  <button className="flex items-center justify-center gap-2.5 py-3 bg-gray-50 dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.08] rounded-xl text-sm font-medium hover:bg-gray-100 dark:hover:bg-white/[0.07] hover:border-gray-300 dark:hover:border-white/[0.12] dark:text-white transition-all active:scale-[0.98]">
    {icon}
    {label}
  </button>
);

/* ─── divider ─── */
export const Divider: React.FC<{ text: string }> = ({ text }) => (
  <div className="relative my-7">
    <div className="absolute inset-0 flex items-center">
      <div className="w-full border-t border-gray-200 dark:border-white/[0.06]" />
    </div>
    <div className="relative flex justify-center">
      <span className="bg-white dark:bg-bg-dark px-4 text-[11px] font-medium text-gray-400 dark:text-gray-600 uppercase tracking-wider">{text}</span>
    </div>
  </div>
);

/* ─── primary submit button ─── */
export const SubmitButton: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <button
    type="submit"
    className="w-full py-3.5 bg-primary text-white rounded-xl font-semibold text-sm hover:bg-primary/90 transition-all flex items-center justify-center gap-2 group shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 active:scale-[0.98]"
  >
    {children}
    <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
  </button>
);

/* ─── back link ─── */
export const BackLink: React.FC<{ to: string; label?: string }> = ({ to, label = 'Back' }) => {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate(to)}
      className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors group"
    >
      <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
      {label}
    </button>
  );
};

/* ─── bottom bar ─── */
export const AuthFooter: React.FC = () => (
  <div className="px-5 sm:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-gray-400 dark:text-gray-600">
    <span>&copy; 2025 Linearis Inc.</span>
    <div className="flex items-center gap-5">
      {['Privacy', 'Terms', 'Help'].map((l) => (
        <span key={l} className="hover:text-primary cursor-pointer transition-colors">{l}</span>
      ))}
    </div>
  </div>
);

/* ─── terms text ─── */
export const TermsText: React.FC = () => (
  <p className="mt-6 text-center text-[11px] text-gray-400 dark:text-gray-600 leading-relaxed">
    By continuing, you agree to our{' '}
    <span className="hover:underline cursor-pointer text-gray-500 dark:text-gray-400">Terms of Service</span> and{' '}
    <span className="hover:underline cursor-pointer text-gray-500 dark:text-gray-400">Privacy Policy</span>.
  </p>
);
