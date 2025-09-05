import fetch from 'node-fetch';
import { ConfigManager } from '../../core/utils/config.ts';
import { SpotifyError, SpotifyErrorCode } from '../../core/utils/errors.ts';
import { SpotifyAuthService } from './auth.service.ts';

export interface SpotifyTrack {
  id: string;
  name: string;
  artists: Array<{
    id: string;
    name: string;
    external_urls: {
      spotify: string;
    };
  }>;
  album: {
    id: string;
    name: string;
    release_date: string;
    images: Array<{
      url: string;
      height: number | null;
      width: number | null;
    }>;
  };
  duration_ms: number;
  popularity: number; // 0-100 popularity score
  preview_url: string | null;
  explicit: boolean;
  external_urls: {
    spotify: string;
  };
  href: string;
  uri: string;
}


export class SpotifyTrackService {
  private static instance: SpotifyTrackService;
  private config = ConfigManager.getInstance().getConfig();
  private authService = SpotifyAuthService.getInstance();

  private constructor() {}

  public static getInstance(): SpotifyTrackService {
    if (!SpotifyTrackService.instance) {
      SpotifyTrackService.instance = new SpotifyTrackService();
    }
    return SpotifyTrackService.instance;
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
          const errorData = await response.json() as any;
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
   * Get a track by its Spotify ID
   */
  public async getTrack(trackId: string): Promise<SpotifyTrack> {
    return this.makeRequest<SpotifyTrack>(`/tracks/${trackId}`);
  }

  /**
   * Get multiple tracks by their Spotify IDs (up to 50)
   */
  public async getTracks(trackIds: string[]): Promise<SpotifyTrack[]> {
    if (trackIds.length > 50) {
      throw new SpotifyError(
        SpotifyErrorCode.BadRequestError,
        'Cannot fetch more than 50 tracks at once'
      );
    }

    const ids = trackIds.join(',');
    const response = await this.makeRequest<{ tracks: SpotifyTrack[] }>(`/tracks?ids=${ids}`);
    return response.tracks.filter(track => track !== null); // Filter out null results
  }


  /**
   * Search for tracks by name and artist
   */
  public async searchTracks(query: string, limit: number = 20, offset: number = 0): Promise<SpotifyTrack[]> {
    const encodedQuery = encodeURIComponent(query);
    const response = await this.makeRequest<{ tracks: { items: SpotifyTrack[] } }>(
      `/search?q=${encodedQuery}&type=track&limit=${limit}&offset=${offset}`
    );
    return response.tracks.items;
  }


  /**
   * Get popularity score for a track (convenience method)
   */
  public async getTrackPopularity(trackId: string): Promise<{
    trackId: string;
    name: string;
    artists: string[];
    popularity: number;
    releaseDate: string;
  }> {
    const track = await this.getTrack(trackId);
    
    return {
      trackId: track.id,
      name: track.name,
      artists: track.artists.map(artist => artist.name),
      popularity: track.popularity,
      releaseDate: track.album.release_date
    };
  }
}
