import React from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { MarketingLayout, PageHero, Section, fadeUp } from './shared';
import { legalDocs, type LegalDoc } from './legalContent';

/**
 * Jumping to a section deliberately does NOT go through the browser's
 * default anchor behaviour:
 *
 *   - `href="#section-6"` pushes a history entry per click, so after
 *     skimming five headings the Back button walks you back through all
 *     five instead of leaving the page. replaceState keeps the URL
 *     shareable without touching the history stack.
 *   - the default jump is instant; scrollIntoView can animate, and honours
 *     the reader's reduced-motion preference.
 */
const scrollToSection = (id: string) => {
  const el = document.getElementById(id);
  if (!el) return;

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
  window.history.replaceState(null, '', `#${id}`);
};

/**
 * One template for all four legal pages — they differ only in content, so
 * they share a component and a table of contents rather than being four
 * near-identical files that drift apart.
 */
const LegalPage: React.FC<{ doc: LegalDoc }> = ({ doc }) => {
  const otherDocs = Object.values(legalDocs).filter((d) => d.slug !== doc.slug);

  // Someone arriving on a shared /terms#section-6 link should land on that
  // section. The sections are not in the DOM on the first paint, so this
  // waits a frame rather than firing into an empty document. Instant, not
  // smooth — animating a scroll the moment a page opens just looks broken.
  React.useEffect(() => {
    const id = window.location.hash.slice(1);
    if (!id) return;
    requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView({ block: 'start' });
    });
  }, []);

  return (
    <MarketingLayout>
      <PageHero
        eyebrow={doc.eyebrow}
        title={doc.title}
        titleAccent={doc.titleAccent}
        subtitle={doc.subtitle}
      />

      <Section className="pb-24">
        <div className="max-w-5xl mx-auto px-4">
          <motion.p variants={fadeUp} className="text-center text-xs text-gray-400 mb-12">
            Last updated {doc.lastUpdated}
          </motion.p>

          <div className="flex flex-col lg:flex-row gap-12">
            {/* ─── Table of contents ─── */}
            <motion.aside variants={fadeUp} className="lg:w-56 shrink-0">
              <div className="lg:sticky lg:top-24">
                <h2 className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-4">
                  On this page
                </h2>
                <ul className="space-y-2.5 border-l border-gray-200 dark:border-border-dark">
                  {doc.sections.map((s, i) => (
                    <li key={i}>
                      <a
                        href={`#section-${i}`}
                        onClick={(e) => {
                          e.preventDefault();
                          scrollToSection(`section-${i}`);
                        }}
                        className="block -ml-px border-l border-transparent hover:border-primary pl-4 text-sm text-gray-500 dark:text-gray-400 hover:text-primary transition-colors"
                      >
                        {s.heading}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.aside>

            {/* ─── Body ─── */}
            <motion.div variants={fadeUp} custom={1} className="flex-1 min-w-0">
              <div className="space-y-12">
                {doc.sections.map((section, i) => (
                  <section key={i} id={`section-${i}`} className="scroll-mt-24">
                    <h2 className="text-xl sm:text-2xl font-bold tracking-tight mb-4">
                      {section.heading}
                    </h2>
                    <div className="space-y-4">
                      {section.body.map((block, j) =>
                        Array.isArray(block) ? (
                          <ul key={j} className="space-y-2.5 pl-1">
                            {block.map((item, k) => (
                              <li key={k} className="flex gap-3">
                                <span className="mt-2 w-1.5 h-1.5 rounded-full bg-primary/50 shrink-0" />
                                <span className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                                  {item}
                                </span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p
                            key={j}
                            className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed"
                          >
                            {block}
                          </p>
                        ),
                      )}
                    </div>
                  </section>
                ))}
              </div>

              {/* ─── Cross-links ─── */}
              <div className="mt-16 pt-8 border-t border-gray-200 dark:border-border-dark">
                <h2 className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-4">
                  Related
                </h2>
                <div className="flex flex-wrap gap-3">
                  {otherDocs.map((d) => (
                    <Link
                      key={d.slug}
                      to={`/${d.slug}`}
                      className="px-4 py-2 text-sm font-medium rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-border-dark hover:border-primary/40 hover:text-primary transition-all"
                    >
                      {d.title.replace(/\.$/, '')} {d.titleAccent.replace(/\.$/, '')}
                    </Link>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </Section>
    </MarketingLayout>
  );
};

export const PrivacyPage: React.FC = () => <LegalPage doc={legalDocs.privacy!} />;
export const TermsPage: React.FC = () => <LegalPage doc={legalDocs.terms!} />;
export const CookiePolicyPage: React.FC = () => <LegalPage doc={legalDocs.cookies!} />;
export const SecurityPage: React.FC = () => <LegalPage doc={legalDocs.security!} />;
