import React from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  BarChart3,
  Bot,
  CheckCircle2,
  Clock,
  FolderKanban,
  GitBranch,
  Keyboard,
  LayoutGrid,
  MessageSquare,
  Shield,
  Target,
  Users,
  Workflow,
} from 'lucide-react';
import { MarketingLayout, PageHero, Section, SectionHeading, CTABanner, fadeUp } from './shared';

const featureGroups = [
  {
    eyebrow: 'Plan',
    title: 'Everything in one place',
    description:
      'Issues, projects, cycles and roadmaps share one data model — so a task you file in the morning already knows which project, team and cycle it belongs to.',
    items: [
      {
        icon: FolderKanban,
        title: 'Projects & Issues',
        text: 'Nested projects, custom statuses, labels, priorities, and dependencies that actually block.',
      },
      {
        icon: Clock,
        title: 'Cycles',
        text: 'Time-boxed sprints with automatic carry-over and burndown, without the ceremony.',
      },
      {
        icon: Target,
        title: 'Roadmaps',
        text: 'Quarter-level planning that stays linked to the issues underneath it, not a separate slide deck.',
      },
      {
        icon: LayoutGrid,
        title: 'Templates',
        text: 'Reusable project and issue scaffolds so recurring work starts from a known-good shape.',
      },
    ],
  },
  {
    eyebrow: 'Collaborate',
    title: 'Built for how teams actually work',
    description:
      'Context lives next to the work — not scattered across three tools and a thread someone forgot to CC you on.',
    items: [
      {
        icon: MessageSquare,
        title: 'Threaded comments',
        text: 'Discussion attached to the issue, with mentions that route to the right person.',
      },
      {
        icon: Users,
        title: 'Teams & departments',
        text: 'Model your real org structure, then scope views and permissions to it.',
      },
      {
        icon: Workflow,
        title: 'Workflow automation',
        text: 'Rules that move issues, assign owners, and update status when conditions are met.',
      },
      {
        icon: Shield,
        title: 'Granular permissions',
        text: 'Owner, admin, member and guest roles enforced server-side on every request.',
      },
    ],
  },
  {
    eyebrow: 'Accelerate',
    title: 'Fast by default',
    description:
      'Speed is a feature. Keyboard-first navigation, instant search, and AI that does the tedious parts for you.',
    items: [
      {
        icon: Keyboard,
        title: 'Command palette',
        text: 'Jump to anything, create anything, from anywhere — without touching the mouse.',
      },
      {
        icon: Bot,
        title: 'Trussen AI',
        text: 'Draft issues, summarise threads, and plan sprints with an assistant that knows your workspace.',
      },
      {
        icon: BarChart3,
        title: 'Analytics',
        text: 'Cycle time, throughput and workload distribution computed from the work itself.',
      },
      {
        icon: GitBranch,
        title: 'Git integration',
        text: 'Branches, commits and PRs linked to issues automatically, status synced both ways.',
      },
    ],
  },
];

const highlights = [
  'Unlimited issues on every plan',
  'Real-time updates across every client',
  'Full keyboard navigation',
  'Dark mode throughout',
  'Import from Jira, Linear and Asana',
  'REST API and MCP support',
];

export const FeaturesPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <MarketingLayout>
      <PageHero
        eyebrow="Features"
        title="Everything you need to"
        titleAccent="ship on time."
        subtitle="Trussen brings planning, execution and reporting into a single fast workspace — so your team spends its time building, not maintaining the tool that tracks the building."
      >
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={() => navigate('/signup')}
            className="w-full sm:w-auto px-8 py-4 bg-primary text-white font-bold rounded-2xl hover:bg-primary/90 transition-all shadow-xl shadow-primary/25 hover:shadow-2xl hover:shadow-primary/30 hover:-translate-y-0.5 flex items-center justify-center gap-2 group"
          >
            Get Started Free
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </button>
          <button
            onClick={() => navigate('/pricing')}
            className="w-full sm:w-auto px-8 py-4 bg-white dark:bg-white/5 border border-gray-200 dark:border-border-dark font-semibold rounded-2xl hover:bg-gray-50 dark:hover:bg-white/10 transition-all"
          >
            See pricing
          </button>
        </div>
      </PageHero>

      {featureGroups.map((group, gi) => (
        <Section key={group.title} className={gi % 2 === 1 ? 'py-20 bg-gray-50/60 dark:bg-white/[0.02]' : 'py-20'}>
          <div className="max-w-7xl mx-auto px-4">
            <motion.div variants={fadeUp} className="max-w-2xl mb-14">
              <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider">
                {group.eyebrow}
              </span>
              <h2 className="mt-5 text-3xl sm:text-4xl font-bold tracking-tight">{group.title}</h2>
              <p className="mt-4 text-gray-500 dark:text-gray-400 leading-relaxed">
                {group.description}
              </p>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {group.items.map((item, i) => (
                <motion.div
                  key={item.title}
                  variants={fadeUp}
                  custom={i}
                  className="p-6 rounded-2xl bg-white dark:bg-card-dark border border-gray-200 dark:border-border-dark hover:border-primary/40 hover:shadow-md transition-all"
                >
                  <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-5">
                    <item.icon size={20} />
                  </div>
                  <h3 className="font-bold mb-2">{item.title}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                    {item.text}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </Section>
      ))}

      <Section className="py-20">
        <div className="max-w-7xl mx-auto px-4">
          <SectionHeading
            eyebrow="And more"
            title="The details that add up."
            subtitle="Small things, done properly, across the whole product."
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
            {highlights.map((h, i) => (
              <motion.div
                key={h}
                variants={fadeUp}
                custom={i}
                className="flex items-center gap-3 p-4 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-border-dark"
              >
                <CheckCircle2 size={16} className="text-primary shrink-0" />
                <span className="text-sm">{h}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      <CTABanner />
    </MarketingLayout>
  );
};
