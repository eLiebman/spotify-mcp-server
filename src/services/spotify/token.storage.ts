import { writeFileSync, readFileSync, existsSync } from 'fs';
import { SpotifyTokenResponse } from '../../core/types/spotify.ts';

export interface StoredTokenData {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number; // timestamp
  scope: string;
}

export class TokenStorage {
  private static instance: TokenStorage;
  private tokenFile = '.spotify-tokens.json';

  private constructor() {}

  public static getInstance(): TokenStorage {
    if (!TokenStorage.instance) {
      TokenStorage.instance = new TokenStorage();
    }
    return TokenStorage.instance;
  }

  /**
   * Save tokens to local file
   */
  public saveTokens(tokenData: SpotifyTokenResponse): void {
    const storedData: StoredTokenData = {
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresAt: Date.now() + (tokenData.expires_in * 1000),
      scope: tokenData.scope
    };

    try {
      writeFileSync(this.tokenFile, JSON.stringify(storedData, null, 2));
    } catch (error) {
      console.error('Failed to save tokens:', error);
    }
  }

  /**
   * Load tokens from local file
   */
  public loadTokens(): StoredTokenData | null {
    try {
      if (!existsSync(this.tokenFile)) {
        return null;
      }

      const data = readFileSync(this.tokenFile, 'utf8');
      const tokenData: StoredTokenData = JSON.parse(data);

      // Check if token is expired (with 5 minute buffer)
      if (tokenData.expiresAt - Date.now() < 5 * 60 * 1000) {
        return null; // Token expired
      }

      return tokenData;
    } catch (error) {
      console.error('Failed to load tokens:', error);
      return null;
    }
  }

  /**
   * Clear stored tokens
   */
  public clearTokens(): void {
    try {
      if (existsSync(this.tokenFile)) {
        writeFileSync(this.tokenFile, '{}');
      }
    } catch (error) {
      console.error('Failed to clear tokens:', error);
    }
  }

  /**
   * Check if we have valid stored tokens
   */
  public hasValidTokens(): boolean {
    const tokens = this.loadTokens();
    return tokens !== null;
  }
}
