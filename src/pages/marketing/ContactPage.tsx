import React from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { BookOpen, LifeBuoy, Mail, MessageSquare, ShieldAlert } from 'lucide-react';
import { MarketingLayout, PageHero, Section, fadeUp } from './shared';

/**
 * Deliberately mailto-based rather than a form: there is no contact-form
 * endpoint on the API yet, and a form that silently drops messages is worse
 * than no form. Swap these for a real submit handler once the endpoint
 * exists.
 */
const channels = [
  {
    icon: MessageSquare,
    title: 'Sales',
    text: 'Pricing for larger teams, procurement questions, or a walkthrough before you commit.',
    email: 'sales@trussen.app',
  },
  {
    icon: LifeBuoy,
    title: 'Support',
    text: 'Something broken, something confusing, or a bug you want fixed. We read every message.',
    email: 'support@trussen.app',
  },
  {
    icon: ShieldAlert,
    title: 'Security',
    text: 'Report a vulnerability. We respond to every disclosure within one business day.',
    email: 'security@trussen.app',
  },
  {
    icon: BookOpen,
    title: 'Press',
    text: 'Media enquiries, interviews and brand assets.',
    email: 'press@trussen.app',
  },
];

export const ContactPage: React.FC = () => (
  <MarketingLayout>
    <PageHero
      eyebrow="Contact"
      title="Talk to"
      titleAccent="a human."
      subtitle="No ticket queue that swallows your message. Pick the right inbox below and you will hear back from someone who can actually help."
    />

    <Section className="pb-24">
      <div className="max-w-4xl mx-auto px-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {channels.map((c, i) => (
            <motion.a
              key={c.title}
              href={`mailto:${c.email}`}
              variants={fadeUp}
              custom={i}
              className="group p-7 rounded-2xl bg-white dark:bg-card-dark border border-gray-200 dark:border-border-dark hover:border-primary/40 hover:shadow-md transition-all"
            >
              <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-5">
                <c.icon size={20} />
              </div>
              <h3 className="font-bold mb-2">{c.title}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-4">
                {c.text}
              </p>
              <span className="inline-flex items-center gap-2 text-sm font-semibold text-primary">
                <Mail size={14} />
                {c.email}
              </span>
            </motion.a>
          ))}
        </div>

        <motion.div
          variants={fadeUp}
          className="mt-10 p-8 rounded-2xl bg-gray-50 dark:bg-white/[0.03] border border-gray-200 dark:border-border-dark text-center"
        >
          <h3 className="font-bold mb-2">Already using Trussen?</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-lg mx-auto leading-relaxed">
            Support requests from inside the app carry your workspace context, which usually means
            a faster answer. Use the help menu in the top-right of your dashboard.
          </p>
          <Link
            to="/login"
            className="mt-6 inline-flex items-center justify-center px-6 py-3 bg-primary text-white text-sm font-bold rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
          >
            Log in
          </Link>
        </motion.div>
      </div>
    </Section>
  </MarketingLayout>
);
