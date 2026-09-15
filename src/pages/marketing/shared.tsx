import React from 'react';
import { motion, useInView } from 'motion/react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { TrussenAppLogo } from '@/assets/svg/TrussenAppLogo';
import { ArrowRight, Github, Twitter, Linkedin, Menu, X } from 'lucide-react';
import { PROVIDER_META } from '@features/integrations';

/**
 * Shared marketing chrome.
 *
 * Nav, Footer and the motion helpers live here rather than inside
 * MarketingPage so every public page (features, pricing, legal, ...) renders
 * the same header/footer from one definition — the footer in particular
 * lists every marketing route, and having two copies of that list is how it
 * ends up half-updated.
 */

/* ─── animation helpers ─── */
export const ease = [0.22, 1, 0.36, 1] as const;

export const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      delay: i * 0.1,
      ease: ease as unknown as [number, number, number, number],
    },
  }),
};

export const Section: React.FC<{
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

/* ─── shared data ─── */

/**
 * Brand marks, shared by the landing page's logo strip and /integrations.
 *
 * The four the product actually integrates with come straight from
 * PROVIDER_META, so swapping a logo in the app updates these pages too.
 * Drive is user-scoped and sits outside PROVIDER_META (IntegrationsPage
 * hardcodes the same URL). The rest are Simple Icons, which serves official
 * brand SVGs — Slack is the one gap there (removed over brand policy), which
 * happens to be one the app already has.
 */
export const brandLogos: Record<string, string> = {
  GitHub: PROVIDER_META.github.logo,
  Slack: PROVIDER_META.slack.logo,
  Discord: PROVIDER_META.discord.logo,
  Figma: PROVIDER_META.figma.logo,
  'Google Drive': 'https://cdn-icons-png.flaticon.com/512/5968/5968523.png',
  Stripe: 'https://cdn.simpleicons.org/stripe',
  'Claude & MCP clients': 'https://cdn.simpleicons.org/claude',
  'Jira import': 'https://cdn.simpleicons.org/jira',
  'Linear import': 'https://cdn.simpleicons.org/linear',
};

/**
 * Plan data — shared so the landing page's pricing section and /pricing
 * can never drift apart on price or feature list.
 */
export const plans = [
  {
    name: 'Free',
    price: '$0',
    description: 'For individuals and small teams getting started.',
    features: [
      'Up to 10 members',
      'Unlimited issues',
      'Basic integrations',
      'Community support',
      '1 GB storage',
    ],
  },
  {
    name: 'Standard',
    price: '$12',
    description: 'For growing product teams that need more.',
    features: [
      'Unlimited members',
      'All Free features',
      'Advanced integrations',
      'Priority support',
      'Templates & Roadmaps',
      '10 GB storage',
    ],
    popular: true,
  },
  {
    name: 'Plus',
    price: '$24',
    description: 'For large organizations with advanced needs.',
    features: [
      'All Standard features',
      'SAML SSO',
      'Audit logs',
      'Advanced analytics',
      'Dedicated manager',
      '100 GB storage',
    ],
  },
];

/** Every public route, in the shape the footer renders them. */
const footerColumns = [
  {
    title: 'Product',
    items: [
      { label: 'Features', to: '/features' },
      { label: 'Integrations', to: '/integrations' },
      { label: 'Pricing', to: '/pricing' },
      { label: 'Changelog', to: '/changelog' },
      { label: 'Roadmap', to: '/roadmap' },
    ],
  },
  {
    title: 'Company',
    items: [
      { label: 'About', to: '/about' },
      { label: 'Blog', to: '/blog' },
      { label: 'Careers', to: '/careers' },
      { label: 'Contact', to: '/contact' },
      { label: 'Press', to: '/press' },
    ],
  },
  {
    title: 'Legal',
    items: [
      { label: 'Privacy', to: '/privacy' },
      { label: 'Terms', to: '/terms' },
      { label: 'Cookie Policy', to: '/cookies' },
      { label: 'Security', to: '/security' },
    ],
  },
];

const navLinks = [
  { label: 'Features', to: '/features' },
  { label: 'Integrations', to: '/integrations' },
  { label: 'Pricing', to: '/pricing' },
  { label: 'Changelog', to: '/changelog' },
];

/* ════════════════════════════════════════════════
   NAV
   ════════════════════════════════════════════════ */
export const Nav: React.FC = () => {
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
          <Link to="/marketing" className="flex items-center gap-2.5">
            <TrussenAppLogo className="w-11 h-11 shrink-0" />
            <span className="text-xl font-bold tracking-tight">Trussen</span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className="text-[13px] font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                {l.label}
              </Link>
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
          {navLinks.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              onClick={() => setOpen(false)}
              className="block py-2 text-sm font-medium"
            >
              {l.label}
            </Link>
          ))}
          <div className="pt-2 space-y-2">
            <button
              onClick={() => navigate('/login')}
              className="w-full py-2.5 text-sm font-medium border border-gray-200 dark:border-border-dark rounded-xl"
            >
              Log in
            </button>
            <button
              onClick={() => navigate('/signup')}
              className="w-full py-2.5 bg-primary text-white text-sm font-semibold rounded-xl"
            >
              Get Started Free
            </button>
          </div>
        </motion.div>
      )}
    </nav>
  );
};

