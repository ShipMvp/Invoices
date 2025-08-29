import { AuthService } from "./auth-service";
import { config } from "../config/app.config";
import type { paths, components } from './schema';

// Use the proper types from the generated schema
export type DraftEmailDto = components['schemas']['ShipMvp.Application.Email.DraftEmailDto'];
export type SaveDraftEmailDto = components['schemas']['ShipMvp.Application.Email.SaveDraftEmailDto'];
export type SendEmailDto = components['schemas']['ShipMvp.Application.Email.SendEmailDto'];

// Custom type for generate email input to include File object
export interface GenerateEmailInput {
  file?: File;
  customPrompt?: string;
  website?: string;
}

/**
 * Generates an email draft using AI/prompts
 * @param input Email generation parameters
 * @returns Generated draft email
 */
export const generateEmail = async (
  input: GenerateEmailInput
): Promise<DraftEmailDto> => {
  try {
    // The API expects multipart/form-data, so we need to use FormData
    const formData = new FormData();
    
    if (input.file) {
      formData.append('file', input.file);
      console.log('Added file to FormData:', input.file.name, input.file.type);
    }
    if (input.customPrompt) {
      formData.append('CustomPrompt', input.customPrompt);
      console.log('Added CustomPrompt to FormData:', input.customPrompt);
    }
    if (input.website) {
      formData.append('Website', input.website);
      console.log('Added Website to FormData:', input.website);
    }

    // Use AuthService to get authentication headers
    const token = AuthService.getToken();
    const authHeaders: Record<string, string> = {};
    if (token) {
      authHeaders['Authorization'] = `Bearer ${token}`;
    }
    
    console.log('Sending request to:', `${config.apiUrl}/api/EmailComposer/generate`);
    console.log('Headers:', authHeaders);
    
    const response = await fetch(`${config.apiUrl}/api/EmailComposer/generate`, {
      method: 'POST',
      headers: authHeaders,
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data as DraftEmailDto;
  } catch (error) {
    console.error('Error generating email:', error);
    throw error;
  }
};

export const saveDraft = async (saveData: SaveDraftEmailDto): Promise<string> => {
  try {
    const response = await AuthService.authenticatedFetch<string>('/api/EmailComposer/save-draft', {
      method: 'POST',
      data: saveData
    });

    return response;
  } catch (error) {
    console.error('Error saving email draft:', error);
    throw error;
  }
};

/**
 * Sends an email using the EmailComposer API.
 * Uses the generated SendEmailDto type for strong typing.
 * @param sendData Payload describing the email to send (projectId + draft)
 */
export const sendEmail = async (
  sendData: SendEmailDto
): Promise<void | { message?: string } | null> => {
  try {
    const response = await AuthService.authenticatedFetch<{ message?: string } | null>('/api/EmailComposer/send', {
      method: 'POST',
      data: sendData,
    });

    return response;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};
