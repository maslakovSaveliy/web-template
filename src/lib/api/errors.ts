export type ApiErrorCode = 'network' | 'http' | 'parse' | 'validation';

export class ApiError extends Error {
  readonly status: number;
  readonly code: ApiErrorCode;
  readonly details: unknown;

  constructor(code: ApiErrorCode, status: number, message: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export const isApiError = (value: unknown): value is ApiError => value instanceof ApiError;
