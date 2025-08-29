import { AuthService } from './auth-service';
import type { components } from './schema';

// Generated types
export type EmailMessageDto = components['schemas']['ShipMvp.EmailMessages.Application.EmailMessageDto'];
export type CreateEmailMessageDto = components['schemas']['ShipMvp.EmailMessages.Application.CreateEmailMessageDto'];

export const emailMessageApi = {
  /**
   * Get all email messages. Optional query params can be provided (e.g., userId).
   */
  async getAll(params?: { userId?: string }): Promise<EmailMessageDto[]> {
    const search = new URLSearchParams();
    if (params?.userId) search.append('userId', params.userId);
    const url = search.toString() ? `/api/EmailMessages?${search.toString()}` : '/api/EmailMessages';
    return await AuthService.authenticatedFetch<EmailMessageDto[]>(url, { method: 'GET' });
  },

  /**
   * Get a single email message by id
   */
  async getById(id: string): Promise<EmailMessageDto> {
    return await AuthService.authenticatedFetch<EmailMessageDto>(`/api/EmailMessages/${id}`, { method: 'GET' });
  },

  /**
   * Create a new email message (server-side storage)
   */
  async create(payload: CreateEmailMessageDto): Promise<EmailMessageDto> {
    return await AuthService.authenticatedFetch<EmailMessageDto>('/api/EmailMessages', {
      method: 'POST',
      data: payload,
    });
  }
};
