// Gmail integration service with type-safe API calls
import { AuthService } from "./auth-service";
import type { components } from "./schema";

// Use generated schema types when available
export type GmailIntegrationStatus =
  components["schemas"]["ShipMvp.Integration.Gmail.Services.GmailIntegrationStatusDto"];
export type GoogleAuthResult =
  components["schemas"]["ShipMvp.Integration.Gmail.Application.GoogleAuth.GoogleAuthResultDto"];

// Fallback local input type for connect call
export interface ConnectGmailInput {
  origin: string;
}

export interface ConnectGmailResult {
  success: boolean;
  config?: {
    clientId: string;
    scopes: string;
    redirectUri: string;
    exchangeEndpoint: string;
  } | null;
  error?: string | null;
}

class GmailIntegrationService {
  /**
   * Check Gmail integration status
   */
  async getGmailIntegrationStatus(): Promise<GmailIntegrationStatus> {
    try {
      const data = await AuthService.authenticatedFetch<GmailIntegrationStatus>(
        "/api/GmailIntegration/status",
        {
          method: "GET",
        }
      );

      return data;
    } catch (error) {
      console.error("Failed to get Gmail integration status:", error);
      // Return default disconnected state on error
      return {
        isConnected: false,
        email: null,
        platformType: 1,
        message: "Failed to check Gmail integration status",
      };
    }
  }

  /**
   * Disconnect Gmail integration
   */
  async disconnectGmailIntegration(): Promise<{ message?: string } | unknown> {
    try {
      const data = await AuthService.authenticatedFetch<{ message?: string }>(
        "/api/GmailIntegration/disconnect",
        {
          method: "POST",
        }
      );

      return data;
    } catch (error) {
      console.error("Failed to disconnect Gmail integration:", error);
      throw new Error(`Failed to disconnect Gmail integration: ${error}`);
    }
  }

  /**
   * Get Google OAuth configuration from backend
   */
  async getGoogleAuthConfig(): Promise<{
    clientId: string;
    scopes: string;
    redirectUri: string;
    exchangeEndpoint: string;
  }> {
    try {
      const data = await AuthService.authenticatedFetch<{
        clientId?: string;
        scopes?: string;
        redirectUri?: string;
        exchangeEndpoint?: string;
      }>("/api/google/auth/config", {
        method: "GET",
      });

      if (
        !data.clientId ||
        !data.scopes ||
        !data.redirectUri ||
        !data.exchangeEndpoint
      ) {
        throw new Error("Missing required fields from Google OAuth config");
      }
      return {
        clientId: data.clientId,
        scopes: data.scopes,
        redirectUri: data.redirectUri,
        exchangeEndpoint: data.exchangeEndpoint,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to get Google OAuth configuration";
      throw new Error(errorMessage);
    }
  }

  /**
   * Initiate Gmail connection process
   */
  async connectGmail(origin: string): Promise<ConnectGmailResult> {
    const input: ConnectGmailInput = { origin };
    try {
      const data = await AuthService.authenticatedFetch<ConnectGmailResult>(
        "/api/google/auth/connect",
        {
          method: "POST",
          data: input,
        }
      );

      return data;
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to initiate Gmail connection";
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Initiate Gmail OAuth flow (PKCE)
   */
  async initiateGmailAuth(): Promise<{
    codeVerifier: string;
    state: string;
    authorizationUrl: string;
    codeChallenge?: string;
    redirectUri?: string;
  }> {
    try {
      const data = await AuthService.authenticatedFetch<{
        codeVerifier: string;
        state: string;
        authorizationUrl: string;
        codeChallenge?: string;
        redirectUri?: string;
      }>("/api/google/auth/initiate", {
        method: "GET",
      });

      // Be tolerant with backend field names (some servers may return different casing)
      const payload = data as Record<string, unknown>;
      const authorizationUrl =
        payload["authorizationUrl"] ||
        payload["authorization_uri"] ||
        payload["authorizationUrlRaw"] ||
        payload["url"];
      const codeVerifier = payload["codeVerifier"] || payload["code_verifier"];
      const state = payload["state"];

      // Check for required fields - for PKCE flow, we mainly need authorizationUrl and state
      // codeVerifier might be empty if generated client-side
      if (!data || !state || !authorizationUrl) {
        console.error(
          "Gmail OAuth initiation returned unexpected payload:",
          data
        );
        const raw = (() => {
          try {
            return JSON.stringify(data);
          } catch {
            return String(data);
          }
        })();
        const snippet =
          raw.length > 1000 ? raw.substring(0, 1000) + "... (truncated)" : raw;
        throw new Error(
          `Missing required fields from Gmail OAuth initiation. Response: ${snippet}`
        );
      }

      // Return normalized payload
      return {
        codeVerifier: String(codeVerifier || ""), // Allow empty string for client-side generation
        state: String(state),
        authorizationUrl: String(authorizationUrl),
        codeChallenge: (payload["codeChallenge"] ||
          payload["code_challenge"]) as string | undefined,
        redirectUri: (payload["redirectUri"] || payload["redirect_uri"]) as
          | string
          | undefined,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to initiate Gmail OAuth";
      throw new Error(errorMessage);
    }
  }
}

export { GmailIntegrationService };
