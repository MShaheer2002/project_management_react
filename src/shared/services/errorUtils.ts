import type { ApiAxiosError, ApiError } from './types';

const asApiError = (error: unknown): ApiAxiosError | undefined =>
  error as ApiAxiosError | undefined;

export const getApiErrorPayload = (error: unknown): ApiError['error'] | undefined =>
  asApiError(error)?.response?.data?.error;

export const getApiErrorCode = (error: unknown): string | undefined =>
  getApiErrorPayload(error)?.code;

export const getApiErrorMessage = (error: unknown): string | undefined =>
  getApiErrorPayload(error)?.message;

export const getApiFieldErrors = (error: unknown): Record<string, string[]> =>
  getApiErrorPayload(error)?.details ?? {};
