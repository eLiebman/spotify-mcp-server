import fetch from 'node-fetch';
import { ConfigManager } from '../../core/utils/config.ts';
import { SpotifyError, SpotifyErrorCode } from '../../core/utils/errors.ts';
import { SpotifyAuthService } from './auth.service.ts';

export interface SpotifyArtist {
  id: string;
  name: string;
  genres: string[];
  popularity: number;
  followers: {
    total: number;
  };
  images: Array<{
    url: string;
    height: number | null;
    width: number | null;
  }>;
  external_urls: {
    spotify: string;
  };
}

export interface SpotifyPlaylistSimple {
  id: string;
  name: string;
  description: string | null;
  public: boolean;
  collaborative: boolean;
  owner: {
    id: string;
    display_name: string | null;
  };
  tracks: {
    total: number;
  };
  images: Array<{
    url: string;
    height: number | null;
    width: number | null;
  }>;
  external_urls: {
    spotify: string;
  };
}

export interface SearchResults {
  tracks?: {
    items: any[];
    total: number;
  };
  artists?: {
    items: SpotifyArtist[];
    total: number;
  };
  playlists?: {
    items: SpotifyPlaylistSimple[];
    total: number;
  };
}

export class SpotifySearchService {
  private static instance: SpotifySearchService;
  private config = ConfigManager.getInstance().getConfig();
  private authService = SpotifyAuthService.getInstance();

  private constructor() {}

  public static getInstance(): SpotifySearchService {
    if (!SpotifySearchService.instance) {
      SpotifySearchService.instance = new SpotifySearchService();
    }
    return SpotifySearchService.instance;
  }

  /**
   * Make authenticated request to Spotify API
   */
  public async makeRequest<T>(endpoint: string, options: any = {}): Promise<T> {
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
   * Search for playlists containing a specific track
   */
  public async searchPlaylistsByTrack(trackName: string, artistName: string, limit: number = 20): Promise<SpotifyPlaylistSimple[]> {
    // Use simpler query format that actually works
    const query = `"${trackName}" ${artistName}`;
    const encodedQuery = encodeURIComponent(query);
    
    const response = await this.makeRequest<SearchResults>(
      `/search?q=${encodedQuery}&type=playlist&limit=${limit}`
    );
    
    return response.playlists?.items || [];
  }

  /**
   * Search for playlists by genre or mood
   */
  public async searchPlaylistsByGenre(genre: string, limit: number = 20): Promise<SpotifyPlaylistSimple[]> {
    const query = `genre:"${genre}"`;
    const encodedQuery = encodeURIComponent(query);
    
    const response = await this.makeRequest<SearchResults>(
      `/search?q=${encodedQuery}&type=playlist&limit=${limit}`
    );
    
    return response.playlists?.items || [];
  }

  /**
   * Get an artist's information including genres and popularity
   */
  public async getArtist(artistId: string): Promise<SpotifyArtist> {
    return this.makeRequest<SpotifyArtist>(`/artists/${artistId}`);
  }

  /**
   * Get related artists (for trend analysis)
   */
  public async getRelatedArtists(artistId: string): Promise<SpotifyArtist[]> {
    const response = await this.makeRequest<{ artists: SpotifyArtist[] }>(`/artists/${artistId}/related-artists`);
    return response.artists;
  }

  /**
   * Search for artists by name
   */
  public async searchArtists(query: string, limit: number = 20): Promise<SpotifyArtist[]> {
    const encodedQuery = encodeURIComponent(query);
    
    const response = await this.makeRequest<SearchResults>(
      `/search?q=${encodedQuery}&type=artist&limit=${limit}`
    );
    
    return response.artists?.items || [];
  }

  /**
   * Get recommendations based on seed artists or tracks
   * This can help with trend discovery
   */
  public async getRecommendations(params: {
    seedArtists?: string[];
    seedTracks?: string[];
    seedGenres?: string[];
    limit?: number;
    targetPopularity?: number;
  }): Promise<any[]> {
    const queryParams = new URLSearchParams();
    
    if (params.seedArtists?.length) {
      queryParams.append('seed_artists', params.seedArtists.join(','));
    }
    if (params.seedTracks?.length) {
      queryParams.append('seed_tracks', params.seedTracks.join(','));
    }
    if (params.seedGenres?.length) {
      queryParams.append('seed_genres', params.seedGenres.join(','));
    }
    if (params.limit) {
      queryParams.append('limit', params.limit.toString());
    }
    if (params.targetPopularity !== undefined) {
      queryParams.append('target_popularity', params.targetPopularity.toString());
    }

    const response = await this.makeRequest<{ tracks: any[] }>(`/recommendations?${queryParams.toString()}`);
    return response.tracks;
  }
}
