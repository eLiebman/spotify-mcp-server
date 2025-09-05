import fetch from 'node-fetch';
import { ConfigManager } from '../../core/utils/config.ts';
import { SpotifyError, SpotifyErrorCode } from '../../core/utils/errors.ts';
import { SpotifyAuthService } from './auth.service.ts';

export interface SpotifyPlaylist {
  id: string;
  name: string;
  description: string | null;
  public: boolean;
  collaborative: boolean;
  followers: {
    total: number;
  };
  owner: {
    id: string;
    display_name: string | null;
    type: string;
  };
  tracks: {
    total: number;
    href: string;
  };
  external_urls: {
    spotify: string;
  };
  images: Array<{
    url: string;
    height: number | null;
    width: number | null;
  }>;
}

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
    images: Array<{
      url: string;
      height: number | null;
      width: number | null;
    }>;
  };
  duration_ms: number;
  popularity: number;
  preview_url: string | null;
  external_urls: {
    spotify: string;
  };
}

export interface PlaylistTrack {
  track: SpotifyTrack;
  added_at: string;
  added_by: {
    id: string;
  };
}

export interface SearchPlaylistsResult {
  playlists: {
    items: SpotifyPlaylist[];
    total: number;
    limit: number;
    offset: number;
  };
}

export class SpotifyPlaylistService {
  private static instance: SpotifyPlaylistService;
  private config = ConfigManager.getInstance().getConfig();
  private authService = SpotifyAuthService.getInstance();

  private constructor() {}

  public static getInstance(): SpotifyPlaylistService {
    if (!SpotifyPlaylistService.instance) {
      SpotifyPlaylistService.instance = new SpotifyPlaylistService();
    }
    return SpotifyPlaylistService.instance;
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
   * Search for playlists containing a specific track or by artist
   */
  public async searchPlaylists(query: string, limit: number = 20, offset: number = 0): Promise<SearchPlaylistsResult> {
    const encodedQuery = encodeURIComponent(query);
    return this.makeRequest<SearchPlaylistsResult>(
      `/search?q=${encodedQuery}&type=playlist&limit=${limit}&offset=${offset}`
    );
  }

  /**
   * Search for playlists by track name and artist
   */
  public async searchPlaylistsByTrack(trackName: string, artistName: string, limit: number = 20): Promise<SpotifyPlaylist[]> {
    const query = `track:"${trackName}" artist:"${artistName}"`;
    const result = await this.searchPlaylists(query, limit);
    return result.playlists.items;
  }

  /**
   * Get a specific playlist's details
   */
  public async getPlaylist(playlistId: string): Promise<SpotifyPlaylist> {
    return this.makeRequest<SpotifyPlaylist>(`/playlists/${playlistId}`);
  }

  /**
   * Get tracks from a playlist
   */
  public async getPlaylistTracks(playlistId: string, limit: number = 50, offset: number = 0): Promise<PlaylistTrack[]> {
    const response = await this.makeRequest<{ items: PlaylistTrack[] }>(
      `/playlists/${playlistId}/tracks?limit=${limit}&offset=${offset}`
    );
    return response.items.filter(item => item.track && item.track.id); // Filter out null tracks
  }

  /**
   * Get all tracks from a playlist (handles pagination)
   */
  public async getAllPlaylistTracks(playlistId: string): Promise<PlaylistTrack[]> {
    let allTracks: PlaylistTrack[] = [];
    let offset = 0;
    const limit = 50;

    while (true) {
      const tracks = await this.getPlaylistTracks(playlistId, limit, offset);
      allTracks = allTracks.concat(tracks);

      if (tracks.length < limit) {
        break; // No more tracks
      }
      
      offset += limit;
    }

    return allTracks;
  }

  /**
   * Get featured playlists (Spotify's curated playlists)
   */
  public async getFeaturedPlaylists(limit: number = 20, offset: number = 0): Promise<SpotifyPlaylist[]> {
    const response = await this.makeRequest<{ playlists: { items: SpotifyPlaylist[] } }>(
      `/browse/featured-playlists?limit=${limit}&offset=${offset}`
    );
    return response.playlists.items;
  }

  /**
   * Get playlists from a specific category
   */
  public async getCategoryPlaylists(categoryId: string, limit: number = 20): Promise<SpotifyPlaylist[]> {
    const response = await this.makeRequest<{ playlists: { items: SpotifyPlaylist[] } }>(
      `/browse/categories/${categoryId}/playlists?limit=${limit}`
    );
    return response.playlists.items;
  }
}
