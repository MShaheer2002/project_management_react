import React from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { ArrowRight, CircleDashed, Loader2, Rocket } from 'lucide-react';
import { MarketingLayout, PageHero, Section, CTABanner, fadeUp } from './shared';

type Column = {
  key: 'shipping' | 'building' | 'exploring';
  label: string;
  description: string;
  icon: React.ElementType;
  accent: string;
  items: { title: string; text: string }[];
};

const columns: Column[] = [
  {
    key: 'shipping',
    label: 'Shipping now',
    description: 'In the current release cycle.',
    icon: Rocket,
    accent: 'text-green-500 bg-green-500/10',
    items: [
      {
        title: 'Jira & Linear import',
        text: 'One-pass migration of projects, issues and history, with a mapping step for statuses and teams.',
      },
      {
        title: 'Saved views',
        text: 'Persist any filter, grouping and sort combination and share it with your team.',
      },
      {
        title: 'Mobile web polish',
        text: 'Full issue triage from a phone, including drag-free status changes.',
      },
    ],
  },
  {
    key: 'building',
    label: 'In progress',
    description: 'Actively being built.',
    icon: Loader2,
    accent: 'text-blue-500 bg-blue-500/10',
    items: [
      {
        title: 'Native desktop app',
        text: 'A real app with global shortcuts and offline-tolerant drafting, not a wrapped browser tab.',
      },
      {
        title: 'Advanced reporting',
        text: 'Custom dashboards with exportable charts and scheduled email digests.',
      },
      {
        title: 'SAML SSO',
        text: 'Enterprise single sign-on with SCIM user provisioning.',
      },
      {
        title: 'Audit logs',
        text: 'A complete, queryable record of who changed what across the workspace.',
      },
    ],
  },
  {
    key: 'exploring',
    label: 'Exploring',
    description: 'Researching, not committed.',
    icon: CircleDashed,
    accent: 'text-purple-500 bg-purple-500/10',
    items: [
      {
        title: 'Customer portal',
        text: 'A read-only external view so clients can track delivery without a seat.',
      },
      {
        title: 'Capacity planning',
        text: 'Forecasting cycle load against real historical throughput per person.',
      },
      {
        title: 'Public API v2',
        text: 'GraphQL alongside REST, with finer-grained subscriptions.',
      },
      {
        title: 'Self-hosting',
        text: 'A supported deployment path for teams with data residency requirements.',
      },
    ],
  },
];

export const RoadmapPage: React.FC = () => (
  <MarketingLayout>
    <PageHero
      eyebrow="Roadmap"
      title="What we're building"
      titleAccent="next."
      subtitle="An honest view of where Trussen is heading. Things move between columns as we learn — nothing here is a dated promise."
    />

    <Section className="pb-16">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {columns.map((col, ci) => (
            <motion.div key={col.key} variants={fadeUp} custom={ci} className="space-y-4">
              <div className="flex items-center gap-3 mb-6">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${col.accent}`}>
                  <col.icon size={18} />
                </div>
                <div>
                  <h2 className="font-bold">{col.label}</h2>
                  <p className="text-xs text-gray-400">{col.description}</p>
                </div>
              </div>

              {col.items.map((item) => (
                <div
                  key={item.title}
                  className="p-5 rounded-2xl bg-white dark:bg-card-dark border border-gray-200 dark:border-border-dark hover:border-primary/40 hover:shadow-md transition-all"
                >
                  <h3 className="font-bold text-sm mb-2">{item.title}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                    {item.text}
                  </p>
                </div>
              ))}
            </motion.div>
          ))}
        </div>

        <motion.div
          variants={fadeUp}
          className="mt-16 p-8 sm:p-10 rounded-2xl bg-gray-50 dark:bg-white/[0.03] border border-gray-200 dark:border-border-dark text-center"
        >
          <h3 className="text-xl font-bold mb-2">Something missing?</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-lg mx-auto mb-6 leading-relaxed">
            Roadmaps get better when the people using the product shape them. Tell us what would
            make the biggest difference for your team.
          </p>
          <Link
            to="/contact"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white text-sm font-bold rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 group"
          >
            Request a feature
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </motion.div>
      </div>
    </Section>

    <CTABanner />
  </MarketingLayout>
);
