import { AuthService } from './auth-service';
import { config } from '../config/app.config';

/**
 * Uploads a file to the server.
 * @param file The file to upload.
 * @param containerName The container name where the file will be stored.
 * @param isPublic Whether the file should be publicly accessible.
 * @returns The response from the server.
 */
export const uploadFile = async (
  file: File,
  containerName: string = 'default-container',
  isPublic: boolean = false
) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('ContainerName', containerName);
  formData.append('IsPublic', isPublic.toString());

  try {
    // Use AuthService to get authentication headers
    const token = AuthService.getToken();
    const authHeaders: Record<string, string> = {};
    if (token) {
      authHeaders['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${config.apiUrl}/api/Files/upload`, {
      method: 'POST',
      headers: authHeaders,
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error during file upload:', error);
    throw error;
  }
};
