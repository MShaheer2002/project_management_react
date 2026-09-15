import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Clock } from 'lucide-react';
import { MarketingLayout, PageHero, Section, CTABanner, fadeUp } from './shared';

type Post = {
  title: string;
  excerpt: string;
  category: string;
  date: string;
  readTime: string;
  featured?: boolean;
};

/**
 * Static for now. When these become real articles, swap this array for a
 * fetch — the card markup below does not care where the data comes from.
 */
const posts: Post[] = [
  {
    title: 'Why we rebuilt our AI assistant around a single agent loop',
    excerpt:
      'Our first version split intent detection, planning and execution into separate stages. It was easier to reason about and consistently worse. Here is what we replaced it with, and what broke along the way.',
    category: 'Engineering',
    date: 'September 2026',
    readTime: '8 min read',
    featured: true,
  },
  {
    title: 'Subdomains per customer: what nobody tells you',
    excerpt:
      'Giving every workspace its own subdomain sounds like a afternoon of DNS work. Then you meet session cookies, OAuth callbacks and CORS. A field guide to the parts that actually bite.',
    category: 'Engineering',
    date: 'September 2026',
    readTime: '11 min read',
  },
  {
    title: 'The hidden cost of an idle job queue',
    excerpt:
      'Our background workers processed zero jobs for a day and still burned through a monthly quota. A short story about polling, defaults, and reading the bill before it reads you.',
    category: 'Engineering',
    date: 'September 2026',
    readTime: '5 min read',
  },
  {
    title: 'Status fields are a tax on your team',
    excerpt:
      'Every required field is a small toll charged to the person least able to skip it. How we think about the trade between reporting fidelity and the friction it creates.',
    category: 'Product',
    date: 'August 2026',
    readTime: '6 min read',
  },
  {
    title: 'Cycles without the ceremony',
    excerpt:
      'Sprint planning became a ritual long after it stopped being useful. What we kept, what we cut, and how automatic carry-over changed the conversation.',
    category: 'Product',
    date: 'August 2026',
    readTime: '7 min read',
  },
  {
    title: 'Designing for keyboard-first, honestly',
    excerpt:
      'Adding shortcuts is easy. Making a product genuinely navigable without a mouse means changing how you lay out every screen. Notes from doing it properly.',
    category: 'Design',
    date: 'July 2026',
    readTime: '9 min read',
  },
];

const PostMeta: React.FC<{ post: Post }> = ({ post }) => (
  <div className="flex items-center gap-3 text-xs text-gray-400">
    <span className="px-2.5 py-1 rounded-full bg-primary/10 text-primary font-bold">
      {post.category}
    </span>
    <span>{post.date}</span>
    <span className="flex items-center gap-1">
      <Clock size={11} />
      {post.readTime}
    </span>
  </div>
);

export const BlogPage: React.FC = () => {
  const [featured, ...rest] = posts;

  return (
    <MarketingLayout>
      <PageHero
        eyebrow="Blog"
        title="Notes from"
        titleAccent="building Trussen."
        subtitle="Engineering write-ups, product thinking, and the occasional post-mortem. No growth-hacking listicles."
      />

      <Section className="pb-24">
        <div className="max-w-7xl mx-auto px-4">
          {/* Featured post */}
          {featured && (
            <motion.article
              variants={fadeUp}
              className="group mb-12 p-8 sm:p-12 rounded-3xl bg-white dark:bg-card-dark border border-gray-200 dark:border-border-dark hover:border-primary/40 hover:shadow-xl transition-all cursor-pointer"
            >
              <PostMeta post={featured} />
              <h2 className="mt-5 text-2xl sm:text-4xl font-bold tracking-tight leading-tight max-w-3xl">
                {featured.title}
              </h2>
              <p className="mt-4 text-gray-500 dark:text-gray-400 leading-relaxed max-w-2xl">
                {featured.excerpt}
              </p>
              <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary group-hover:gap-3 transition-all">
                Read article
                <ArrowRight size={16} />
              </span>
            </motion.article>
          )}

          {/* Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rest.map((post, i) => (
              <motion.article
                key={post.title}
                variants={fadeUp}
                custom={i}
                className="group p-7 rounded-2xl bg-white dark:bg-card-dark border border-gray-200 dark:border-border-dark hover:border-primary/40 hover:shadow-md transition-all cursor-pointer flex flex-col"
              >
                <PostMeta post={post} />
                <h3 className="mt-4 text-lg font-bold tracking-tight leading-snug">{post.title}</h3>
                <p className="mt-3 text-sm text-gray-500 dark:text-gray-400 leading-relaxed flex-1">
                  {post.excerpt}
                </p>
                <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary group-hover:gap-3 transition-all">
                  Read article
                  <ArrowRight size={15} />
                </span>
              </motion.article>
            ))}
          </div>
        </div>
      </Section>

      <CTABanner />
    </MarketingLayout>
  );
};
