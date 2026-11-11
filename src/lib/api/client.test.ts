import { afterEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { apiFetch } from './client';
import { ApiError } from './errors';

const mockFetch = (response: Response | Error): ReturnType<typeof vi.fn> => {
  const fn = vi.fn(async () => {
    if (response instanceof Error) throw response;
    return response;
  });
  vi.stubGlobal('fetch', fn);
  return fn;
};

// Never resolves on its own; rejects only when the request signal aborts, like a stalled server.
const hangingFetch = (): ReturnType<typeof vi.fn> =>
  vi.fn(
    (_url: string, init: RequestInit) =>
      new Promise<Response>((_resolve, reject) => {
        init.signal?.addEventListener('abort', () => reject(init.signal?.reason));
      }),
  );

afterEach(() => {
  vi.unstubAllGlobals();
});

const jsonResponse = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

describe('apiFetch', () => {
  it('returns parsed JSON on 200', async () => {
    mockFetch(jsonResponse({ id: 1 }));
    await expect(apiFetch('/items/1', { baseUrl: 'https://api.test' })).resolves.toEqual({ id: 1 });
  });

  it('returns undefined on 204', async () => {
    mockFetch(new Response(null, { status: 204 }));
    await expect(apiFetch('/items/1', { baseUrl: 'https://api.test' })).resolves.toBeUndefined();
  });

  it('throws http ApiError with text details on non-JSON error body', async () => {
    mockFetch(new Response('boom', { status: 500 }));
    const error = await apiFetch('/x', { baseUrl: 'https://api.test' }).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 500, code: 'http', details: 'boom' });
  });

  it('throws http ApiError with JSON details on JSON error body', async () => {
    mockFetch(jsonResponse({ error: 'nope' }, 404));
    const error = await apiFetch('/x', { baseUrl: 'https://api.test' }).catch((e: unknown) => e);
    expect(error).toMatchObject({ status: 404, code: 'http', details: { error: 'nope' } });
  });

  it('throws network ApiError when fetch rejects', async () => {
    mockFetch(new TypeError('Failed to fetch'));
    const error = await apiFetch('/x', { baseUrl: 'https://api.test' }).catch((e: unknown) => e);
    expect(error).toMatchObject({ status: 0, code: 'network' });
  });

  it('throws parse ApiError on invalid JSON with 200', async () => {
    mockFetch(
      new Response('{not json', { status: 200, headers: { 'content-type': 'application/json' } }),
    );
    const error = await apiFetch('/x', { baseUrl: 'https://api.test' }).catch((e: unknown) => e);
    expect(error).toMatchObject({ status: 200, code: 'parse' });
  });

  it('throws validation ApiError on schema mismatch', async () => {
    mockFetch(jsonResponse({ id: 'one' }));
    const schema = z.object({ id: z.number() });
    const error = await apiFetch('/x', { baseUrl: 'https://api.test', schema }).catch(
      (e: unknown) => e,
    );
    expect(error).toMatchObject({ code: 'validation' });
  });

  it('throws timeout ApiError when the server does not answer within timeoutMs', async () => {
    vi.stubGlobal('fetch', hangingFetch());
    const error = await apiFetch('/x', { baseUrl: 'https://api.test', timeoutMs: 10 }).catch(
      (e: unknown) => e,
    );
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 0, code: 'timeout' });
  });

  it('passes an abort signal to fetch by default so every call has a deadline', async () => {
    const fn = mockFetch(jsonResponse({ ok: true }));
    await apiFetch('/x', { baseUrl: 'https://api.test' });
    const [, init] = fn.mock.calls[0] as [string, RequestInit];
    expect(init.signal).toBeInstanceOf(AbortSignal);
  });

  it('rethrows the caller abort unchanged so query cancellation is not an error', async () => {
    vi.stubGlobal('fetch', hangingFetch());
    const controller = new AbortController();
    const pending = apiFetch('/x', { baseUrl: 'https://api.test', signal: controller.signal });
    controller.abort();
    const error = await pending.catch((e: unknown) => e);
    expect(error).not.toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ name: 'AbortError' });
  });

  it('sends object bodies as JSON', async () => {
    const fn = mockFetch(jsonResponse({ ok: true }));
    await apiFetch('/x', { baseUrl: 'https://api.test', method: 'POST', body: { a: 1 } });
    const [url, init] = fn.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://api.test/x');
    expect(init.body).toBe('{"a":1}');
    expect(new Headers(init.headers).get('content-type')).toBe('application/json');
  });
});
