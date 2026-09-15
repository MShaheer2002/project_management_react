import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Globe2, GraduationCap, HeartPulse, Laptop, Plane, Scale } from 'lucide-react';
import { MarketingLayout, PageHero, Section, SectionHeading, fadeUp } from './shared';

const CAREERS_EMAIL = 'careers@trussen.app';

type Role = {
  title: string;
  team: string;
  location: string;
  type: string;
  description: string;
};

/** Empty array renders the "no openings" state below — keep it honest. */
const roles: Role[] = [
  {
    title: 'Senior Full-Stack Engineer',
    team: 'Engineering',
    location: 'Remote',
    type: 'Full-time',
    description:
      'Own features end to end across a TypeScript stack — React on the front, Node and Postgres behind it. You will ship to production in your first week.',
  },
  {
    title: 'Product Designer',
    team: 'Design',
    location: 'Remote',
    type: 'Full-time',
    description:
      'Shape how a keyboard-first product feels. Equal parts interaction design and hard editing — deciding what does not get built.',
  },
  {
    title: 'Developer Advocate',
    team: 'Growth',
    location: 'Remote',
    type: 'Full-time',
    description:
      'Write the technical content, build the integrations, and be the person developers actually want to talk to about Trussen.',
  },
];

const benefits = [
  { icon: Globe2, title: 'Remote-first', text: 'Work from wherever you do your best thinking. No return-to-office plan waiting in a drawer.' },
  { icon: Plane, title: 'Real time off', text: 'Generous paid leave with a mandatory minimum, because unlimited PTO usually means less of it.' },
  { icon: Laptop, title: 'Your setup', text: 'A budget for the machine, desk and chair you actually want.' },
  { icon: HeartPulse, title: 'Health cover', text: 'Medical, dental and vision for you and your dependents.' },
  { icon: GraduationCap, title: 'Learning budget', text: 'Courses, books and conferences — the ones you pick, not a curated list.' },
  { icon: Scale, title: 'Meaningful equity', text: 'Everyone gets a stake, with a long exercise window so leaving is not a penalty.' },
];

export const CareersPage: React.FC = () => (
  <MarketingLayout>
    <PageHero
      eyebrow="Careers"
      title="Come build"
      titleAccent="with us."
      subtitle="A small, remote, self-funded team building a tool we use every day. Short meetings, real ownership, and code that ships the week it is written."
    />

    <Section className="pb-20">
      <div className="max-w-4xl mx-auto px-4">
        <SectionHeading eyebrow="Open roles" title="Where we need help." />

        {roles.length === 0 ? (
          <motion.div
            variants={fadeUp}
            className="p-10 rounded-2xl bg-gray-50 dark:bg-white/[0.03] border border-gray-200 dark:border-border-dark text-center"
          >
            <h3 className="font-bold mb-2">No open roles right now</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto leading-relaxed">
              We are not hiring at the moment, but we always read speculative applications. Send us
              something you have built and why Trussen interests you.
            </p>
            <a
              href={`mailto:${CAREERS_EMAIL}`}
              className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-primary text-white text-sm font-bold rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
            >
              Get in touch
            </a>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {roles.map((role, i) => (
              <motion.a
                key={role.title}
                href={`mailto:${CAREERS_EMAIL}?subject=${encodeURIComponent(`Application: ${role.title}`)}`}
                variants={fadeUp}
                custom={i}
                className="group block p-7 rounded-2xl bg-white dark:bg-card-dark border border-gray-200 dark:border-border-dark hover:border-primary/40 hover:shadow-md transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="font-bold text-lg">{role.title}</h3>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      {[role.team, role.location, role.type].map((tag) => (
                        <span
                          key={tag}
                          className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    <p className="mt-3 text-sm text-gray-500 dark:text-gray-400 leading-relaxed max-w-2xl">
                      {role.description}
                    </p>
                  </div>
                  <span className="shrink-0 inline-flex items-center gap-2 text-sm font-semibold text-primary group-hover:gap-3 transition-all">
                    Apply
                    <ArrowRight size={16} />
                  </span>
                </div>
              </motion.a>
            ))}
          </div>
        )}

        <motion.p variants={fadeUp} className="text-center text-sm text-gray-400 mt-8">
          Don't see your role?{' '}
          <a href={`mailto:${CAREERS_EMAIL}`} className="text-primary font-medium hover:underline">
            Tell us what you'd build here.
          </a>
        </motion.p>
      </div>
    </Section>

    <Section className="py-20 bg-gray-50/60 dark:bg-white/[0.02]">
      <div className="max-w-7xl mx-auto px-4">
        <SectionHeading eyebrow="Benefits" title="How we look after people." />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {benefits.map((b, i) => (
            <motion.div
              key={b.title}
              variants={fadeUp}
              custom={i}
              className="p-7 rounded-2xl bg-white dark:bg-card-dark border border-gray-200 dark:border-border-dark"
            >
              <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-5">
                <b.icon size={20} />
              </div>
              <h3 className="font-bold mb-2">{b.title}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{b.text}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </Section>
  </MarketingLayout>
);
