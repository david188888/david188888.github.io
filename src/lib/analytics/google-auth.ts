import { AnalyticsError } from "./dashboard-data";

export const ANALYTICS_READONLY_SCOPE = "https://www.googleapis.com/auth/analytics.readonly";
export interface GoogleAccessToken { value: string; expiresAt: number }
export interface GoogleTokenResponse {
  access_token?: string;
  expires_in?: number | string;
  token_type?: string;
  scope?: string;
  error?: string;
}
export interface GoogleOAuth2 {
  initTokenClient(config: {
    client_id: string; scope: string; include_granted_scopes: boolean;
    callback: (response: GoogleTokenResponse) => void;
    error_callback: () => void;
  }): { requestAccessToken(options: { prompt: string }): void };
}
declare global {
  interface Window { google?: { accounts: { oauth2: GoogleOAuth2 } } }
}

export function parseGoogleToken(response: GoogleTokenResponse, now = Date.now()): GoogleAccessToken {
  const seconds = Number(response.expires_in);
  if (response.error || !response.access_token || response.token_type?.toLowerCase() !== "bearer" ||
      !response.scope?.split(/\s+/).includes(ANALYTICS_READONLY_SCOPE) ||
      !Number.isFinite(seconds) || seconds <= 15 || seconds > 86400) throw new AnalyticsError("authorization");
  return { value: response.access_token, expiresAt: now + seconds * 1000 };
}

// Call synchronously inside the Connect button handler, without awaiting a
// script/network request first, so the browser preserves the popup gesture.
export function requestGoogleToken(api: GoogleOAuth2, clientId: string, success: (token: GoogleAccessToken) => void, failure: (error: AnalyticsError) => void) {
  const client = api.initTokenClient({
    client_id: clientId, scope: ANALYTICS_READONLY_SCOPE, include_granted_scopes: false,
    callback: (response) => {
      let token: GoogleAccessToken;
      try { token = parseGoogleToken(response); }
      catch { failure(new AnalyticsError("authorization")); return; }
      success(token);
    },
    error_callback: () => failure(new AnalyticsError("popup")),
  });
  client.requestAccessToken({ prompt: "" });
}
