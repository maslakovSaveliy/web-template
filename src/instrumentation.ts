/**
 * Runs once when the Next server starts. Validates server-only env here instead of
 * at build time, so CI never needs production secrets and a misconfigured container
 * fails fast with a message naming the bad variable.
 */
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;
  const { getServerEnv } = await import('@/lib/env/server');
  getServerEnv();
}
