import React from 'react';
import { motion } from 'motion/react';
import { 
  ArrowRight, 
  CheckCircle2, 
  Layers, 
  Zap, 
  Shield, 
  Users, 
  Globe, 
  Github, 
  Twitter, 
  Linkedin,
  Menu,
  X
} from 'lucide-react';
import { useApp } from '../AppContext';

const Nav = () => {
  const { setView } = useApp();
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-bg-dark/80 backdrop-blur-md border-b border-gray-200 dark:border-border-dark">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView('marketing')}>
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold">L</div>
            <span className="text-xl font-bold tracking-tight">Linearis</span>
          </div>
          
          <div className="hidden md:flex items-center gap-8">
            <a href="#product" className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-primary transition-colors">Product</a>
            <a href="#features" className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-primary transition-colors">Features</a>
            <a href="#pricing" className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-primary transition-colors">Pricing</a>
            <a href="#customers" className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-primary transition-colors">Customers</a>
          </div>

          <div className="hidden md:flex items-center gap-4">
            <button onClick={() => setView('login')} className="text-sm font-medium hover:text-primary transition-colors">Log in</button>
            <button onClick={() => setView('signup')} className="px-4 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary/90 transition-all shadow-lg shadow-primary/20">
              Sign up
            </button>
          </div>

          <div className="md:hidden">
            <button onClick={() => setIsOpen(!isOpen)} className="p-2">
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden bg-white dark:bg-bg-dark border-b border-gray-200 dark:border-border-dark p-4 space-y-4">
          <a href="#product" className="block text-sm font-medium">Product</a>
          <a href="#features" className="block text-sm font-medium">Features</a>
          <a href="#pricing" className="block text-sm font-medium">Pricing</a>
          <button onClick={() => setView('login')} className="w-full text-left text-sm font-medium">Log in</button>
          <button onClick={() => setView('signup')} className="w-full px-4 py-2 bg-primary text-white text-sm font-semibold rounded-lg">Sign up</button>
        </div>
      )}
    </nav>
  );
};

const Hero = () => {
  const { setView } = useApp();
  return (
    <section className="pt-32 pb-20 px-4">
      <div className="max-w-7xl mx-auto text-center space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider">
            Now in Public Beta
          </span>
        </motion.div>
        
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-5xl md:text-7xl font-bold tracking-tight max-w-4xl mx-auto leading-[1.1]"
        >
          The next generation of <span className="text-primary">project management</span>.
        </motion.h1>
        
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-xl text-gray-500 dark:text-gray-400 max-w-2xl mx-auto"
        >
          Linearis streamlines issues, projects, and product roadmaps. Built for high-performance teams who want to move faster.
        </motion.p>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
        >
          <button onClick={() => setView('signup')} className="w-full sm:w-auto px-8 py-4 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-2 group">
            Get started for free
            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </button>
          <button className="w-full sm:w-auto px-8 py-4 bg-white dark:bg-white/5 border border-gray-200 dark:border-border-dark font-bold rounded-xl hover:bg-gray-50 dark:hover:bg-white/10 transition-all">
            Book a demo
          </button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="pt-16 relative"
        >
          <div className="absolute inset-0 bg-primary/20 blur-[120px] rounded-full -z-10" />
          <img 
            src="https://picsum.photos/seed/dashboard/1200/800" 
            alt="Product Screenshot" 
            className="rounded-2xl border border-gray-200 dark:border-border-dark shadow-2xl mx-auto"
            referrerPolicy="no-referrer"
          />
        </motion.div>
      </div>
    </section>
  );
};

