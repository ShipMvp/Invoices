import axios from 'axios';
import { config, oauthConfig } from '../config/app.config';
import type { LoginDto, UserDto, AuthResultDto } from '../../types/auth';

// OpenIddict token response
interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope?: string;
  id_token?: string;
}

// Auth Service
export class AuthService {
  private static get tokenKey() {
    return oauthConfig.storageKeys.accessToken;
  }
  private static get refreshTokenKey() {
    return oauthConfig.storageKeys.refreshToken;
  }
  private static get userKey() {
    return oauthConfig.storageKeys.user;
  }
  private static get idTokenKey() {
    return oauthConfig.storageKeys.idToken;
  }
  private static get expiresKey() {
    return oauthConfig.storageKeys.expiresAt;
  }

  static async login(credentials: LoginDto): Promise<AuthResultDto> {
    try {
      // Use OpenIddict token endpoint with password grant
      const formData = new URLSearchParams();
      formData.append('grant_type', oauthConfig.grantTypes.password);
      formData.append('client_id', config.authConfig.clientId);
      formData.append('username', credentials.email);
      formData.append('password', credentials.password);
      formData.append('scope', config.authConfig.scopes);

      const response = await axios.post<TokenResponse>(
        config.authConfig.tokenEndpoint,
        formData,
        {
          baseURL: config.apiUrl,
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      const tokenData = response.data;
      
      if (tokenData.access_token) {
        // Store tokens and expiry
        localStorage.setItem(this.tokenKey, tokenData.access_token);
        if (tokenData.refresh_token) {
          localStorage.setItem(this.refreshTokenKey, tokenData.refresh_token);
        }
        if (tokenData.id_token) {
          localStorage.setItem(this.idTokenKey, tokenData.id_token);
        }
        
        // Calculate expiry time
        const expiresAt = Date.now() + (tokenData.expires_in * 1000);
        localStorage.setItem(this.expiresKey, expiresAt.toString());

        // Get user info from token or make a separate API call
        const user = await this.getUserInfo();
        if (user) {
          localStorage.setItem(this.userKey, JSON.stringify(user));
        }

        return {
          success: true,
          token: tokenData.access_token,
          user: user
        };
      }

      return {
        success: false,
        errorMessage: 'No access token received'
      };
    } catch (error) {
      console.error('Login error:', error);
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 400) {
          return {
            success: false,
            errorMessage: 'Invalid email or password'
          };
        }
        if (error.response?.status === 401) {
          return {
            success: false,
            errorMessage: 'Invalid email or password'
          };
        }
        if (error.code === 'ECONNREFUSED' || error.message.includes('ERR_CONNECTION_REFUSED')) {
          return {
            success: false,
            errorMessage: 'Cannot connect to server. Please check if the backend is running.'
          };
        }
        return {
          success: false,
          errorMessage: `Server error: ${error.response?.status || 'Unknown'}`
        };
      }
      return {
        success: false,
        errorMessage: 'Network error during authentication'
      };
    }
  }

  // Get user info from the token or API
  private static async getUserInfo(): Promise<UserDto | null> {
    try {
      // Use id_token instead of access_token for user claims
      const idToken = localStorage.getItem(this.idTokenKey);
      console.log('ID Token available:', !!idToken);
      if (!idToken) {
        console.warn('No id_token found');
        return null;
      }

      // Decode JWT to get user claims
      const payload = JSON.parse(atob(idToken.split('.')[1]));
      console.log('ID Token payload:', payload);
      
      const user = {
        id: payload.sub,
        email: payload.email || payload.username,
        username: payload.preferred_username || payload.email || payload.username,
        name: payload.given_name || payload.name || '',
        surname: payload.family_name || '',
        roles: payload.role ? (Array.isArray(payload.role) ? payload.role : [payload.role]) : [],
        isActive: true,
        isEmailConfirmed: true,
        isPhoneNumberConfirmed: false,
        isLockoutEnabled: false,
        createdAt: new Date().toISOString(),
      };
      
      console.log('Extracted user info:', user);
      return user;
    } catch (error) {
      console.error('Error decoding id_token:', error);
      return null;
    }
  }

