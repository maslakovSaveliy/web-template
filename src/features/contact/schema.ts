import { z } from 'zod';

export const CONTACT_LIMITS = {
  nameMax: 100,
  messageMin: 10,
  messageMax: 2000,
} as const;

/**
 * Shared by the form (client) and the route handler (server).
 * Error messages are i18n keys under `contact.errors`, translated in the UI.
 */
export const contactSchema = z.object({
  name: z.string().trim().min(1, 'nameRequired').max(CONTACT_LIMITS.nameMax),
  email: z.email('emailInvalid'),
  message: z
    .string()
    .trim()
    .min(CONTACT_LIMITS.messageMin, 'messageTooShort')
    .max(CONTACT_LIMITS.messageMax),
});

export type ContactInput = z.infer<typeof contactSchema>;

export type ContactErrorKey = 'nameRequired' | 'emailInvalid' | 'messageTooShort';
