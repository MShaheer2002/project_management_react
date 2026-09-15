import React from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { ArrowRight, Plug, Sparkles } from 'lucide-react';
import {
  MarketingLayout,
  PageHero,
  Section,
  SectionHeading,
  CTABanner,
  fadeUp,
  brandLogos,
} from './shared';

/**
 * Falls back to a generic icon if a logo fails to load — these are all
 * third-party CDNs, and a broken-image glyph on the marketing site is a
 * worse look than a plain plug.
 */
const LogoTile: React.FC<{ name: string }> = ({ name }) => {
  const [failed, setFailed] = React.useState(false);
  const src = brandLogos[name];

  if (!src || failed) {
    return (
      <div className="w-11 h-11 rounded-xl bg-gray-100 dark:bg-white/5 flex items-center justify-center text-primary">
        <Plug size={18} />
      </div>
    );
  }

  return (
    <div className="w-11 h-11 rounded-xl bg-gray-100 dark:bg-white/5 p-2.5 flex items-center justify-center">
      <img
        src={src}
        alt={name}
        loading="lazy"
        onError={() => setFailed(true)}
        className="w-full h-full object-contain"
      />
    </div>
  );
};

type Integration = {
  name: string;
  category: string;
  description: string;
  status: 'live' | 'beta' | 'soon';
};

const integrations: Integration[] = [
  {
    name: 'GitHub',
    category: 'Development',
    description: 'Link branches, commits and pull requests to issues. Status syncs both ways automatically.',
    status: 'live',
  },
  {
    name: 'Slack',
    category: 'Communication',
    description: 'Issue notifications in the channels your team already watches, plus slash commands to file work.',
    status: 'live',
  },
  {
    name: 'Google Drive',
    category: 'Storage',
    description: 'Attach Drive files to issues and documents without copying them into another system.',
    status: 'live',
  },
  {
    name: 'Figma',
    category: 'Design',
    description: 'Embed live design previews on issues so specs never drift from the artwork.',
    status: 'live',
  },
  {
    name: 'Discord',
    category: 'Communication',
    description: 'Webhook-driven updates for teams that run their day in Discord instead of Slack.',
    status: 'live',
  },
  {
    name: 'Stripe',
    category: 'Billing',
    description: 'Powers Trussen subscriptions and seat management under the hood.',
    status: 'live',
  },
  {
    name: 'Claude & MCP clients',
    category: 'AI',
    description: 'Connect any MCP-compatible AI client to read and act on your workspace, with scoped permissions.',
    status: 'beta',
  },
  {
    name: 'Jira import',
    category: 'Migration',
    description: 'Bring projects, issues and history across in one pass.',
    status: 'soon',
  },
  {
    name: 'Linear import',
    category: 'Migration',
    description: 'Map teams, cycles and issue states into their Trussen equivalents.',
    status: 'soon',
  },
];

const statusStyles: Record<Integration['status'], { label: string; className: string }> = {
  live: { label: 'Live', className: 'bg-green-500/10 text-green-500' },
  beta: { label: 'Beta', className: 'bg-blue-500/10 text-blue-500' },
  soon: { label: 'Coming soon', className: 'bg-orange-500/10 text-orange-500' },
};

export const IntegrationsPage: React.FC = () => (
  <MarketingLayout>
    <PageHero
      eyebrow="Integrations"
      title="Connects to the tools"
      titleAccent="you already use."
      subtitle="Trussen is the planning layer, not another silo. Wire it into your codebase, your chat and your design files so work stays in sync without anyone copying status updates by hand."
    />

    <Section className="pb-10">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {integrations.map((integration, i) => (
            <motion.div
              key={integration.name}
              variants={fadeUp}
              custom={i}
              className="p-6 rounded-2xl bg-white dark:bg-card-dark border border-gray-200 dark:border-border-dark hover:border-primary/40 hover:shadow-md transition-all flex flex-col"
            >
              <div className="flex items-start justify-between mb-5">
                <LogoTile name={integration.name} />
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${statusStyles[integration.status].className}`}
                >
                  {statusStyles[integration.status].label}
                </span>
              </div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                {integration.category}
              </div>
              <h3 className="font-bold mb-2">{integration.name}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                {integration.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </Section>

    <Section className="py-24">
      <div className="max-w-7xl mx-auto px-4">
        <SectionHeading
          eyebrow="Build your own"
          title="An API for everything else."
          subtitle="Anything the interface can do, your own tooling can do too."
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {[
            {
              title: 'REST API',
              text: 'Full coverage of issues, projects, teams and cycles, authenticated with scoped API keys.',
            },
            {
              title: 'Webhooks',
              text: 'Subscribe to workspace events and push them wherever your process needs them.',
            },
            {
              title: 'MCP server',
              text: 'Expose your workspace to AI clients through the Model Context Protocol, with per-connection scopes.',
            },
          ].map((item, i) => (
            <motion.div
              key={item.title}
              variants={fadeUp}
              custom={i}
              className="p-8 rounded-2xl bg-white dark:bg-card-dark border border-gray-200 dark:border-border-dark"
            >
              <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-5">
                <Sparkles size={20} />
              </div>
              <h3 className="font-bold mb-2">{item.title}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{item.text}</p>
            </motion.div>
          ))}
        </div>

        <motion.div variants={fadeUp} className="text-center mt-12">
          <Link
            to="/contact"
            className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:gap-3 transition-all"
          >
            Need an integration we don't have yet? Tell us
            <ArrowRight size={16} />
          </Link>
        </motion.div>
      </div>
    </Section>

    <CTABanner />
  </MarketingLayout>
);
