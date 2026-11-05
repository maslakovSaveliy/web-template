import { describe, expect, it } from 'vitest';
import { POST } from './route';

const post = (body: string): Request =>
  new Request('http://localhost/api/contact', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body,
  });

describe('POST /api/contact', () => {
  it('rejects an invalid payload with 400 and field issues', async () => {
    const response = await POST(post(JSON.stringify({ email: 'x' })));
    expect(response.status).toBe(400);
    const json = (await response.json()) as { error: string; issues: Record<string, unknown> };
    expect(json.error).toBe('validation');
    expect(json.issues).toHaveProperty('email');
  });

  it('rejects malformed JSON with 400', async () => {
    const response = await POST(post('{oops'));
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: 'invalid_json' });
  });

  it('accepts a valid payload', async () => {
    const response = await POST(
      post(JSON.stringify({ name: 'Ada', email: 'ada@example.com', message: 'Long enough text' })),
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
  });
});
