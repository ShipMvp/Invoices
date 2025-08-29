// Environment configuration for the frontend app
export const config = {
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:5002',
  authConfig: {
    tokenEndpoint: '/connect/token',
    scopes: 'openid email profile roles',
    clientId: import.meta.env.VITE_AUTH_CLIENT_ID || 'spa-client',
  }
};

// OAuth2/OpenIddict specific configuration
export const oauthConfig = {
  grantTypes: {
    password: 'password',
    refreshToken: 'refresh_token',
  },
  storageKeys: {
    accessToken: 'access_token',
    refreshToken: 'refresh_token',
    idToken: 'id_token',
    user: 'user',
    expiresAt: 'token_expires_at',
  }
};