const Features = () => {
  const features = [
    { icon: <Zap className="text-yellow-500" />, title: 'Built for speed', description: 'Optimized for efficiency with keyboard shortcuts for everything.' },
    { icon: <Layers className="text-primary" />, title: 'Issue tracking', description: 'Manage tasks with a powerful, flexible issue tracking system.' },
    { icon: <Globe className="text-emerald-500" />, title: 'Roadmaps', description: 'Plan your product strategy with beautiful visual roadmaps.' },
    { icon: <Users className="text-purple-500" />, title: 'Team collaboration', description: 'Built-in tools for teams to communicate and stay aligned.' },
    { icon: <Shield className="text-blue-500" />, title: 'Enterprise security', description: 'SAML SSO, audit logs, and advanced permission controls.' },
    { icon: <CheckCircle2 className="text-orange-500" />, title: 'Automated workflows', description: 'Connect your tools and automate repetitive tasks.' },
  ];

  return (
    <section id="features" className="py-24 bg-gray-50 dark:bg-black/20">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight">Everything you need to ship.</h2>
          <p className="text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">Linearis replaces fragmented tools with a single, unified workspace for your entire product team.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((f, i) => (
            <div key={i} className="p-8 bg-white dark:bg-card-dark rounded-2xl border border-gray-200 dark:border-border-dark shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center mb-6">
                {f.icon}
              </div>
              <h3 className="text-xl font-bold mb-3">{f.title}</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">{f.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const Pricing = () => {
  const plans = [
    { name: 'Free', price: '$0', description: 'For individuals and small teams.', features: ['Unlimited issues', 'Up to 10 members', 'Basic integrations', 'Community support'] },
    { name: 'Standard', price: '$12', description: 'For growing product teams.', features: ['Unlimited members', 'Private teams', 'Advanced integrations', 'Priority support', 'Roadmaps'], popular: true },
    { name: 'Plus', price: '$24', description: 'For large organizations.', features: ['SAML SSO', 'Audit logs', 'Advanced permissions', 'Dedicated manager', 'Unlimited history'] },
  ];

  return (
    <section id="pricing" className="py-24">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight">Simple, transparent pricing.</h2>
          <p className="text-gray-500 dark:text-gray-400">Choose the plan that's right for your team.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((p, i) => (
            <div key={i} className={`p-8 rounded-2xl border ${p.popular ? 'border-primary ring-4 ring-primary/10' : 'border-gray-200 dark:border-border-dark'} bg-white dark:bg-card-dark relative overflow-hidden`}>
              {p.popular && (
                <div className="absolute top-0 right-0 bg-primary text-white text-[10px] font-bold uppercase px-3 py-1 rounded-bl-lg">
                  Most Popular
                </div>
              )}
              <h3 className="text-xl font-bold mb-2">{p.name}</h3>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-4xl font-bold">{p.price}</span>
                <span className="text-gray-400 text-sm">/user/month</span>
              </div>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-8">{p.description}</p>
              <button className={`w-full py-3 rounded-xl font-bold transition-all mb-8 ${p.popular ? 'bg-primary text-white hover:bg-primary/90' : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
                Get started
              </button>
              <ul className="space-y-4">
                {p.features.map((f, j) => (
                  <li key={j} className="flex items-center gap-3 text-sm">
                    <CheckCircle2 size={16} className="text-primary" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const Footer = () => (
  <footer className="bg-white dark:bg-bg-dark border-t border-gray-200 dark:border-border-dark pt-20 pb-10">
    <div className="max-w-7xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-12 mb-20">
      <div className="col-span-2 lg:col-span-2 space-y-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold">L</div>
          <span className="text-xl font-bold tracking-tight">Linearis</span>
        </div>
        <p className="text-gray-500 dark:text-gray-400 max-w-xs">The next generation of project management. Built for high-performance teams.</p>
        <div className="flex gap-4">
          <Twitter size={20} className="text-gray-400 hover:text-primary cursor-pointer" />
          <Github size={20} className="text-gray-400 hover:text-primary cursor-pointer" />
          <Linkedin size={20} className="text-gray-400 hover:text-primary cursor-pointer" />
        </div>
      </div>
      <div>
        <h4 className="font-bold mb-6">Product</h4>
        <ul className="space-y-4 text-sm text-gray-500 dark:text-gray-400">
          <li className="hover:text-primary cursor-pointer">Features</li>
          <li className="hover:text-primary cursor-pointer">Integrations</li>
          <li className="hover:text-primary cursor-pointer">Pricing</li>
          <li className="hover:text-primary cursor-pointer">Changelog</li>
        </ul>
      </div>
      <div>
        <h4 className="font-bold mb-6">Company</h4>
        <ul className="space-y-4 text-sm text-gray-500 dark:text-gray-400">
          <li className="hover:text-primary cursor-pointer">About</li>
          <li className="hover:text-primary cursor-pointer">Blog</li>
          <li className="hover:text-primary cursor-pointer">Careers</li>
          <li className="hover:text-primary cursor-pointer">Contact</li>
        </ul>
      </div>
      <div>
        <h4 className="font-bold mb-6">Legal</h4>
        <ul className="space-y-4 text-sm text-gray-500 dark:text-gray-400">
          <li className="hover:text-primary cursor-pointer">Privacy</li>
          <li className="hover:text-primary cursor-pointer">Terms</li>
          <li className="hover:text-primary cursor-pointer">Cookie Policy</li>
        </ul>
      </div>
    </div>
    <div className="max-w-7xl mx-auto px-4 text-center text-sm text-gray-400">
      © 2024 Linearis Inc. All rights reserved.
    </div>
  </footer>
);

export const MarketingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-white dark:bg-bg-dark text-gray-900 dark:text-gray-100 selection:bg-primary/30">
      <Nav />
      <main>
        <Hero />
        <Features />
        <Pricing />
      </main>
      <Footer />
    </div>
  );
};
