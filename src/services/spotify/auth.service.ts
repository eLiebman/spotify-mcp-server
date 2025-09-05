import { createHash, randomBytes } from 'crypto';
import fetch from 'node-fetch';
import { ConfigManager } from '../../core/utils/config.ts';
import { SpotifyError, SpotifyErrorCode } from '../../core/utils/errors.ts';
import { SpotifyTokenResponse } from '../../core/types/spotify.ts';
import { TokenStorage } from './token.storage.ts';

export class SpotifyAuthService {
  private static instance: SpotifyAuthService;
  private config = ConfigManager.getInstance().getConfig();
  private tokenStorage = TokenStorage.getInstance();
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private tokenExpiry: Date | null = null;

  private constructor() {
    // Load stored tokens on initialization
    this.loadStoredTokens();
  }

  public static getInstance(): SpotifyAuthService {
    if (!SpotifyAuthService.instance) {
      SpotifyAuthService.instance = new SpotifyAuthService();
    }
    return SpotifyAuthService.instance;
  }

  /**
   * Generate PKCE code verifier and challenge for secure OAuth flow
   */
  private generatePKCE(): { codeVerifier: string; codeChallenge: string } {
    const codeVerifier = randomBytes(32).toString('base64url');
    const codeChallenge = createHash('sha256')
      .update(codeVerifier)
      .digest('base64url');
    
    return { codeVerifier, codeChallenge };
  }

  /**
   * Generate the authorization URL for the user to visit
   */
  public generateAuthUrl(state?: string): { url: string; codeVerifier: string } {
    const { codeVerifier, codeChallenge } = this.generatePKCE();
    
    const params = new URLSearchParams({
      client_id: this.config.spotify.clientId,
      response_type: 'code',
      redirect_uri: this.config.spotify.redirectUri,
      code_challenge_method: 'S256',
      code_challenge: codeChallenge,
      scope: this.config.spotify.scopes.join(' '),
      ...(state && { state })
    });

    const authUrl = `https://accounts.spotify.com/authorize?${params.toString()}`;
    
    return { url: authUrl, codeVerifier };
  }

  /**
   * Exchange authorization code for access token
   */
  public async exchangeCodeForToken(code: string, codeVerifier: string): Promise<void> {
    const tokenUrl = 'https://accounts.spotify.com/api/token';
    
    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: this.config.spotify.redirectUri,
      client_id: this.config.spotify.clientId,
      code_verifier: codeVerifier
    });

    try {
      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString()
      });

      if (!response.ok) {
        const errorData = await response.json() as any;
        throw new SpotifyError(
          SpotifyErrorCode.AuthenticationError,
          `Token exchange failed: ${errorData.error_description || errorData.error}`,
          response.status
        );
      }

      const tokenData = await response.json() as SpotifyTokenResponse;
      this.setTokens(tokenData);
      
    } catch (error) {
      if (error instanceof SpotifyError) {
        throw error;
      }
      throw new SpotifyError(
        SpotifyErrorCode.NetworkError,
        `Failed to exchange code for token: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Load stored tokens from file
   */
  private loadStoredTokens(): void {
    const storedTokens = this.tokenStorage.loadTokens();
    if (storedTokens) {
      this.accessToken = storedTokens.accessToken;
      this.refreshToken = storedTokens.refreshToken || null;
      this.tokenExpiry = new Date(storedTokens.expiresAt);
    }
  }

  /**
   * Set tokens and calculate expiry
   */
  private setTokens(tokenData: SpotifyTokenResponse): void {
    this.accessToken = tokenData.access_token;
    this.refreshToken = tokenData.refresh_token || this.refreshToken;
    this.tokenExpiry = new Date(Date.now() + (tokenData.expires_in * 1000));
    
    // Save tokens to persistent storage
    this.tokenStorage.saveTokens(tokenData);
  }

  /**
   * Get valid access token, refreshing if necessary
   */
  public async getAccessToken(): Promise<string> {
    if (!this.accessToken) {
      throw new SpotifyError(
        SpotifyErrorCode.AuthenticationError,
        'No access token available. Please authenticate first.'
      );
    }

    // Check if token is expired (with 5 minute buffer)
    if (this.tokenExpiry && this.tokenExpiry.getTime() - Date.now() < 5 * 60 * 1000) {
      await this.refreshAccessToken();
    }

    return this.accessToken;
  }

  /**
   * Refresh the access token using refresh token
   */
  private async refreshAccessToken(): Promise<void> {
    if (!this.refreshToken) {
      throw new SpotifyError(
        SpotifyErrorCode.AuthenticationError,
        'No refresh token available. Please re-authenticate.'
      );
    }

    const tokenUrl = 'https://accounts.spotify.com/api/token';
    
    const body = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: this.refreshToken,
      client_id: this.config.spotify.clientId
    });

    try {
      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString()
      });

      if (!response.ok) {
        const errorData = await response.json() as any;
        throw new SpotifyError(
          SpotifyErrorCode.AuthenticationError,
          `Token refresh failed: ${errorData.error_description || errorData.error}`,
          response.status
        );
      }

      const tokenData = await response.json() as SpotifyTokenResponse;
      this.setTokens(tokenData);
      
    } catch (error) {
      if (error instanceof SpotifyError) {
        throw error;
      }
      throw new SpotifyError(
        SpotifyErrorCode.NetworkError,
        `Failed to refresh token: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Check if we have a valid authentication
   */
  public isAuthenticated(): boolean {
    return !!this.accessToken && (!this.tokenExpiry || this.tokenExpiry > new Date());
  }

  /**
   * Authenticate using Client Credentials Flow (no user interaction required)
   * This is perfect for server-to-server applications
   */
  public async authenticateClientCredentials(): Promise<void> {
    const tokenUrl = 'https://accounts.spotify.com/api/token';
    
    const body = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: this.config.spotify.clientId,
      client_secret: this.config.spotify.clientSecret
    });

    try {
      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString()
      });

      if (!response.ok) {
        const errorData = await response.json() as any;
        throw new SpotifyError(
          SpotifyErrorCode.AuthenticationError,
          `Client credentials authentication failed: ${errorData.error_description || errorData.error}`,
          response.status
        );
      }

      const tokenData = await response.json() as SpotifyTokenResponse;
      this.setTokens(tokenData);
      
    } catch (error) {
      if (error instanceof SpotifyError) {
        throw error;
      }
      throw new SpotifyError(
        SpotifyErrorCode.NetworkError,
        `Failed to authenticate with client credentials: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Clear all authentication data
   */
  public clearAuth(): void {
    this.accessToken = null;
    this.refreshToken = null;
    this.tokenExpiry = null;
    this.tokenStorage.clearTokens();
  }
}
