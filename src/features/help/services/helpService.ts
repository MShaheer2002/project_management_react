import type { AxiosRequestConfig } from 'axios';
import { privateApi } from '@shared/services/privateApi';
import type { ApiResponse } from '@shared/services/types';
import type { HelpArticle, HelpArticleList, HelpInsights, HelpSearchResult } from '../types';

export const helpService = {
  /** GET /help/articles: articles this member can read, grouped by category */
  list: async (): Promise<HelpArticleList> => {
    const { data } = await privateApi.get<ApiResponse<HelpArticleList>>('/help/articles');
    return data.data;
  },

  /** GET /help/search?q=: keyword and meaning search, best match first */
  search: async (q: string): Promise<HelpSearchResult[]> => {
    const { data } = await privateApi.get<ApiResponse<{ results: HelpSearchResult[] }>>('/help/search', {
      params: { q },
      skipGlobalErrorToast: true,
    } as AxiosRequestConfig & { skipGlobalErrorToast: boolean });
    return data.data.results;
  },

  /** GET /help/insights/access: whether this person is Trussen staff */
  insightsAccess: async (): Promise<boolean> => {
    const { data } = await privateApi.get<ApiResponse<{ staff: boolean }>>('/help/insights/access');
    return data.data.staff;
  },

  /** GET /help/insights?days=: staff only */
  insights: async (days: number): Promise<HelpInsights> => {
    const { data } = await privateApi.get<ApiResponse<HelpInsights>>('/help/insights', {
      params: { days },
      skipGlobalErrorToast: true,
    } as AxiosRequestConfig & { skipGlobalErrorToast: boolean });
    return data.data;
  },

  /** GET /help/articles/:id */
  get: async (id: string): Promise<HelpArticle> => {
    const { data } = await privateApi.get<ApiResponse<HelpArticle>>(`/help/articles/${encodeURIComponent(id)}`, {
      // A missing article is shown on the page itself, not as a global error toast.
      skipGlobalErrorToast: true,
    } as AxiosRequestConfig & { skipGlobalErrorToast: boolean });
    return data.data;
  },
};
