import { describe, expect, it } from 'vitest';
import { EnvValidationError, parseClientEnv, parseServerEnv } from './schema';

describe('parseClientEnv', () => {
  it('parses a valid source and applies defaults', () => {
    const env = parseClientEnv({ NEXT_PUBLIC_SITE_URL: 'https://example.com' });
    expect(env.NEXT_PUBLIC_SITE_URL).toBe('https://example.com');
    expect(env.NEXT_PUBLIC_API_URL).toBe('/');
  });

  it('names the missing variable', () => {
    expect(() => parseClientEnv({})).toThrow(EnvValidationError);
    expect(() => parseClientEnv({})).toThrow(/NEXT_PUBLIC_SITE_URL/);
  });

  it('names every invalid variable at once', () => {
    try {
      parseClientEnv({ NEXT_PUBLIC_SITE_URL: 'not-a-url', NEXT_PUBLIC_API_URL: 'nope' });
      expect.unreachable();
    } catch (error) {
      expect(error).toBeInstanceOf(EnvValidationError);
      const { message } = error as EnvValidationError;
      expect(message).toMatch(/NEXT_PUBLIC_SITE_URL/);
      expect(message).toMatch(/NEXT_PUBLIC_API_URL/);
    }
  });
});

describe('parseServerEnv', () => {
  it('applies defaults', () => {
    const env = parseServerEnv({});
    expect(env.NODE_ENV).toBe('development');
    expect(env.APP_PORT).toBe(3000);
  });

  it('rejects a non-numeric port', () => {
    expect(() => parseServerEnv({ APP_PORT: 'abc' })).toThrow(/APP_PORT/);
  });
});
