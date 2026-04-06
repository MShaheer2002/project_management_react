import React, { useState } from 'react';
import { Mail, Lock, Github, Chrome, ArrowRight, User, Building } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../AppContext';
import { MOCK_USERS } from '../constants';

export const AuthPage: React.FC<{ mode: 'login' | 'signup' | 'org' | 'forgot-password' | 'reset-password' | 'email-verification' }> = ({ mode }) => {
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
      // Mock login
      setCurrentUser(MOCK_USERS[0]);
      setOrganization({ id: 'org1', name: 'Linearis Inc.', slug: 'linearis' });
      navigate('/');
    } else if (mode === 'signup') {
      navigate('/email-verification');
    } else if (mode === 'email-verification') {
      navigate('/org-creation');
    } else if (mode === 'org') {
      navigate('/');
    } else if (mode === 'forgot-password') {
      alert('Password reset link sent to your email.');
      navigate('/login');
    } else if (mode === 'reset-password') {
      alert('Password has been reset.');
      navigate('/login');
    }
  };

  const renderContent = () => {
    switch (mode) {
      case 'forgot-password':
        return (
          <>
            <h2 className="text-xl font-bold mb-6 text-center dark:text-white">Forgot Password</h2>
            <p className="text-sm text-gray-400 dark:text-gray-500 text-center mb-6">Enter your email and we'll send you a link to reset your password.</p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">Email Address</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input 
                    type="email" 
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-border-dark rounded-lg outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm dark:text-white"
                  />
                </div>
              </div>
              <button type="submit" className="w-full py-2.5 bg-primary text-white font-bold rounded-lg hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 text-sm">
                Send reset link
              </button>
              <button type="button" onClick={() => navigate('/login')} className="w-full text-sm text-gray-400 hover:text-primary transition-colors mt-4">
                Back to login
              </button>
            </form>
          </>
        );
      case 'email-verification':
        return (
          <>
            <h2 className="text-xl font-bold mb-6 text-center dark:text-white">Check your email</h2>
            <p className="text-sm text-gray-400 dark:text-gray-500 text-center mb-6">We've sent a verification code to <strong className="dark:text-white">{email || 'your email'}</strong>. Enter it below to continue.</p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex justify-center gap-2">
                {[1, 2, 3, 4].map(i => (
                  <input 
                    key={i}
                    type="text" 
                    maxLength={1}
                    className="w-12 h-12 text-center text-xl font-bold bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-border-dark rounded-lg outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all dark:text-white"
                  />
                ))}
              </div>
              <button type="submit" className="w-full py-2.5 bg-primary text-white font-bold rounded-lg hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 text-sm">
                Verify email
              </button>
              <p className="text-center text-xs text-gray-400 mt-4">
                Didn't receive the code? <button type="button" className="text-primary hover:underline">Resend</button>
              </p>
            </form>
          </>
        );
      case 'reset-password':
        return (
          <>
            <h2 className="text-xl font-bold mb-6 text-center dark:text-white">Reset Password</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-400">New Password</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input 
                    type="password" 
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-border-dark rounded-lg outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Confirm Password</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input 
                    type="password" 
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-border-dark rounded-lg outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                  />
                </div>
              </div>
              <button type="submit" className="w-full py-2.5 bg-primary text-white font-bold rounded-lg hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 text-sm">
                Reset password
              </button>
            </form>
          </>
        );
      default:
        return (
          <>
            <h2 className="text-xl font-bold mb-6 text-center dark:text-white">
              {mode === 'login' ? 'Welcome back' : mode === 'signup' ? 'Create your account' : 'Setup your organization'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'login' && (
                <div className="space-y-3 mb-6">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">Demo: Login as</label>
                  <div className="grid grid-cols-1 gap-2">
                    {MOCK_USERS.map(user => (
                      <button
                        key={user.id}
                        type="button"
                        onClick={() => {
                          setCurrentUser(user);
                          setOrganization({ id: 'org1', name: 'Linearis Inc.', slug: 'linearis' });
                          navigate('/');
                        }}
                        className="flex items-center gap-3 p-2 rounded-lg border border-gray-200 dark:border-border-dark hover:border-primary hover:bg-primary/5 transition-all text-left"
                      >
                        <img src={user.avatar} className="w-8 h-8 rounded-full" alt="" />
                        <div>
                          <p className="text-sm font-semibold dark:text-white">{user.name}</p>
                          <p className="text-[10px] text-gray-400 dark:text-gray-400 uppercase font-bold tracking-wider">{user.role}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                  <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-200 dark:border-border-dark"></div>
                    </div>
                    <div className="relative flex justify-center text-[10px] uppercase">
                      <span className="bg-white dark:bg-card-dark px-2 text-gray-400 dark:text-gray-500">Or use credentials</span>
                    </div>
                  </div>
                </div>
              )}

              {mode === 'signup' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">Full Name</label>
                  <div className="relative">
                    <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input 
                      type="text" 
                      placeholder="John Doe"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-border-dark rounded-lg outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm dark:text-white"
                    />
                  </div>
                </div>
              )}

              {mode === 'org' ? (
                <>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">Organization Name</label>
                    <div className="relative">
                      <Building size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input 
                        type="text" 
                        placeholder="Acme Corp"
                        value={orgName}
                        onChange={(e) => setOrgName(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-border-dark rounded-lg outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm dark:text-white"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">Workspace URL</label>
                    <div className="flex items-center">
                      <input 
                        type="text" 
                        placeholder="acme"
                        value={workspaceUrl}
                        onChange={(e) => setWorkspaceUrl(e.target.value)}
                        className="flex-1 px-4 py-2.5 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-border-dark rounded-l-lg outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm dark:text-white"
                      />
                      <span className="px-4 py-2.5 bg-gray-100 dark:bg-gray-800 border border-l-0 border-gray-200 dark:border-border-dark rounded-r-lg text-xs text-gray-400 dark:text-gray-500">
                        .linearis.app
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">Email Address</label>
                    <div className="relative">
                      <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input 
                        type="email" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="name@company.com"
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-border-dark rounded-lg outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">Password</label>
                      {mode === 'login' && (
                        <button type="button" onClick={() => navigate('/forgot-password')} className="text-[10px] text-primary hover:underline">Forgot password?</button>
                      )}
                    </div>
                    <div className="relative">
                      <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input 
                        type="password" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-border-dark rounded-lg outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm dark:text-white"
                      />
                    </div>
                  </div>
                </>
              )}

              <button 
                type="submit"
                className="w-full py-3 bg-primary text-white rounded-lg font-bold text-sm hover:bg-primary/90 transition-all flex items-center justify-center gap-2 group shadow-lg shadow-primary/20"
              >
                {mode === 'login' ? 'Sign In' : mode === 'signup' ? 'Create Account' : 'Create Organization'}
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </form>

            {mode !== 'org' && (
              <>
                <div className="relative my-8">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200 dark:border-border-dark"></div>
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white dark:bg-card-dark px-2 text-gray-400 dark:text-gray-500">Or continue with</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <button className="flex items-center justify-center gap-2 py-2.5 border border-gray-200 dark:border-border-dark rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-white/5 dark:text-white transition-all">
                    <Chrome size={18} />
                    Google
                  </button>
                  <button className="flex items-center justify-center gap-2 py-2.5 border border-gray-200 dark:border-border-dark rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-white/5 dark:text-white transition-all">
                    <Github size={18} />
                    GitHub
                  </button>
                </div>

                <p className="mt-8 text-center text-sm text-gray-400 dark:text-gray-300">
                  {mode === 'login' ? (
                    <>Don't have an account? <button onClick={() => navigate('/signup')} className="text-primary font-bold hover:underline">Sign up</button></>
                  ) : (
                    <>Already have an account? <button onClick={() => navigate('/login')} className="text-primary font-bold hover:underline">Log in</button></>
                  )}
                </p>
              </>
            )}
          </>
        );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-bg-dark p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8 cursor-pointer" onClick={() => navigate('/marketing')}>
          <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center text-white text-2xl font-bold shadow-xl shadow-primary/20 mb-4">
            L
          </div>
          <h1 className="text-2xl font-bold dark:text-white">Linearis</h1>
          <p className="text-sm text-gray-400 dark:text-gray-500">The next generation of project management.</p>
        </div>

        <div className="bg-white dark:bg-card-dark p-8 rounded-2xl border border-gray-200 dark:border-border-dark shadow-xl">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};
