import type { ZodType } from 'zod';
import { clientEnv } from '@/lib/env/client';
import { ApiError } from './errors';

const NO_CONTENT = 204;

export interface ApiFetchOptions<T> {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  headers?: HeadersInit;
  schema?: ZodType<T>;
  signal?: AbortSignal;
  /** Defaults to NEXT_PUBLIC_API_URL. */
  baseUrl?: string;
  credentials?: RequestCredentials;
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

const send = async (url: string, init: RequestInit): Promise<Response> => {
  try {
    return await fetch(url, init);
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error;
    throw new ApiError('network', 0, 'Network request failed', error);
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
  const headers = new Headers(options.headers);
  headers.set('accept', 'application/json');
  if (body !== undefined) headers.set('content-type', 'application/json');

  const url = joinUrl(baseUrl ?? clientEnv.NEXT_PUBLIC_API_URL, path);
  const response = await send(url, {
    method,
    headers,
    signal,
    credentials,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (!response.ok) {
    const details = await readErrorBody(response);
    throw new ApiError('http', response.status, `Request failed: ${response.status}`, details);
  }
  if (response.status === NO_CONTENT) return undefined as T;

  let data: unknown;
  try {
    data = (await response.json()) as unknown;
  } catch (error) {
    throw new ApiError('parse', response.status, 'Response is not valid JSON', error);
  }

  if (!schema) return data as T;
  const parsed = schema.safeParse(data);
  if (!parsed.success) {
    throw new ApiError('validation', response.status, 'Response failed validation', parsed.error);
  }
  return parsed.data;
}
