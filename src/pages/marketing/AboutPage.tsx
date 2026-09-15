import React from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { ArrowRight, Compass, Gauge, Heart, Lock } from 'lucide-react';
import { MarketingLayout, PageHero, Section, SectionHeading, CTABanner, fadeUp } from './shared';

const values = [
  {
    icon: Gauge,
    title: 'Speed is a feature',
    text: 'A tool you use fifty times a day has no right to be slow. Every interaction is measured, and regressions get treated as bugs.',
  },
  {
    icon: Compass,
    title: 'Opinionated defaults',
    text: 'Endless configuration is a way of pushing product decisions onto the customer. We pick sensible defaults and let you change what genuinely varies.',
  },
  {
    icon: Lock,
    title: 'Your data is yours',
    text: 'Export everything, any time, in a format you can actually use. No lock-in as a retention strategy.',
  },
  {
    icon: Heart,
    title: 'Built in the open',
    text: 'A public roadmap, a real changelog, and honest answers when something is not ready yet.',
  },
];

const stats = [
  { value: '2026', label: 'Founded' },
  { value: 'Remote', label: 'Team' },
  { value: 'Public beta', label: 'Stage' },
  { value: 'Self-funded', label: 'Backing' },
];

export const AboutPage: React.FC = () => (
  <MarketingLayout>
    <PageHero
      eyebrow="About"
      title="Project management that"
      titleAccent="gets out of the way."
      subtitle="We started Trussen because the tools meant to help teams ship had quietly become the thing slowing them down."
    />

    <Section className="pb-20">
      <div className="max-w-3xl mx-auto px-4">
        <motion.div variants={fadeUp} className="space-y-6 text-gray-600 dark:text-gray-300 leading-relaxed">
          <p>
            Every team we worked on had the same story. The tracker started simple, then someone
            added a required field. Then a second workflow, a third board, an automation nobody
            fully understood, and a weekly ritual of updating statuses that everyone quietly
            resented. The tool that was supposed to show what was happening became a second job.
          </p>
          <p>
            Trussen is our answer to that. One fast workspace where issues, projects, cycles and
            roadmaps share the same underlying model, so the thing you file in the morning already
            knows where it belongs. Keyboard-first, because the people doing the work should not
            have to hunt through menus. AI where it genuinely removes tedium, not as a banner
            across the top of the screen.
          </p>
          <p>
            We are a small, remote, self-funded team. That shapes the product: we would rather ship
            a narrow thing that works properly than a wide thing that mostly does. The roadmap is
            public, the changelog is honest, and when something is not ready we say so.
          </p>
        </motion.div>

        <motion.div
          variants={fadeUp}
          className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-14"
        >
          {stats.map((s) => (
            <div
              key={s.label}
              className="p-5 rounded-2xl bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-border-dark text-center"
            >
              <div className="text-lg font-bold">{s.value}</div>
              <div className="text-xs text-gray-400 mt-1">{s.label}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </Section>

    <Section className="py-20 bg-gray-50/60 dark:bg-white/[0.02]">
      <div className="max-w-7xl mx-auto px-4">
        <SectionHeading eyebrow="Values" title="What we optimise for." />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {values.map((v, i) => (
            <motion.div
              key={v.title}
              variants={fadeUp}
              custom={i}
              className="p-7 rounded-2xl bg-white dark:bg-card-dark border border-gray-200 dark:border-border-dark"
            >
              <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-5">
                <v.icon size={20} />
              </div>
              <h3 className="font-bold mb-2">{v.title}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{v.text}</p>
            </motion.div>
          ))}
        </div>

        <motion.div variants={fadeUp} className="text-center mt-12">
          <Link
            to="/careers"
            className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:gap-3 transition-all"
          >
            We're hiring — see open roles
            <ArrowRight size={16} />
          </Link>
        </motion.div>
      </div>
    </Section>

    <CTABanner />
  </MarketingLayout>
);
