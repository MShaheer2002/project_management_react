import type { AxiosError } from 'axios';

/** Standard backend success response */
export interface ApiResponse<T = unknown> {
  success: true;
  data: T;
}

/** Standard backend pagination metadata */
export interface ApiListMeta {
  total: number;
  cursor: string | null;
  hasMore: boolean;
}

/** Standard backend paginated response */
export interface ApiPaginatedResponse<T = unknown> {
  success: true;
  data: T[];
  meta: ApiListMeta;
}

/** Standard backend error response */
export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
}

/** Typed Axios error for backend responses */
export type ApiAxiosError = AxiosError<ApiError>;