/* ════════════════════════════════════════════════
   FOOTER
   ════════════════════════════════════════════════ */
export const Footer: React.FC = () => (
  <footer className="bg-white dark:bg-bg-dark border-t border-gray-200 dark:border-border-dark pt-20 pb-10">
    <div className="max-w-7xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-12 mb-20">
      <div className="col-span-2 lg:col-span-2 space-y-6">
        <Link to="/marketing" className="flex items-center gap-2.5">
          <TrussenAppLogo className="w-11 h-11 shrink-0" />
          <span className="text-xl font-bold tracking-tight">Trussen</span>
        </Link>
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs leading-relaxed">
          The next generation of project management. Built for high-performance teams who ship.
        </p>
        <div className="flex gap-4">
          {[Twitter, Github, Linkedin].map((Icon, i) => (
            <div
              key={i}
              className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-white/5 flex items-center justify-center text-gray-400 hover:text-primary hover:bg-primary/10 transition-colors cursor-pointer"
            >
              <Icon size={16} />
            </div>
          ))}
        </div>
      </div>
      {footerColumns.map((col) => (
        <div key={col.title}>
          <h4 className="font-bold text-sm mb-6">{col.title}</h4>
          <ul className="space-y-3">
            {col.items.map((item) => (
              <li key={item.to}>
                <Link
                  to={item.to}
                  className="text-sm text-gray-500 dark:text-gray-400 hover:text-primary transition-colors"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
    <div className="max-w-7xl mx-auto px-4 pt-8 border-t border-gray-100 dark:border-border-dark flex flex-col sm:flex-row items-center justify-between gap-4">
      <p className="text-xs text-gray-400">
        &copy; {new Date().getFullYear()} Trussen Inc. All rights reserved.
      </p>
      <div className="flex items-center gap-6">
        {[
          { label: 'Privacy', to: '/privacy' },
          { label: 'Terms', to: '/terms' },
          { label: 'Cookies', to: '/cookies' },
        ].map((l) => (
          <Link
            key={l.to}
            to={l.to}
            className="text-xs text-gray-400 hover:text-primary transition-colors"
          >
            {l.label}
          </Link>
        ))}
      </div>
    </div>
  </footer>
);

/* ════════════════════════════════════════════════
   LAYOUT + REUSABLE PAGE PIECES
   ════════════════════════════════════════════════ */

/** Nav + page body + footer. Every marketing page renders through this. */
export const MarketingLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { pathname } = useLocation();

  // Sub-pages start at the top; without this, navigating from a footer link
  // half-way down one page lands you half-way down the next one.
  //
  // A URL carrying a hash is the exception — someone opening
  // /terms#section-6 asked for a specific section, and that page scrolls
  // itself there. This effect would otherwise win (parent effects run after
  // the child's) and yank them back to the top.
  React.useEffect(() => {
    if (window.location.hash) return;
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="min-h-screen bg-white dark:bg-bg-dark text-gray-900 dark:text-gray-100 selection:bg-primary/30">
      <Nav />
      <main>{children}</main>
      <Footer />
    </div>
  );
};

/**
 * The standard sub-page header: eyebrow badge, headline (with an optional
 * gradient tail matching the hero), and a supporting line — plus the same
 * blurred gradient orbs the landing hero uses.
 */
export const PageHero: React.FC<{
  eyebrow: string;
  title: string;
  titleAccent?: string;
  subtitle: string;
  children?: React.ReactNode;
}> = ({ eyebrow, title, titleAccent, subtitle, children }) => (
  <section className="relative pt-32 sm:pt-40 pb-16 px-4 overflow-hidden">
    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-primary/[0.07] rounded-full blur-[120px] -z-10" />
    <div className="absolute top-40 -left-40 w-[400px] h-[400px] bg-purple-500/[0.05] rounded-full blur-[100px] -z-10" />

    <div className="max-w-4xl mx-auto text-center">
      <motion.span
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        custom={0}
        className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider"
      >
        {eyebrow}
      </motion.span>

      <motion.h1
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        custom={1}
        className="mt-6 text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1]"
      >
        {title}
        {titleAccent && (
          <>
            {' '}
            <span className="bg-gradient-to-r from-primary via-violet-500 to-purple-500 bg-clip-text text-transparent">
              {titleAccent}
            </span>
          </>
        )}
      </motion.h1>

      <motion.p
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        custom={2}
        className="mt-6 text-lg text-gray-500 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed"
      >
        {subtitle}
      </motion.p>

      {children && (
        <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={3} className="mt-10">
          {children}
        </motion.div>
      )}
    </div>
  </section>
);

/** The gradient call-to-action banner, reused at the foot of sub-pages. */
export const CTABanner: React.FC<{ title?: string; subtitle?: string }> = ({
  title = 'Ready to streamline your workflow?',
  subtitle = 'Join thousands of teams already using Trussen to ship faster and stay aligned.',
}) => {
  const navigate = useNavigate();
  return (
    <Section className="py-24 sm:py-32">
      <div className="max-w-4xl mx-auto px-4">
        <motion.div
          variants={fadeUp}
          className="relative text-center p-10 sm:p-16 rounded-3xl bg-gradient-to-br from-primary via-primary to-violet-600 overflow-hidden"
        >
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjIiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-50" />
          <h2 className="relative text-3xl sm:text-4xl font-bold text-white mb-4">{title}</h2>
          <p className="relative text-white/70 max-w-lg mx-auto mb-8">{subtitle}</p>
          <div className="relative flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => navigate('/signup')}
              className="w-full sm:w-auto px-8 py-4 bg-white text-primary font-bold rounded-2xl hover:bg-white/90 transition-all shadow-xl flex items-center justify-center gap-2 group"
            >
              Get Started Free
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
            <Link
              to="/contact"
              className="w-full sm:w-auto px-8 py-4 bg-white/10 text-white font-semibold rounded-2xl hover:bg-white/20 transition-all border border-white/20 text-center"
            >
              Talk to Sales
            </Link>
          </div>
        </motion.div>
      </div>
    </Section>
  );
};

/** Section heading used above content blocks on sub-pages. */
export const SectionHeading: React.FC<{
  eyebrow?: string;
  title: string;
  subtitle?: string;
}> = ({ eyebrow, title, subtitle }) => (
  <motion.div variants={fadeUp} className="text-center mb-16 space-y-4">
    {eyebrow && (
      <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider">
        {eyebrow}
      </span>
    )}
    <h2 className="text-3xl sm:text-5xl font-bold tracking-tight">{title}</h2>
    {subtitle && (
      <p className="text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">{subtitle}</p>
    )}
  </motion.div>
);
