import { config } from 'dotenv';
import { SpotifyAuthConfig } from '../types/spotify.ts';

// Load environment variables
config();

export class ConfigManager {
  private static instance: ConfigManager;
  private config: {
    spotify: SpotifyAuthConfig;
    apiBaseUrl: string;
  };

  private constructor() {
    this.config = {
      spotify: {
        clientId: process.env.SPOTIFY_CLIENT_ID || '',
        clientSecret: process.env.SPOTIFY_CLIENT_SECRET || '',
        redirectUri: process.env.SPOTIFY_REDIRECT_URI || 'https://httpbin.org/anything',
        scopes: [
          'user-read-private',
          'user-read-email',
          'playlist-read-private',
          'playlist-read-collaborative',
          'user-library-read',
          'user-top-read'
        ]
      },
      apiBaseUrl: process.env.SPOTIFY_API_BASE_URL || 'https://api.spotify.com/v1'
    };

    this.validateConfig();
  }

  public static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  public getConfig() {
    return this.config;
  }

  private validateConfig(): void {
    if (!this.config.spotify.clientId) {
      throw new Error('SPOTIFY_CLIENT_ID environment variable is required');
    }
    if (!this.config.spotify.clientSecret) {
      throw new Error('SPOTIFY_CLIENT_SECRET environment variable is required');
    }
  }
}
