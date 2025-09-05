import fetch from 'node-fetch';
import { ConfigManager } from '../../core/utils/config.ts';
import { SpotifyError, SpotifyErrorCode } from '../../core/utils/errors.ts';
import { SpotifyUser, SpotifyApiError } from '../../core/types/spotify.ts';
import { SpotifyAuthService } from './auth.service.ts';

export class SpotifyApiService {
  private static instance: SpotifyApiService;
  private config = ConfigManager.getInstance().getConfig();
  private authService = SpotifyAuthService.getInstance();

  private constructor() {}

  public static getInstance(): SpotifyApiService {
    if (!SpotifyApiService.instance) {
      SpotifyApiService.instance = new SpotifyApiService();
    }
    return SpotifyApiService.instance;
  }

  /**
   * Make authenticated request to Spotify API
   */
  private async makeRequest<T>(endpoint: string, options: any = {}): Promise<T> {
    const accessToken = await this.authService.getAccessToken();
    const url = `${this.config.apiBaseUrl}${endpoint}`;

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      // Handle rate limiting
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After');
        const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : 1000;
        
        throw new SpotifyError(
          SpotifyErrorCode.RateLimitError,
          `Rate limited. Retry after ${waitTime}ms`,
          response.status
        );
      }

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        
        try {
          const errorData = await response.json() as SpotifyApiError;
          errorMessage = errorData.error?.message || errorMessage;
        } catch {
          // If we can't parse error JSON, use the status text
        }

        throw SpotifyError.fromHttpStatus(response.status, errorMessage);
      }

      const data = await response.json() as T;
      return data;

    } catch (error) {
      if (error instanceof SpotifyError) {
        throw error;
      }
      
      throw new SpotifyError(
        SpotifyErrorCode.NetworkError,
        `API request failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get current user's profile
   * This is our first test endpoint to verify authentication
   */
  public async getCurrentUser(): Promise<SpotifyUser> {
    return this.makeRequest<SpotifyUser>('/me');
  }

  /**
   * Health check method to test API connectivity
   */
  public async testConnection(): Promise<{ success: boolean; user?: SpotifyUser; error?: string }> {
    try {
      const user = await this.getCurrentUser();
      return { success: true, user };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}
