import { parseClientEnv } from './schema';

// Each NEXT_PUBLIC_* var must be referenced literally so Next can inline it.
export const clientEnv = parseClientEnv({
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
});
