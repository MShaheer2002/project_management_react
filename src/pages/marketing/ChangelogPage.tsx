import React from 'react';
import { motion } from 'motion/react';
import { MarketingLayout, PageHero, Section, CTABanner, fadeUp } from './shared';

type Entry = {
  version: string;
  date: string;
  title: string;
  summary: string;
  changes: { type: 'new' | 'improved' | 'fixed'; text: string }[];
};

/**
 * Newest first. Keep entries short — the point is that someone can skim six
 * months of releases in under a minute, not read a full commit log.
 */
const entries: Entry[] = [
  {
    version: '0.9.0',
    date: 'September 2026',
    title: 'Invite domain controls and workspace routing',
    summary:
      'Workspace owners can now decide exactly which email domains may be invited, and every company gets its own subdomain.',
    changes: [
      { type: 'new', text: 'Invite domain policy — allow any domain, your company domain only, or a custom allowlist of up to 20 domains.' },
      { type: 'new', text: 'Per-company subdomains, so each workspace lives at its own address.' },
      { type: 'improved', text: 'Sign-in now routes you straight to the right workspace instead of bouncing through an intermediate screen.' },
      { type: 'fixed', text: 'Fixed a redirect loop that could strand users on the login page after signing in with Google or GitHub.' },
    ],
  },
  {
    version: '0.8.0',
    date: 'August 2026',
    title: 'Trussen AI, rebuilt',
    summary:
      'The assistant was rewritten around a single agent loop with a proper tool registry, making it both faster and far more capable.',
    changes: [
      { type: 'new', text: 'Scoped AI connections — grant an external AI client only the permissions it actually needs.' },
      { type: 'new', text: 'OAuth support for MCP clients, so connecting Claude no longer requires hand-managed tokens.' },
      { type: 'improved', text: 'Semantic search across issues, projects and documents using vector embeddings.' },
      { type: 'improved', text: 'Background jobs now run on a dedicated worker with retry and rate-limit handling.' },
    ],
  },
  {
    version: '0.7.0',
    date: 'July 2026',
    title: 'Workflow automation',
    summary: 'Rules that move work forward without someone remembering to do it.',
    changes: [
      { type: 'new', text: 'Workflow automation rules at workspace and project level.' },
      { type: 'new', text: 'Issue approvals with a required-reviewer step before an issue can close.' },
      { type: 'improved', text: 'Per-project status overrides, so one team is not forced into another team’s process.' },
      { type: 'fixed', text: 'Status counts on project cards no longer drift after bulk updates.' },
    ],
  },
  {
    version: '0.6.0',
    date: 'June 2026',
    title: 'Documents and Drive',
    summary: 'Long-form context lives next to the work it describes.',
    changes: [
      { type: 'new', text: 'Documents with folders, rich text and inline code blocks.' },
      { type: 'new', text: 'Google Drive connection for attaching files without re-uploading them.' },
      { type: 'new', text: 'Custom workspace statuses with board visibility controls.' },
      { type: 'improved', text: 'Upload policy settings let admins choose which storage backends members may use.' },
    ],
  },
  {
    version: '0.5.0',
    date: 'May 2026',
    title: 'Analytics and roadmaps',
    summary: 'Reporting built from the work itself, not a separate spreadsheet.',
    changes: [
      { type: 'new', text: 'Analytics dashboard covering throughput, cycle time and workload.' },
      { type: 'new', text: 'Quarter-level roadmap view linked to underlying issues.' },
      { type: 'new', text: 'Project and issue templates.' },
      { type: 'improved', text: 'Cycles now carry unfinished work forward automatically.' },
    ],
  },
];

const typeStyles: Record<Entry['changes'][number]['type'], { label: string; className: string }> = {
  new: { label: 'New', className: 'bg-primary/10 text-primary' },
  improved: { label: 'Improved', className: 'bg-blue-500/10 text-blue-500' },
  fixed: { label: 'Fixed', className: 'bg-green-500/10 text-green-500' },
};

export const ChangelogPage: React.FC = () => (
  <MarketingLayout>
    <PageHero
      eyebrow="Changelog"
      title="What's new in"
      titleAccent="Trussen."
      subtitle="Every meaningful change we ship, in plain language. Updated with each release."
    />

    <Section className="pb-24">
      <div className="max-w-3xl mx-auto px-4">
        <div className="relative">
          {/* timeline rail */}
          <div className="absolute left-[15px] top-3 bottom-3 w-px bg-gray-200 dark:bg-border-dark hidden sm:block" />

          <div className="space-y-12">
            {entries.map((entry, i) => (
              <motion.article key={entry.version} variants={fadeUp} custom={i} className="relative sm:pl-12">
                <div className="hidden sm:flex absolute left-0 top-2 w-8 h-8 rounded-full bg-white dark:bg-bg-dark border-2 border-primary/30 items-center justify-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                </div>

                <div className="flex flex-wrap items-center gap-3 mb-3">
                  <span className="px-2.5 py-1 rounded-lg bg-primary/10 text-primary text-xs font-bold">
                    v{entry.version}
                  </span>
                  <span className="text-xs text-gray-400">{entry.date}</span>
                </div>

                <h2 className="text-xl sm:text-2xl font-bold tracking-tight mb-2">{entry.title}</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-6">
                  {entry.summary}
                </p>

                <ul className="space-y-3">
                  {entry.changes.map((c, j) => (
                    <li key={j} className="flex items-start gap-3">
                      <span
                        className={`shrink-0 mt-0.5 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md ${typeStyles[c.type].className}`}
                      >
                        {typeStyles[c.type].label}
                      </span>
                      <span className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                        {c.text}
                      </span>
                    </li>
                  ))}
                </ul>
              </motion.article>
            ))}
          </div>
        </div>
      </div>
    </Section>

    <CTABanner />
  </MarketingLayout>
);
