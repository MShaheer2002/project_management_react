import React from 'react';
import { motion, useInView } from 'motion/react';
import { useNavigate } from 'react-router-dom';
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
  X,
  BarChart3,
  MessageSquare,
  FolderKanban,
  Clock,
  Star,
  ChevronRight,
  Play,
  Sparkles,
  Target,
  TrendingUp,
  MousePointerClick,
} from 'lucide-react';

/* ─── animation helpers ─── */
const ease = [0.22, 1, 0.36, 1] as const;

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.1, ease: ease as unknown as [number, number, number, number] },
  }),
};

const Section: React.FC<{
  children: React.ReactNode;
  className?: string;
  id?: string;
}> = ({ children, className = '', id }) => {
  const ref = React.useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  return (
    <motion.section
      ref={ref}
      id={id}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
      className={className}
    >
      {children}
    </motion.section>
  );
};

/* ════════════════════════════════════════════════
   NAV
   ════════════════════════════════════════════════ */
const Nav = () => {
  const navigate = useNavigate();
  const [open, setOpen] = React.useState(false);
  const [scrolled, setScrolled] = React.useState(false);

  React.useEffect(() => {
    const h = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', h, { passive: true });
    return () => window.removeEventListener('scroll', h);
  }, []);

  return (
    <nav
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/90 dark:bg-bg-dark/90 backdrop-blur-xl shadow-sm border-b border-gray-200/60 dark:border-border-dark/60'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div
            className="flex items-center gap-2.5 cursor-pointer"
            onClick={() => navigate('/marketing')}
          >
            <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center text-white text-lg font-bold shadow-lg shadow-primary/25">
              L
            </div>
            <span className="text-xl font-bold tracking-tight">Trussen</span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            {['Features', 'How it works', 'Pricing', 'Testimonials'].map((t) => (
              <a
                key={t}
                href={`#${t.toLowerCase().replace(/\s/g, '-')}`}
                className="text-[13px] font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                {t}
              </a>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={() => navigate('/login')}
              className="px-4 py-2 text-sm font-medium hover:text-primary transition-colors"
            >
              Log in
            </button>
            <button
              onClick={() => navigate('/signup')}
              className="px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5"
            >
              Get Started Free
            </button>
          </div>

          <button className="md:hidden p-2" onClick={() => setOpen(!open)}>
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {open && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:hidden bg-white dark:bg-bg-dark border-b border-gray-200 dark:border-border-dark px-4 pb-6 pt-2 space-y-3"
        >
          {['Features', 'How it works', 'Pricing', 'Testimonials'].map((t) => (
            <a key={t} href={`#${t.toLowerCase().replace(/\s/g, '-')}`} onClick={() => setOpen(false)} className="block py-2 text-sm font-medium">
              {t}
            </a>
          ))}
          <div className="pt-2 space-y-2">
            <button onClick={() => navigate('/login')} className="w-full text-left py-2 text-sm font-medium">Log in</button>
            <button onClick={() => navigate('/signup')} className="w-full px-4 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl">Get Started Free</button>
          </div>
        </motion.div>
      )}
    </nav>
  );
};

/* ════════════════════════════════════════════════
   HERO
   ════════════════════════════════════════════════ */
const Hero = () => {
  const navigate = useNavigate();
  return (
    <section className="relative pt-28 sm:pt-36 pb-20 px-4 overflow-hidden">
      {/* background gradient orbs */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[600px] bg-primary/[0.07] rounded-full blur-[120px] -z-10" />
      <div className="absolute top-40 -left-40 w-[400px] h-[400px] bg-purple-500/[0.05] rounded-full blur-[100px] -z-10" />
      <div className="absolute top-60 -right-40 w-[400px] h-[400px] bg-blue-500/[0.05] rounded-full blur-[100px] -z-10" />

      <div className="max-w-7xl mx-auto text-center">
        <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={0}>
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider border border-primary/20">
            <Sparkles size={14} />
            Now in Public Beta
          </span>
        </motion.div>

        <motion.h1
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={1}
          className="mt-8 text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight max-w-4xl mx-auto leading-[1.08]"
        >
          Simplify Project Management.{' '}
          <span className="bg-gradient-to-r from-primary via-violet-500 to-purple-500 bg-clip-text text-transparent">
            Boost Productivity.
          </span>
        </motion.h1>

        <motion.p
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={2}
          className="mt-6 text-lg sm:text-xl text-gray-500 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed"
        >
          Trussen streamlines issues, sprints, and product roadmaps into one fast,
          keyboard-driven workspace. Built for teams who ship.
        </motion.p>

        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={3}
          className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <button
            onClick={() => navigate('/signup')}
            className="w-full sm:w-auto px-8 py-4 bg-primary text-white font-bold rounded-2xl hover:bg-primary/90 transition-all shadow-xl shadow-primary/25 hover:shadow-2xl hover:shadow-primary/30 hover:-translate-y-0.5 flex items-center justify-center gap-2 group"
          >
            Get Started Free
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </button>
          <button className="w-full sm:w-auto px-8 py-4 bg-white dark:bg-white/5 border border-gray-200 dark:border-border-dark font-semibold rounded-2xl hover:bg-gray-50 dark:hover:bg-white/10 transition-all flex items-center justify-center gap-2 group">
            <Play size={16} className="text-primary" />
            Watch Demo
          </button>
        </motion.div>

        <motion.p
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={4}
          className="mt-4 text-xs text-gray-400"
        >
          Free forever for up to 10 members &middot; No credit card required
        </motion.p>

        {/* App screenshot mockup */}
        <motion.div
          initial={{ opacity: 0, y: 60, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.9, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="mt-16 sm:mt-20 relative mx-auto max-w-6xl"
        >
          <div className="absolute -inset-4 bg-gradient-to-b from-primary/20 via-primary/5 to-transparent rounded-3xl blur-2xl -z-10" />
          <div className="rounded-2xl border border-gray-200 dark:border-border-dark overflow-hidden shadow-2xl shadow-black/10 dark:shadow-black/40 bg-white dark:bg-card-dark">
            {/* fake browser chrome */}
            <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 dark:bg-sidebar-dark border-b border-gray-200 dark:border-border-dark">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-400/80" />
                <div className="w-3 h-3 rounded-full bg-yellow-400/80" />
                <div className="w-3 h-3 rounded-full bg-green-400/80" />
              </div>
              <div className="flex-1 flex justify-center">
                <div className="px-4 py-1 bg-white dark:bg-bg-dark rounded-lg text-[11px] text-gray-400 border border-gray-200 dark:border-border-dark min-w-[280px] text-center">
                  app.trussen.io/dashboard
                </div>
              </div>
              <div className="w-12" />
            </div>
            {/* mock UI content */}
            <div className="flex h-[420px] sm:h-[520px]">
              {/* sidebar mock */}
              <div className="hidden sm:flex flex-col w-56 border-r border-gray-100 dark:border-border-dark bg-gray-50/50 dark:bg-sidebar-dark p-4 gap-1">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center text-white text-xs font-bold">L</div>
                  <span className="text-sm font-semibold">Trussen</span>
                </div>
                {['Dashboard', 'My Issues', 'All Issues', 'Projects', 'Teams', 'Cycles'].map((item, i) => (
                  <div
                    key={item}
                    className={`px-3 py-2 rounded-lg text-xs font-medium ${
                      i === 0 ? 'bg-primary/10 text-primary' : 'text-gray-400'
                    }`}
                  >
                    {item}
                  </div>
                ))}
              </div>
              {/* main area mock */}
              <div className="flex-1 p-4 sm:p-6 overflow-hidden">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <div className="text-sm font-semibold">Good morning, Alex</div>
                    <div className="text-[11px] text-gray-400 mt-0.5">3 tasks due today</div>
                  </div>
                  <div className="flex gap-2">
                    <div className="w-20 h-7 rounded-lg bg-primary/10 border border-primary/20" />
                    <div className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-gray-800" />
                  </div>
                </div>
                {/* stat cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                  {[
                    { label: 'Completed', value: '24', color: 'text-green-500' },
                    { label: 'In Progress', value: '12', color: 'text-blue-500' },
                    { label: 'Open Issues', value: '38', color: 'text-orange-500' },
                    { label: 'Team Load', value: '72%', color: 'text-purple-500' },
                  ].map((s) => (
                    <div key={s.label} className="p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-border-dark">
                      <div className={`text-lg font-bold ${s.color}`}>{s.value}</div>
                      <div className="text-[10px] text-gray-400 mt-0.5">{s.label}</div>
                    </div>
                  ))}
                </div>
                {/* kanban columns */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {['Backlog', 'Todo', 'In Progress', 'Done'].map((col, ci) => (
                    <div key={col} className="space-y-2">
                      <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{col}</div>
                      {[0, 1, 2].slice(0, ci === 2 ? 3 : 2).map((j) => (
                        <div key={j} className="p-2.5 rounded-lg bg-white dark:bg-card-dark border border-gray-100 dark:border-border-dark shadow-sm">
                          <div className="h-2 w-3/4 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
                          <div className="h-2 w-1/2 bg-gray-100 dark:bg-gray-800 rounded" />
                          <div className="flex items-center gap-1.5 mt-2.5">
                            <div className={`w-1.5 h-1.5 rounded-full ${['bg-red-400', 'bg-orange-400', 'bg-blue-400', 'bg-green-400'][ci]}`} />
                            <div className="h-1.5 w-8 bg-gray-100 dark:bg-gray-800 rounded" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* floating badges around the screenshot */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.1, duration: 0.6 }}
            className="hidden lg:flex absolute -left-12 top-36 items-center gap-2 px-4 py-2.5 bg-white dark:bg-card-dark rounded-xl border border-gray-200 dark:border-border-dark shadow-lg"
          >
            <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center"><Users size={16} className="text-blue-500" /></div>
            <div>
              <div className="text-[11px] font-bold">Team Lead</div>
              <div className="text-[10px] text-gray-400">Product</div>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.2, duration: 0.6 }}
            className="hidden lg:flex absolute -right-12 top-28 items-center gap-2 px-4 py-2.5 bg-white dark:bg-card-dark rounded-xl border border-gray-200 dark:border-border-dark shadow-lg"
          >
            <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center"><Zap size={16} className="text-green-500" /></div>
            <div>
              <div className="text-[11px] font-bold">Engineer</div>
              <div className="text-[10px] text-gray-400">Backend</div>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.3, duration: 0.6 }}
            className="hidden lg:flex absolute -left-8 bottom-24 items-center gap-2 px-4 py-2.5 bg-white dark:bg-card-dark rounded-xl border border-gray-200 dark:border-border-dark shadow-lg"
          >
            <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center"><Globe size={16} className="text-purple-500" /></div>
            <div>
              <div className="text-[11px] font-bold">Designer</div>
              <div className="text-[10px] text-gray-400">UI/UX</div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

/* ════════════════════════════════════════════════
   TRUSTED BY / LOGOS
   ════════════════════════════════════════════════ */
const TrustedBy = () => (
  <Section className="py-16 border-y border-gray-100 dark:border-border-dark bg-gray-50/50 dark:bg-black/10">
    <div className="max-w-7xl mx-auto px-4">
      <motion.p variants={fadeUp} className="text-center text-xs font-bold uppercase tracking-widest text-gray-400 mb-8">
        Trusted by innovative teams worldwide
      </motion.p>
      <motion.div variants={fadeUp} className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6">
        {['Vercel', 'Stripe', 'Notion', 'Figma', 'GitHub'].map((name) => (
          <div key={name} className="flex items-center gap-2 text-gray-300 dark:text-gray-600 select-none">
            <div className="w-8 h-8 rounded-lg bg-gray-200 dark:bg-gray-800" />
            <span className="text-lg font-bold tracking-tight">{name}</span>
          </div>
        ))}
      </motion.div>
    </div>
  </Section>
);

/* ════════════════════════════════════════════════
   FEATURES — visual cards
   ════════════════════════════════════════════════ */
const features = [
  {
    icon: <FolderKanban className="text-primary" size={22} />,
    title: 'Smart Task Organization',
    description: 'Create, categorize, and prioritize tasks with flexible lists, kanban boards, and timelines.',
    visual: (
      <div className="mt-4 p-4 bg-gray-50 dark:bg-white/[0.03] rounded-xl border border-gray-100 dark:border-border-dark">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Sprint 12</span>
          <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">105 Tasks</span>
        </div>
        {[
          { label: 'Completed', w: 'w-4/5', color: 'bg-green-500' },
          { label: 'In Progress', w: 'w-2/5', color: 'bg-blue-500' },
          { label: 'Not Started', w: 'w-1/4', color: 'bg-gray-300 dark:bg-gray-700' },
        ].map((r) => (
          <div key={r.label} className="flex items-center gap-3 my-2">
            <span className="text-[10px] text-gray-400 w-16 shrink-0">{r.label}</span>
            <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
              <div className={`h-full ${r.color} rounded-full ${r.w}`} />
            </div>
          </div>
        ))}
        <div className="flex -space-x-2 mt-3">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="w-6 h-6 rounded-full bg-gradient-to-br from-primary/60 to-purple-500/60 border-2 border-white dark:border-card-dark" />
          ))}
          <div className="w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-800 border-2 border-white dark:border-card-dark flex items-center justify-center text-[8px] font-bold text-gray-400">+5</div>
        </div>
      </div>
    ),
  },
  {
    icon: <Zap className="text-yellow-500" size={22} />,
    title: 'Automated Workflows',
    description: 'Streamline your workflow with automation for tasks, assignments, updates, and reminders.',
    visual: (
      <div className="mt-4 space-y-2.5">
        {[
          { title: 'User Journey Mapping', status: 'In Progress', color: 'bg-blue-500' },
          { title: 'Design System Setup', status: 'Review', color: 'bg-purple-500' },
          { title: 'API Integration', status: 'Todo', color: 'bg-gray-400' },
        ].map((t) => (
          <div key={t.title} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-white/[0.03] rounded-xl border border-gray-100 dark:border-border-dark">
            <div className={`w-2 h-2 rounded-full ${t.color} shrink-0`} />
            <span className="text-xs font-medium flex-1 truncate">{t.title}</span>
            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
              t.status === 'In Progress' ? 'bg-blue-500/10 text-blue-500' :
              t.status === 'Review' ? 'bg-purple-500/10 text-purple-500' :
              'bg-gray-100 dark:bg-gray-800 text-gray-400'
            }`}>{t.status}</span>
          </div>
        ))}
      </div>
    ),
  },
  {
    icon: <MessageSquare className="text-emerald-500" size={22} />,
    title: 'File & Comment Management',
    description: 'Consolidate everything with task comments, file attachments, and feedback threads.',
    visual: (
      <div className="mt-4 space-y-2.5">
        {[
          { name: 'Harry Mason', msg: 'Updated the wireframes', time: '2 min', online: true },
          { name: 'Sarah Chen', msg: 'Approved the design', time: '15 min', online: true },
          { name: 'Alex Rivera', msg: 'Left a comment on LIN-101', time: '1 hr', online: false },
        ].map((m) => (
          <div key={m.name} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-white/[0.03] rounded-xl border border-gray-100 dark:border-border-dark">
            <div className="relative shrink-0">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/60 to-violet-500/60" />
              {m.online && <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-white dark:border-card-dark" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[11px] font-semibold truncate">{m.name}</div>
              <div className="text-[10px] text-gray-400 truncate">{m.msg}</div>
            </div>
            <span className="text-[9px] text-gray-400 shrink-0">{m.time}</span>
          </div>
        ))}
      </div>
    ),
  },
  {
    icon: <BarChart3 className="text-blue-500" size={22} />,
    title: 'Real-Time Progress Tracking',
    description: 'Track deadlines, milestones, and performance with live status updates and visual indicators.',
    visual: (
      <div className="mt-4 p-4 bg-gray-50 dark:bg-white/[0.03] rounded-xl border border-gray-100 dark:border-border-dark">
        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">Project Overview</div>
        <div className="space-y-3">
          {[
            { name: 'Mobile App', progress: 78, team: 4 },
            { name: 'API V2', progress: 45, team: 3 },
            { name: 'Design System', progress: 92, team: 2 },
          ].map((p) => (
            <div key={p.name} className="flex items-center gap-3">
              <span className="text-[11px] font-medium w-20 truncate">{p.name}</span>
              <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${p.progress}%` }} />
              </div>
              <span className="text-[10px] text-gray-400 w-8 text-right">{p.progress}%</span>
              <div className="flex -space-x-1.5">
                {Array.from({ length: p.team }).map((_, i) => (
                  <div key={i} className="w-5 h-5 rounded-full bg-gradient-to-br from-primary/50 to-purple-400/50 border-2 border-white dark:border-card-dark" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
  },
];

const Features = () => (
  <Section id="features" className="py-24 sm:py-32">
    <div className="max-w-7xl mx-auto px-4">
      <motion.div variants={fadeUp} className="text-center mb-16 space-y-4">
        <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider">Features</span>
        <h2 className="text-3xl sm:text-5xl font-bold tracking-tight">
          Unlock Premium Benefits With<br className="hidden sm:block" /> Our Advanced Features.
        </h2>
        <p className="text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
          Unlock premium benefits with advanced features designed to scale.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {features.map((f, i) => (
          <motion.div
            key={i}
            variants={fadeUp}
            custom={i}
            className="group p-6 sm:p-8 bg-white dark:bg-card-dark rounded-2xl border border-gray-200 dark:border-border-dark shadow-sm hover:shadow-lg hover:border-primary/30 dark:hover:border-primary/30 transition-all duration-300"
          >
            <div className="w-11 h-11 rounded-xl bg-gray-50 dark:bg-white/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              {f.icon}
            </div>
            <h3 className="text-lg font-bold mb-1.5">{f.title}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{f.description}</p>
            {f.visual}
          </motion.div>
        ))}
      </div>
    </div>
  </Section>
);

/* ════════════════════════════════════════════════
   STATS
   ════════════════════════════════════════════════ */
const stats = [
  { value: '40%', label: 'Faster Task Completion and Automated Workflows', icon: <TrendingUp size={18} /> },
  { value: '3x', label: 'Higher Team Alignment and Real-time Updates', icon: <Users size={18} /> },
  { value: '100%', label: 'Real-Time Insights Across and Track Progress', icon: <Target size={18} /> },
  { value: '10k+', label: 'Active Users: Startups, Agencies, and Growing Teams', icon: <MousePointerClick size={18} /> },
];

const Stats = () => (
  <Section id="testimonials" className="py-24 sm:py-32 bg-gray-50 dark:bg-black/20">
    <div className="max-w-7xl mx-auto px-4">
      <motion.div variants={fadeUp} className="text-center mb-16 space-y-4">
        <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider">Why Trussen</span>
        <h2 className="text-3xl sm:text-5xl font-bold tracking-tight">Why Teams Choose Trussen.</h2>
        <p className="text-gray-500 dark:text-gray-400 max-w-xl mx-auto">
          Trusted by teams to manage work more efficiently. Designed to help teams do their best work.
        </p>
      </motion.div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {stats.map((s, i) => (
          <motion.div
            key={i}
            variants={fadeUp}
            custom={i}
            className="relative p-6 sm:p-8 bg-white dark:bg-card-dark rounded-2xl border border-gray-200 dark:border-border-dark text-center group hover:border-primary/30 transition-all"
          >
            <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary opacity-60 group-hover:opacity-100 transition-opacity">
              {s.icon}
            </div>
            <div className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent mb-3">
              {s.value}
            </div>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{s.label}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </Section>
);

/* ════════════════════════════════════════════════
   HOW IT WORKS — 3 steps
   ════════════════════════════════════════════════ */
const steps = [
  {
    num: '01',
    title: 'Simple And Fast Setup',
    description: 'Create your workspace in seconds. Invite your team and start tracking issues immediately.',
    icon: <Sparkles size={20} />,
  },
  {
    num: '02',
    title: 'Work Together Effortlessly',
    description: 'Assign tasks, leave comments, and move issues across boards — all in real time.',
    icon: <Users size={20} />,
  },
  {
    num: '03',
    title: 'Monitor Your Progress',
    description: 'Track velocity, view burndown charts, and ship features with confidence.',
    icon: <BarChart3 size={20} />,
  },
];

const HowItWorks = () => (
  <Section id="how-it-works" className="py-24 sm:py-32">
    <div className="max-w-7xl mx-auto px-4">
      <motion.div variants={fadeUp} className="text-center mb-16 space-y-4">
        <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider">How it works</span>
        <h2 className="text-3xl sm:text-5xl font-bold tracking-tight">
          Get Started In Just 3 Easy Steps
        </h2>
        <p className="text-gray-500 dark:text-gray-400 max-w-xl mx-auto">
          Get started in just 3 easy steps with a guided onboarding experience designed for speed and simplicity.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* left — app preview */}
        <motion.div variants={fadeUp} className="relative">
          <div className="rounded-2xl border border-gray-200 dark:border-border-dark overflow-hidden shadow-xl bg-white dark:bg-card-dark">
            <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 dark:bg-sidebar-dark border-b border-gray-100 dark:border-border-dark">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-400/80" />
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/80" />
                <div className="w-2.5 h-2.5 rounded-full bg-green-400/80" />
              </div>
              <div className="text-[10px] text-gray-400 mx-auto">Task Boards</div>
            </div>
            <div className="p-5">
              <div className="flex gap-3 mb-4">
                {['Board View', 'List View'].map((v, i) => (
                  <div key={v} className={`px-3 py-1.5 rounded-lg text-[10px] font-semibold ${i === 0 ? 'bg-primary/10 text-primary' : 'text-gray-400'}`}>
                    {v}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-4 gap-2.5">
                {['To Do', 'In Process', 'In Review', 'Completed'].map((col, ci) => (
                  <div key={col}>
                    <div className="flex items-center gap-1.5 mb-2">
                      <div className={`w-2 h-2 rounded-full ${['bg-gray-400', 'bg-blue-500', 'bg-orange-400', 'bg-green-500'][ci]}`} />
                      <span className="text-[9px] font-bold text-gray-400 uppercase">{col}</span>
                    </div>
                    {[0, 1].map((j) => (
                      <div key={j} className="mb-2 p-2 rounded-lg bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-border-dark">
                        <div className="h-1.5 w-full bg-gray-200 dark:bg-gray-700 rounded mb-1.5" />
                        <div className="h-1.5 w-2/3 bg-gray-100 dark:bg-gray-800 rounded" />
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* right — steps */}
        <div className="space-y-6">
          {steps.map((s, i) => (
            <motion.div
              key={i}
              variants={fadeUp}
              custom={i}
              className="flex gap-5 group"
            >
              <div className="shrink-0 w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-bold text-sm group-hover:bg-primary group-hover:text-white transition-all">
                {s.num}
              </div>
              <div>
                <h3 className="text-lg font-bold mb-1">{s.title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{s.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  </Section>
);

/* ════════════════════════════════════════════════
   TESTIMONIALS
   ════════════════════════════════════════════════ */
const testimonials = [
  { name: 'Emily Zhang', role: 'VP of Engineering, ScaleAI', quote: 'Trussen replaced 3 tools for our team. Issue tracking has never been this fast.', stars: 5 },
  { name: 'Marcus Johnson', role: 'CTO, DevForge', quote: 'The keyboard shortcuts alone saved us hours. We shipped 40% more features last quarter.', stars: 5 },
  { name: 'Sarah Kim', role: 'Product Lead, Nexus', quote: 'Beautiful, fast, and opinionated in all the right ways. Our team adopted it in a single day.', stars: 5 },
];

const Testimonials = () => (
  <Section className="py-24 sm:py-32 bg-gray-50 dark:bg-black/20">
    <div className="max-w-7xl mx-auto px-4">
      <motion.div variants={fadeUp} className="text-center mb-16 space-y-4">
        <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider">Testimonials</span>
        <h2 className="text-3xl sm:text-5xl font-bold tracking-tight">
          Real Results. Real Impact.
        </h2>
        <p className="text-gray-500 dark:text-gray-400 max-w-xl mx-auto">
          Real-world success stories showcasing growth, performance, and productivity improvements.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {testimonials.map((t, i) => (
          <motion.div
            key={i}
            variants={fadeUp}
            custom={i}
            className="p-6 sm:p-8 bg-white dark:bg-card-dark rounded-2xl border border-gray-200 dark:border-border-dark"
          >
            <div className="flex gap-0.5 mb-4">
              {Array.from({ length: t.stars }).map((_, j) => (
                <Star key={j} size={14} className="text-yellow-400 fill-yellow-400" />
              ))}
            </div>
            <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-300 mb-6">"{t.quote}"</p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/60 to-purple-500/60" />
              <div>
                <div className="text-sm font-bold">{t.name}</div>
                <div className="text-[11px] text-gray-400">{t.role}</div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  </Section>
);

/* ════════════════════════════════════════════════
   PRICING
   ════════════════════════════════════════════════ */
const plans = [
  {
    name: 'Free',
    price: '$0',
    description: 'For individuals and small teams getting started.',
    features: ['Up to 10 members', 'Unlimited issues', 'Basic integrations', 'Community support', '1 GB storage'],
  },
  {
    name: 'Standard',
    price: '$12',
    description: 'For growing product teams that need more.',
    features: ['Unlimited members', 'All Free features', 'Advanced integrations', 'Priority support', 'Templates & Roadmaps', '10 GB storage'],
    popular: true,
  },
  {
    name: 'Plus',
    price: '$24',
    description: 'For large organizations with advanced needs.',
    features: ['All Standard features', 'SAML SSO', 'Audit logs', 'Advanced analytics', 'Dedicated manager', '100 GB storage'],
  },
];

const Pricing = () => {
  const navigate = useNavigate();
  return (
    <Section id="pricing" className="py-24 sm:py-32">
      <div className="max-w-7xl mx-auto px-4">
        <motion.div variants={fadeUp} className="text-center mb-16 space-y-4">
          <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider">Pricing</span>
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight">Simple, Transparent Pricing.</h2>
          <p className="text-gray-500 dark:text-gray-400">Choose the plan that fits your team. Upgrade anytime.</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((p, i) => (
            <motion.div
              key={i}
              variants={fadeUp}
              custom={i}
              className={`relative p-8 rounded-2xl border transition-all ${
                p.popular
                  ? 'border-primary ring-4 ring-primary/10 shadow-xl shadow-primary/10'
                  : 'border-gray-200 dark:border-border-dark hover:border-primary/30'
              } bg-white dark:bg-card-dark`}
            >
              {p.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white text-[10px] font-bold uppercase px-4 py-1 rounded-full shadow-lg shadow-primary/25">
                  Most Popular
                </div>
              )}
              <h3 className="text-lg font-bold mb-2">{p.name}</h3>
              <div className="flex items-baseline gap-1 mb-2">
                <span className="text-4xl font-bold">{p.price}</span>
                <span className="text-gray-400 text-sm">/user/month</span>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">{p.description}</p>
              <button
                onClick={() => navigate('/signup')}
                className={`w-full py-3 rounded-xl font-bold text-sm transition-all mb-8 ${
                  p.popular
                    ? 'bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/20'
                    : 'bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10'
                }`}
              >
                Get started
              </button>
              <ul className="space-y-3">
                {p.features.map((f, j) => (
                  <li key={j} className="flex items-center gap-3 text-sm">
                    <CheckCircle2 size={15} className="text-primary shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>
    </Section>
  );
};

/* ════════════════════════════════════════════════
   CTA BANNER
   ════════════════════════════════════════════════ */
const CTA = () => {
  const navigate = useNavigate();
  return (
    <Section className="py-24 sm:py-32">
      <div className="max-w-4xl mx-auto px-4">
        <motion.div
          variants={fadeUp}
          className="relative text-center p-10 sm:p-16 rounded-3xl bg-gradient-to-br from-primary via-primary to-violet-600 overflow-hidden"
        >
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjIiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-50" />
          <h2 className="relative text-3xl sm:text-4xl font-bold text-white mb-4">
            Ready to streamline your workflow?
          </h2>
          <p className="relative text-white/70 max-w-lg mx-auto mb-8">
            Join thousands of teams already using Trussen to ship faster and stay aligned.
          </p>
          <div className="relative flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => navigate('/signup')}
              className="w-full sm:w-auto px-8 py-4 bg-white text-primary font-bold rounded-2xl hover:bg-white/90 transition-all shadow-xl flex items-center justify-center gap-2 group"
            >
              Get Started Free
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
            <button className="w-full sm:w-auto px-8 py-4 bg-white/10 text-white font-semibold rounded-2xl hover:bg-white/20 transition-all border border-white/20">
              Talk to Sales
            </button>
          </div>
        </motion.div>
      </div>
    </Section>
  );
};

/* ════════════════════════════════════════════════
   FOOTER
   ════════════════════════════════════════════════ */
const Footer = () => (
  <footer className="bg-white dark:bg-bg-dark border-t border-gray-200 dark:border-border-dark pt-20 pb-10">
    <div className="max-w-7xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-12 mb-20">
      <div className="col-span-2 lg:col-span-2 space-y-6">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center text-white text-lg font-bold shadow-lg shadow-primary/25">L</div>
          <span className="text-xl font-bold tracking-tight">Trussen</span>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs leading-relaxed">
          The next generation of project management. Built for high-performance teams who ship.
        </p>
        <div className="flex gap-4">
          {[Twitter, Github, Linkedin].map((Icon, i) => (
            <div key={i} className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-white/5 flex items-center justify-center text-gray-400 hover:text-primary hover:bg-primary/10 transition-colors cursor-pointer">
              <Icon size={16} />
            </div>
          ))}
        </div>
      </div>
      {[
        { title: 'Product', items: ['Features', 'Integrations', 'Pricing', 'Changelog', 'Roadmap'] },
        { title: 'Company', items: ['About', 'Blog', 'Careers', 'Contact', 'Press'] },
        { title: 'Legal', items: ['Privacy', 'Terms', 'Cookie Policy', 'Security'] },
      ].map((col) => (
        <div key={col.title}>
          <h4 className="font-bold text-sm mb-6">{col.title}</h4>
          <ul className="space-y-3">
            {col.items.map((item) => (
              <li key={item} className="text-sm text-gray-500 dark:text-gray-400 hover:text-primary cursor-pointer transition-colors">{item}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
    <div className="max-w-7xl mx-auto px-4 pt-8 border-t border-gray-100 dark:border-border-dark flex flex-col sm:flex-row items-center justify-between gap-4">
      <p className="text-xs text-gray-400">&copy; 2025 Trussen Inc. All rights reserved.</p>
      <div className="flex items-center gap-6">
        {['Privacy', 'Terms', 'Cookies'].map((l) => (
          <span key={l} className="text-xs text-gray-400 hover:text-primary cursor-pointer transition-colors">{l}</span>
        ))}
      </div>
    </div>
  </footer>
);

/* ════════════════════════════════════════════════
   PAGE
   ════════════════════════════════════════════════ */
export const MarketingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-white dark:bg-bg-dark text-gray-900 dark:text-gray-100 selection:bg-primary/30">
      <Nav />
      <main>
        <Hero />
        <TrustedBy />
        <Features />
        <Stats />
        <HowItWorks />
        <Testimonials />
        <Pricing />
        <CTA />
      </main>
      <Footer />
    </div>
  );
};