  static async logout(): Promise<void> {
    try {
      // OpenIddict doesn't require a logout endpoint for this flow
      // Clear local storage to log the user out
      this.clearAuth();
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  static async refreshToken(): Promise<AuthResultDto | null> {
    const refreshToken = localStorage.getItem(this.refreshTokenKey);
    if (!refreshToken) return null;
    
    try {
      const formData = new URLSearchParams();
      formData.append('grant_type', oauthConfig.grantTypes.refreshToken);
      formData.append('client_id', config.authConfig.clientId);
      formData.append('refresh_token', refreshToken);

      const response = await axios.post<TokenResponse>(
        config.authConfig.tokenEndpoint,
        formData,
        {
          baseURL: config.apiUrl,
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      const tokenData = response.data;
      
      if (tokenData.access_token) {
        localStorage.setItem(this.tokenKey, tokenData.access_token);
        if (tokenData.refresh_token) {
          localStorage.setItem(this.refreshTokenKey, tokenData.refresh_token);
        }
        
        const expiresAt = Date.now() + (tokenData.expires_in * 1000);
        localStorage.setItem(this.expiresKey, expiresAt.toString());

        const user = await this.getUserInfo();
        if (user) {
          localStorage.setItem(this.userKey, JSON.stringify(user));
        }

        return {
          success: true,
          token: tokenData.access_token,
          user: user
        };
      }
      
      this.clearAuth();
      return null;
    } catch (error) {
      console.error('Token refresh error:', error);
      this.clearAuth();
      return null;
    }
  }

  static getToken(): string | null {
    const token = localStorage.getItem(this.tokenKey);
    const expiresAt = localStorage.getItem(this.expiresKey);
    
    // Check if token is expired
    if (token && expiresAt) {
      const expiry = parseInt(expiresAt, 10);
      if (Date.now() >= expiry) {
        this.clearAuth();
        return null;
      }
    }
    
    return token;
  }

  static getUser(): UserDto | null {
    const userStr = localStorage.getItem(this.userKey);
    if (!userStr) return null;

    try {
      return JSON.parse(userStr) as UserDto;
    } catch {
      return null;
    }
  }

  static isAuthenticated(): boolean {
    return !!this.getToken() && !!this.getUser();
  }

  static clearAuth(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.refreshTokenKey);
    localStorage.removeItem(this.idTokenKey);
    localStorage.removeItem(this.userKey);
    localStorage.removeItem(this.expiresKey);
  }

  // Create an authenticated API call
  static async authenticatedFetch<T>(
    url: string,
    options: Record<string, unknown> = {}
  ): Promise<T> {
    let token = this.getToken();
    
    if (!token) {
      // Try to refresh token
      const refreshResult = await this.refreshToken();
      if (refreshResult && refreshResult.success) {
        token = this.getToken();
      }
      
      if (!token) {
        this.clearAuth();
        window.location.href = '/auth/login';
        throw new Error('No authentication token available');
      }
    }

    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    try {
      const response = await axios({
        url,
        baseURL: config.apiUrl,
        headers,
        ...options,
      });

      return response.data;
    } catch (error) {
      // Handle token refresh on 401
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        const refreshResult = await this.refreshToken();
        if (refreshResult && refreshResult.success) {
          // Retry with new token
          const newHeaders = {
            ...headers,
            'Authorization': `Bearer ${this.getToken()}`,
          };
          const retryResponse = await axios({
            url,
            baseURL: config.apiUrl,
            headers: newHeaders,
            ...options,
          });
          return retryResponse.data;
        } else {
          // Refresh failed, redirect to login
          this.clearAuth();
          window.location.href = '/auth/login';
          throw new Error('Authentication failed');
        }
      }
      
      throw error;
    }
  }
}
