import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useHelpInsights, useHelpInsightsAccess } from '../hooks/useHelp';

const PERIODS = [7, 30, 90] as const;
const REASON_LABELS: Record<string, string> = { wrong: 'Wrong', unclear: 'Unclear', not_helpful: "Didn't help", other: 'Other' };
const percent = (value: number | null) => (value === null ? '–' : `${Math.round(value * 100)}%`);
const day = (iso: string) => new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

const Card: React.FC<{ label: string; value: string | number; hint?: string }> = ({ label, value, hint }) => (
  <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-border-dark dark:bg-white/[0.02]">
    <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">{label}</p>
    <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
    {hint && <p className="mt-0.5 text-xs text-gray-500">{hint}</p>}
  </div>
);

const Section: React.FC<{ title: string; hint?: string; children: React.ReactNode }> = ({ title, hint, children }) => (
  <section className="space-y-3">
    <div>
      <h2 className="text-base font-bold text-gray-900 dark:text-white">{title}</h2>
      {hint && <p className="text-sm text-gray-500">{hint}</p>}
    </div>
    {children}
  </section>
);

const Empty: React.FC<{ text: string }> = ({ text }) => (
  <p className="rounded-lg border border-dashed border-gray-200 p-4 text-center text-sm text-gray-500 dark:border-border-dark">{text}</p>
);

const ArticleLinks: React.FC<{ articles: Array<{ id: string; title: string }> }> = ({ articles }) =>
  articles.length ? (
    <span className="flex flex-wrap gap-1">
      {articles.map((article) => (
        <Link key={article.id} to={`/help/${article.id}`} className="rounded bg-primary/[0.06] px-1.5 py-0.5 text-[11px] text-primary hover:underline">
          {article.title}
        </Link>
      ))}
    </span>
  ) : (
    <span className="text-xs text-gray-400">none</span>
  );

/**
 * Trussen staff only: what people ask AI Assistance, what it couldn't answer,
 * and what was rated down, across all workspaces with no names or workspaces.
 * The to-do list for content/help.
 */
export const HelpInsightsPage: React.FC = () => {
  const [days, setDays] = useState<(typeof PERIODS)[number]>(30);
  const access = useHelpInsightsAccess();
  const isStaff = access.data === true;
  const insights = useHelpInsights(days, isStaff);

  if (access.isLoading) {
    return <div className="flex h-full items-center justify-center"><Loader2 size={20} className="animate-spin text-gray-400" /></div>;
  }
  if (!isStaff) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 text-sm text-gray-500">
        This page isn't available.
        <Link to="/help" className="font-medium text-primary hover:underline">Back to help</Link>
      </div>
    );
  }

  const data = insights.data;
  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-8">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <Link to="/help" className="mb-2 inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
              <ArrowLeft size={14} /> Help
            </Link>
            <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">AI Assistance insights</h1>
            <p className="text-sm text-gray-500">Trussen team only. All workspaces, no names or workspaces. Questions are masked and kept 90 days.</p>
          </div>
          <div className="flex rounded-lg bg-gray-100 p-0.5 dark:bg-white/5" role="group" aria-label="Period">
            {PERIODS.map((period) => (
              <button
                key={period}
                type="button"
                onClick={() => setDays(period)}
                aria-pressed={days === period}
                className={`rounded-md px-3 py-1 text-xs font-medium ${days === period ? 'bg-white text-primary shadow-sm dark:bg-gray-800' : 'text-gray-500'}`}
              >
                {period} days
              </button>
            ))}
          </div>
        </header>

        {insights.isLoading ? (
          <div className="flex justify-center py-16"><Loader2 size={20} className="animate-spin text-gray-400" /></div>
        ) : insights.isError || !data ? (
          <Empty text="Insights could not be loaded." />
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <Card label="Answers" value={data.totals.answers} hint={`${data.totals.instant} instant, ${data.totals.grounded} from articles`} />
              <Card label="Not sure" value={percent(data.totals.notSureRate)} hint={`${data.totals.notSure + data.totals.unavailable} questions`} />
              <Card label="Helpful" value={percent(data.totals.helpfulRate)} hint={`${data.totals.up} up, ${data.totals.down} down`} />
              <Card label="Articles never used" value={data.articles.neverUsed.length} hint={`of ${data.articles.neverUsed.length + data.articles.used.length}`} />
            </div>

            <Section title="Unanswered questions" hint="Each one is a missing or unclear article.">
              {data.unanswered.length === 0 ? <Empty text="None in this period." /> : (
                <ul className="divide-y divide-gray-100 rounded-xl border border-gray-200 dark:divide-border-dark dark:border-border-dark">
                  {data.unanswered.map((item, index) => (
                    <li key={index} className="space-y-1 p-3">
                      <p className="text-sm text-gray-800 dark:text-gray-100">{item.question}</p>
                      <p className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                        {day(item.createdAt)} · {item.kind === 'unavailable' ? 'AI unavailable' : 'Not sure'}{item.route ? ` · on ${item.route}` : ''} · closest: <ArticleLinks articles={item.articles} />
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </Section>

            <Section title="Rated down" hint="Answers people said were wrong, unclear or unhelpful.">
              {data.disliked.length === 0 ? <Empty text="None in this period." /> : (
                <ul className="divide-y divide-gray-100 rounded-xl border border-gray-200 dark:divide-border-dark dark:border-border-dark">
                  {data.disliked.map((item, index) => (
                    <li key={index} className="space-y-1 p-3">
                      <p className="text-sm text-gray-800 dark:text-gray-100">{item.question}</p>
                      {item.ratingComment && <p className="text-sm italic text-gray-600 dark:text-gray-300">"{item.ratingComment}"</p>}
                      <p className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                        {day(item.createdAt)} · {REASON_LABELS[item.ratingReason ?? ''] ?? 'No reason'} · used: <ArticleLinks articles={item.articles} />
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </Section>

            <div className="grid gap-8 lg:grid-cols-2">
              <Section title="Top questions">
                {data.topQuestions.length === 0 ? <Empty text="No questions yet." /> : (
                  <ol className="space-y-1.5">
                    {data.topQuestions.map((item, index) => (
                      <li key={index} className="flex items-baseline justify-between gap-3 text-sm">
                        <span className="text-gray-700 dark:text-gray-200">{item.question}</span>
                        <span className="shrink-0 text-xs text-gray-500">
                          {item.count}×{item.notSure > 0 ? <span className="text-amber-600"> ({item.notSure} not sure)</span> : null}
                        </span>
                      </li>
                    ))}
                  </ol>
                )}
              </Section>

              <Section title="Articles" hint="How often answers used each article.">
                <ol className="space-y-1.5">
                  {data.articles.used.map((article) => (
                    <li key={article.id} className="flex justify-between gap-3 text-sm">
                      <Link to={`/help/${article.id}`} className="text-primary hover:underline">{article.title}</Link>
                      <span className="text-xs text-gray-500">{article.count}</span>
                    </li>
                  ))}
                </ol>
                {data.articles.neverUsed.length > 0 && (
                  <div className="pt-2">
                    <p className="mb-1 text-xs font-semibold text-gray-500">Never used in this period</p>
                    <ArticleLinks articles={data.articles.neverUsed} />
                  </div>
                )}
              </Section>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
