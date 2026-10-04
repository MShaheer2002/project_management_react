export type HelpPlan = 'FREE' | 'STANDARD' | 'PREMIUM';

export interface HelpArticleSummary {
  id: string;
  title: string;
  category: string;
  /** App page this article is about, e.g. `/billing` or `/issues/:id`. */
  route: string | null;
  plans: HelpPlan[];
  /** False when the workspace's plan doesn't include this feature. */
  onYourPlan: boolean;
  keywords: string[];
  summary: string;
}

export interface HelpArticle extends HelpArticleSummary {
  /** Markdown. */
  body: string;
}

export interface HelpArticleList {
  categories: string[];
  articles: HelpArticleSummary[];
}

export interface HelpSearchResult extends HelpArticleSummary {
  /** The matching section, or null when the article's introduction matched. */
  section: string | null;
  snippet: string;
}

type ArticleRef = { id: string; title: string };

/** Staff-only AI Assistance insights. Anonymized: no names, no workspaces. */
export interface HelpInsights {
  period: { days: number; since: string };
  totals: {
    answers: number;
    instant: number;
    grounded: number;
    notSure: number;
    unavailable: number;
    up: number;
    down: number;
    notSureRate: number;
    helpfulRate: number | null;
  };
  topQuestions: Array<{ question: string; count: number; notSure: number }>;
  unanswered: Array<{ question: string; kind: string; route: string | null; createdAt: string; articles: ArticleRef[] }>;
  disliked: Array<{ question: string; kind: string; ratingReason: string | null; ratingComment: string | null; createdAt: string; articles: ArticleRef[] }>;
  articles: { used: Array<ArticleRef & { count: number }>; neverUsed: ArticleRef[] };
}
