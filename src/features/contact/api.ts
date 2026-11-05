import { apiFetch } from '@/lib/api';
import type { ContactInput } from './schema';

const CONTACT_ENDPOINT = '/api/contact';

export const sendContact = (input: ContactInput): Promise<{ ok: true }> =>
  apiFetch<{ ok: true }>(CONTACT_ENDPOINT, { method: 'POST', body: input, baseUrl: '/' });
