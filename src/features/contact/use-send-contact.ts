import { type UseMutationResult, useMutation } from '@tanstack/react-query';
import type { ApiError } from '@/lib/api';
import { sendContact } from './api';
import type { ContactInput } from './schema';

export const useSendContact = (): UseMutationResult<{ ok: true }, ApiError, ContactInput> =>
  useMutation({ mutationFn: sendContact });
