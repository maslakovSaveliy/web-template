import type { ZodType } from 'zod';
import { clientEnv } from '@/lib/env/client';
import { ApiError } from './errors';

const NO_CONTENT = 204;
/** Every request gets a deadline: a stalled upstream must not hold a render or a spinner forever. */
const DEFAULT_TIMEOUT_MS = 10_000;

export interface ApiFetchOptions<T> {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  headers?: HeadersInit;
  schema?: ZodType<T>;
  signal?: AbortSignal;
  /** Defaults to NEXT_PUBLIC_API_URL. */
  baseUrl?: string;
  credentials?: RequestCredentials;
  /** Deadline for the whole request, body included. Defaults to `DEFAULT_TIMEOUT_MS`. */
  timeoutMs?: number;
}

const joinUrl = (baseUrl: string, path: string): string => {
  if (/^https?:\/\//.test(path)) return path;
  return `${baseUrl.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`;
};

const isJson = (response: Response): boolean =>
  response.headers.get('content-type')?.includes('application/json') ?? false;

const readErrorBody = async (response: Response): Promise<unknown> => {
  const text = await response.text().catch(() => '');
  if (!isJson(response)) return text;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
};

// Checked by name, not `instanceof DOMException`: test DOMs and runtimes ship different classes.
const isAbortError = (error: unknown): boolean =>
  typeof error === 'object' && error !== null && 'name' in error && error.name === 'AbortError';

const toTransportError = (error: unknown, deadline: AbortSignal): unknown => {
  if (deadline.aborted) return new ApiError('timeout', 0, 'Request timed out', error);
  // Caller cancellation (e.g. TanStack Query) is not a failure: rethrow it unchanged.
  if (isAbortError(error)) return error;
  return new ApiError('network', 0, 'Network request failed', error);
};

const send = async (url: string, init: RequestInit, deadline: AbortSignal): Promise<Response> => {
  try {
    return await fetch(url, init);
  } catch (error) {
    throw toTransportError(error, deadline);
  }
};

/**
 * Typed JSON fetch. Every failure becomes an `ApiError` with a stable `code`,
 * so callers (and TanStack Query) never see raw TypeErrors or JSON parse errors.
 */
export async function apiFetch<T = unknown>(
  path: string,
  options: ApiFetchOptions<T> = {},
): Promise<T> {
  const { method = 'GET', body, schema, signal, credentials, baseUrl } = options;
  const deadline = AbortSignal.timeout(options.timeoutMs ?? DEFAULT_TIMEOUT_MS);
  const headers = new Headers(options.headers);
  headers.set('accept', 'application/json');
  if (body !== undefined) headers.set('content-type', 'application/json');

  const url = joinUrl(baseUrl ?? clientEnv.NEXT_PUBLIC_API_URL, path);
  const response = await send(
    url,
    {
      method,
      headers,
      signal: signal ? AbortSignal.any([signal, deadline]) : deadline,
      credentials,
      body: body === undefined ? undefined : JSON.stringify(body),
    },
    deadline,
  );

  if (!response.ok) {
    const details = await readErrorBody(response);
    throw new ApiError('http', response.status, `Request failed: ${response.status}`, details);
  }
  if (response.status === NO_CONTENT) return undefined as T;

  let data: unknown;
  try {
    data = (await response.json()) as unknown;
  } catch (error) {
    if (deadline.aborted || isAbortError(error)) throw toTransportError(error, deadline);
    throw new ApiError('parse', response.status, 'Response is not valid JSON', error);
  }

  if (!schema) return data as T;
  const parsed = schema.safeParse(data);
  if (!parsed.success) {
    throw new ApiError('validation', response.status, 'Response failed validation', parsed.error);
  }
  return parsed.data;
}
