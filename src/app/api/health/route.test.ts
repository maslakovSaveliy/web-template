import { describe, expect, it } from 'vitest';
import { GET } from './route';

describe('GET /api/health', () => {
  it('returns ok and is never cached', async () => {
    const response = GET();
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    const json = (await response.json()) as { status: string; uptime: number };
    expect(json.status).toBe('ok');
    expect(json.uptime).toEqual(expect.any(Number));
  });
});
