import { z } from 'zod';

type EnvSource = Record<string, string | undefined>;

export class EnvValidationError extends Error {
  readonly issues: readonly string[];

  constructor(scope: 'client' | 'server', issues: readonly string[]) {
    super(`Invalid ${scope} environment variables:\n${issues.map((i) => `  - ${i}`).join('\n')}`);
    this.name = 'EnvValidationError';
    this.issues = issues;
  }
}

const relativeOrAbsoluteUrl = z.union([z.url(), z.string().startsWith('/')]);

/** Public values only: everything here is inlined into the browser bundle. */
const clientEnvSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z.url(),
  NEXT_PUBLIC_API_URL: relativeOrAbsoluteUrl.default('/'),
});

/** Server-only values. Validated at server start (src/instrumentation.ts), not at build. */
const serverEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  APP_PORT: z.coerce.number().int().positive().default(3000),
});

export type ClientEnv = z.infer<typeof clientEnvSchema>;
export type ServerEnv = z.infer<typeof serverEnvSchema>;

const toIssues = (error: z.ZodError): string[] =>
  error.issues.map((issue) => `${issue.path.join('.') || '(root)'}: ${issue.message}`);

const emptyToUndefined = (source: EnvSource): EnvSource =>
  Object.fromEntries(Object.entries(source).map(([k, v]) => [k, v === '' ? undefined : v]));

export const parseClientEnv = (source: EnvSource): ClientEnv => {
  const result = clientEnvSchema.safeParse(emptyToUndefined(source));
  if (!result.success) throw new EnvValidationError('client', toIssues(result.error));
  return result.data;
};

export const parseServerEnv = (source: EnvSource): ServerEnv => {
  const result = serverEnvSchema.safeParse(emptyToUndefined(source));
  if (!result.success) throw new EnvValidationError('server', toIssues(result.error));
  return result.data;
};
