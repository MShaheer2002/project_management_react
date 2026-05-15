import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Building, Layers, Users, ShieldCheck, Sparkles, ArrowRight, Globe, CheckCircle2 } from 'lucide-react';
import { useApp } from '@/AppContext';
import { MOCK_USERS } from '@/constants';
import { Logo, FormInput, SubmitButton, AuthFooter } from './shared';

export const CreateWorkspacePage: React.FC = () => {
  const { setCurrentUser, setOrganization } = useApp();
  const navigate = useNavigate();
  const [orgName, setOrgName] = useState('');
  const [workspaceUrl, setWorkspaceUrl] = useState('');
  const [teamSize, setTeamSize] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentUser(MOCK_USERS[0]);
    setOrganization({ id: 'org1', name: orgName || 'My Workspace', slug: workspaceUrl || 'my-workspace' });
    navigate('/');
  };

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-bg-dark selection:bg-primary/30">
      {/* Top bar with progress */}
      <div className="px-5 sm:px-8 py-5 flex items-center justify-between">
        <Logo />
        <div className="hidden sm:flex items-center gap-2">
          {['Account', 'Verify', 'Workspace'].map((step, i) => (
            <React.Fragment key={step}>
              {i > 0 && <div className="w-8 h-0.5 rounded-full bg-primary" />}
              <div className="flex items-center gap-1.5">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  i < 2 ? 'bg-primary text-white' : 'bg-primary text-white ring-4 ring-primary/20'
                }`}>
                  {i < 2 ? <CheckCircle2 size={12} /> : 3}
                </div>
                <span className={`text-xs font-medium ${i <= 2 ? 'text-gray-700 dark:text-gray-200' : 'text-gray-400'}`}>{step}</span>
              </div>
            </React.Fragment>
          ))}
        </div>
        <div className="w-24" />
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-5 sm:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="w-full max-w-lg"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <div className="mx-auto w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center mb-6">
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.2, type: 'spring', stiffness: 200 }}
              >
                <Building size={36} className="text-primary" />
              </motion.div>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold dark:text-white tracking-tight">Create your workspace</h1>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">This is your team's home on Linearis.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <FormInput
              icon={<Building size={16} />}
              placeholder="Acme Corp"
              value={orgName}
              onChange={(v) => {
                setOrgName(v);
                setWorkspaceUrl(v.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''));
              }}
              label="Organization name"
            />

            {/* Workspace URL */}
            <div className="space-y-2">
              <label className="text-[13px] font-medium text-gray-700 dark:text-gray-300">Workspace URL</label>
              <div className="flex group">
                <div className="relative flex-1">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 group-focus-within:text-primary transition-colors">
                    <Globe size={16} />
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

            {/* Team size picker */}
            <div className="space-y-2">
              <label className="text-[13px] font-medium text-gray-700 dark:text-gray-300">How large is your team?</label>
              <div className="grid grid-cols-4 gap-2">
                {['1-5', '6-20', '21-50', '50+'].map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setTeamSize(size)}
                    className={`py-2.5 rounded-xl text-sm font-medium border transition-all ${
                      teamSize === size
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-gray-200 dark:border-white/[0.08] text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-white/[0.12]'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2">
              <SubmitButton>Create Workspace</SubmitButton>
            </div>
          </form>

          <p className="mt-6 text-center text-[11px] text-gray-400 dark:text-gray-600 leading-relaxed">
            By continuing, you agree to our{' '}
            <span className="hover:underline cursor-pointer text-gray-500 dark:text-gray-400">Terms</span> and{' '}
            <span className="hover:underline cursor-pointer text-gray-500 dark:text-gray-400">Privacy Policy</span>.
          </p>
        </motion.div>
      </div>

      <AuthFooter />
    </div>
  );
};
