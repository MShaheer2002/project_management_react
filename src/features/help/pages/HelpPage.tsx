import React, { useDeferredValue, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, BookOpen, Loader2, Search, SearchX } from 'lucide-react';
import { useHelpArticle, useHelpArticles, useHelpInsightsAccess, useHelpSearch } from '../hooks/useHelp';
import { useDebouncedValue } from '@shared/hooks/useDebouncedValue';
import { HelpMarkdown } from '../components/HelpMarkdown';
import type { HelpArticleSummary, HelpPlan } from '../types';

const PLAN_NAMES: Record<HelpPlan, string> = { FREE: 'Free', STANDARD: 'Standard', PREMIUM: 'Premium' };
const planLabel = (plans: HelpPlan[]) => plans.map((plan) => PLAN_NAMES[plan]).join(' and ');

/** Pages with params (like /issues/:id) can't be opened directly. */
const openableRoute = (route: string | null) => (route && !route.includes(':') ? route : null);

const matches = (article: HelpArticleSummary, term: string) =>
  !term ||
  article.title.toLowerCase().includes(term) ||
  article.summary.toLowerCase().includes(term) ||
  article.keywords.some((keyword) => keyword.includes(term));

const PlanBadge: React.FC<{ article: HelpArticleSummary }> = ({ article }) =>
  article.onYourPlan ? null : (
    <span className="shrink-0 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-600 dark:text-amber-400">
      {planLabel(article.plans)}
    </span>
  );

export const HelpPage: React.FC = () => {
  const { articleId } = useParams<{ articleId?: string }>();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const term = useDeferredValue(search.trim().toLowerCase());

  // Instant title and keyword matches while typing; ranked server results
  // (keyword + meaning, with the matching section) once typing pauses.
  const debouncedSearch = useDebouncedValue(search.trim(), 300);
  const searchQuery = useHelpSearch(debouncedSearch);
  const serverResults = debouncedSearch.length >= 2 && !searchQuery.isError ? searchQuery.data : undefined;

  const listQuery = useHelpArticles();
  const isStaff = useHelpInsightsAccess().data === true;
  const articleQuery = useHelpArticle(articleId);
  const articles = useMemo(() => listQuery.data?.articles ?? [], [listQuery.data]);
  const articleIdsByTitle = useMemo(
    () => new Map(articles.map((article) => [article.title.toLowerCase(), article.id])),
    [articles],
  );
  const filtered = useMemo(() => articles.filter((article) => matches(article, term)), [articles, term]);

  const sidebar = (
    <aside className={`${articleId ? 'hidden lg:block' : 'block'} w-full shrink-0 lg:w-72`}>
      <div className="relative mb-4">
        <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search help"
          aria-label="Search help"
          className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 dark:border-border-dark dark:bg-white/5"
        />
      </div>

      {serverResults ? (
        serverResults.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-10 text-center text-sm text-gray-500">
            <SearchX size={18} className="text-gray-400" />
            No articles match "{debouncedSearch}".
          </div>
        ) : (
          <ul className="space-y-1" aria-label="Search results">
            {serverResults.map((result) => (
              <li key={result.id}>
                <Link
                  to={`/help/${result.id}`}
                  className={`block rounded-md px-2 py-2 transition-colors ${
                    result.id === articleId ? 'bg-primary/10' : 'hover:bg-gray-100 dark:hover:bg-white/5'
                  }`}
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-medium text-gray-800 dark:text-gray-100">{result.title}</span>
                    <PlanBadge article={result} />
                  </span>
                  {result.section && <span className="block text-[11px] font-medium text-primary">{result.section}</span>}
                  <span className="mt-0.5 line-clamp-2 block text-xs text-gray-500">{result.snippet}</span>
                </Link>
              </li>
            ))}
          </ul>
        )
      ) : listQuery.isLoading ? (
        <div className="flex justify-center py-10"><Loader2 size={18} className="animate-spin text-gray-400" /></div>
      ) : listQuery.isError ? (
        <div className="rounded-lg border border-dashed border-gray-200 p-4 text-center text-sm text-gray-500 dark:border-border-dark">
          Help could not be loaded.{' '}
          <button type="button" onClick={() => listQuery.refetch()} className="font-medium text-primary hover:underline">Try again</button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-10 text-center text-sm text-gray-500">
          <SearchX size={18} className="text-gray-400" />
          No articles match "{search.trim()}".
        </div>
      ) : (
        <nav className="space-y-5" aria-label="Help articles">
          {(listQuery.data?.categories ?? []).map((category) => {
            const inCategory = filtered.filter((article) => article.category === category);
            if (inCategory.length === 0) return null;
            return (
              <div key={category}>
                <p className="mb-1.5 px-2 text-[11px] font-bold uppercase tracking-wider text-gray-400">{category}</p>
                <ul className="space-y-0.5">
                  {inCategory.map((article) => (
                    <li key={article.id}>
                      <Link
                        to={`/help/${article.id}`}
                        className={`flex items-center justify-between gap-2 rounded-md px-2 py-1.5 text-sm transition-colors ${
                          article.id === articleId
                            ? 'bg-primary/10 font-medium text-primary'
                            : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5'
                        }`}
                      >
                        <span className="truncate">{article.title}</span>
                        <PlanBadge article={article} />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </nav>
      )}
    </aside>
  );

  const renderArticle = () => {
    if (articleQuery.isLoading) {
      return <div className="flex justify-center py-16"><Loader2 size={20} className="animate-spin text-gray-400" /></div>;
    }
    if (articleQuery.isError || !articleQuery.data) {
      return (
        <div className="py-16 text-center text-sm text-gray-500">
          This article isn't available.{' '}
          <Link to="/help" className="font-medium text-primary hover:underline">See all help</Link>
        </div>
      );
    }

    const article = articleQuery.data;
    const route = openableRoute(article.route);
    return (
      <article>
        <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">{article.category}</p>
        <div className="mt-1 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">{article.title}</h1>
          <PlanBadge article={article} />
        </div>
        {!article.onYourPlan && (
          <p className="mt-2 text-sm text-amber-600 dark:text-amber-400">
            Available on {planLabel(article.plans)}. Your workspace's plan doesn't include it.
          </p>
        )}
        <HelpMarkdown body={article.body} articleIdsByTitle={articleIdsByTitle} />
        {route && (
          <button
            type="button"
            onClick={() => navigate(route)}
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90"
          >
            Open this page <ArrowRight size={14} />
          </button>
        )}
      </article>
    );
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-8">
        <header className="mb-8 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><BookOpen size={18} /></div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">Help</h1>
            <p className="text-sm text-gray-500">How to use Trussen, for your role and plan.</p>
          </div>
          {isStaff && (
            <Link to="/help/insights" className="ml-auto text-sm font-medium text-primary hover:underline">AI Assistance insights</Link>
          )}
        </header>

        <div className="flex flex-col gap-8 lg:flex-row">
          {sidebar}
          <main className="min-w-0 flex-1">
            {articleId ? (
              <>
                <Link to="/help" className="mb-4 inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 lg:hidden">
                  <ArrowLeft size={14} /> All help
                </Link>
                {renderArticle()}
              </>
            ) : (
              <div className="hidden rounded-xl border border-dashed border-gray-200 p-10 text-center text-sm text-gray-500 lg:block dark:border-border-dark">
                Pick an article, or ask AI Assistance with the Help button.
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};
