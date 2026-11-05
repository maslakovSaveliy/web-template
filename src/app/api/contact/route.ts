import { NextResponse } from 'next/server';
import { z } from 'zod';
import { contactSchema } from '@/features/contact';

/**
 * Example route handler. Validates with the same schema as the form.
 * Persist or forward the message here (see docs/recipes/postgres-drizzle.md).
 */
export async function POST(request: Request): Promise<NextResponse> {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const result = contactSchema.safeParse(payload);
  if (!result.success) {
    return NextResponse.json(
      { error: 'validation', issues: z.flattenError(result.error).fieldErrors },
      { status: 400 },
    );
  }

  return NextResponse.json({ ok: true });
}
