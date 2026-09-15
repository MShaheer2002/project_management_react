import React from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Minus } from 'lucide-react';
import { MarketingLayout, PageHero, Section, SectionHeading, CTABanner, fadeUp, plans } from './shared';

/** Feature-by-plan matrix. `true` renders a tick, a string renders as-is. */
const comparison: { section: string; rows: { label: string; values: (boolean | string)[] }[] }[] = [
  {
    section: 'Core',
    rows: [
      { label: 'Members', values: ['Up to 10', 'Unlimited', 'Unlimited'] },
      { label: 'Issues & projects', values: ['Unlimited', 'Unlimited', 'Unlimited'] },
      { label: 'Storage', values: ['1 GB', '10 GB', '100 GB'] },
      { label: 'Cycles & roadmaps', values: [false, true, true] },
      { label: 'Templates', values: [false, true, true] },
    ],
  },
  {
    section: 'Collaboration',
    rows: [
      { label: 'Teams & departments', values: [true, true, true] },
      { label: 'Workflow automation', values: [false, true, true] },
      { label: 'Guest access', values: [false, true, true] },
      { label: 'Custom statuses', values: [false, true, true] },
    ],
  },
  {
    section: 'Intelligence',
    rows: [
      { label: 'Trussen AI assistant', values: ['Limited', 'Standard quota', 'Priority quota'] },
      { label: 'Analytics', values: ['Basic', 'Advanced', 'Advanced'] },
      { label: 'AI connections (MCP)', values: [false, true, true] },
    ],
  },
  {
    section: 'Administration',
    rows: [
      { label: 'Role-based permissions', values: [true, true, true] },
      { label: 'Invite domain restrictions', values: [true, true, true] },
      { label: 'SAML SSO', values: [false, false, true] },
      { label: 'Audit logs', values: [false, false, true] },
      { label: 'Dedicated account manager', values: [false, false, true] },
    ],
  },
];

const faqs = [
  {
    q: 'Is the free plan actually free?',
    a: 'Yes — free forever for up to 10 members, no credit card required to start. It is a real plan, not a trial that expires.',
  },
  {
    q: 'What counts as a member?',
    a: 'Anyone with a seat in your workspace who can create or be assigned work. Guests with read-only access do not consume a seat on paid plans.',
  },
  {
    q: 'Can I change plans later?',
    a: 'Any time, in both directions. Upgrades take effect immediately and are prorated; downgrades apply at the end of the current billing period.',
  },
  {
    q: 'What happens if I go over my storage?',
    a: 'Nothing breaks. You will be prompted to clean up or upgrade — existing files stay accessible and no work is lost.',
  },
  {
    q: 'Do you offer discounts?',
    a: 'Annual billing saves roughly two months versus monthly. We also have reduced pricing for registered non-profits and student teams — get in touch.',
  },
];

const Cell: React.FC<{ value: boolean | string }> = ({ value }) => {
  if (value === true) return <CheckCircle2 size={16} className="text-primary mx-auto" />;
  if (value === false) return <Minus size={16} className="text-gray-300 dark:text-gray-600 mx-auto" />;
  return <span className="text-sm text-gray-600 dark:text-gray-300">{value}</span>;
};

export const PricingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <MarketingLayout>
      <PageHero
        eyebrow="Pricing"
        title="Simple, transparent"
        titleAccent="pricing."
        subtitle="Start free and stay free until your team outgrows it. No per-feature upsells, no surprise line items."
      />

      {/* ─── Plan cards ─── */}
      <Section className="pb-10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((p, i) => (
              <motion.div
                key={p.name}
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
                  {p.features.map((f) => (
                    <li key={f} className="flex items-center gap-3 text-sm">
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

      {/* ─── Comparison table ─── */}
      <Section className="py-24">
        <div className="max-w-7xl mx-auto px-4">
          <SectionHeading eyebrow="Compare" title="Every plan, side by side." />

          <motion.div
            variants={fadeUp}
            className="overflow-x-auto rounded-2xl border border-gray-200 dark:border-border-dark bg-white dark:bg-card-dark"
          >
            <table className="w-full min-w-[640px]">
              <thead>
                <tr className="border-b border-gray-200 dark:border-border-dark">
                  <th className="text-left text-sm font-bold p-5 w-1/3">Feature</th>
                  {plans.map((p) => (
                    <th key={p.name} className="text-center text-sm font-bold p-5">
                      {p.name}
                      <div className="text-xs font-normal text-gray-400 mt-0.5">{p.price}/mo</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {comparison.map((group) => (
                  <React.Fragment key={group.section}>
                    <tr className="bg-gray-50 dark:bg-white/[0.03]">
                      <td
                        colSpan={4}
                        className="px-5 py-2.5 text-[11px] font-bold uppercase tracking-wider text-gray-400"
                      >
                        {group.section}
                      </td>
                    </tr>
                    {group.rows.map((row) => (
                      <tr
                        key={row.label}
                        className="border-t border-gray-100 dark:border-border-dark/60"
                      >
                        <td className="px-5 py-4 text-sm">{row.label}</td>
                        {row.values.map((v, i) => (
                          <td key={i} className="px-5 py-4 text-center">
                            <Cell value={v} />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </motion.div>
        </div>
      </Section>

      {/* ─── FAQ ─── */}
      <Section className="pb-24">
        <div className="max-w-3xl mx-auto px-4">
          <SectionHeading eyebrow="FAQ" title="Questions, answered." />
          <div className="space-y-4">
            {faqs.map((f, i) => (
              <motion.div
                key={f.q}
                variants={fadeUp}
                custom={i}
                className="p-6 rounded-2xl bg-white dark:bg-card-dark border border-gray-200 dark:border-border-dark"
              >
                <h3 className="font-bold mb-2">{f.q}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{f.a}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      <CTABanner title="Start free. Upgrade when it earns it." subtitle="No credit card required to get going." />
    </MarketingLayout>
  );
};
