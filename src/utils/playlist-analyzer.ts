/**
 * Playlist Analysis Utilities
 * Functions for discovering related artists through playlist co-appearances
 */

import { SpotifySearchService } from '../services/spotify/search.service.js';

export class PlaylistAnalyzer {
  private searchService: SpotifySearchService;

  constructor(searchService: SpotifySearchService) {
    this.searchService = searchService;
  }

  /**
   * Find related artists by analyzing playlist co-appearances
   */
  async findRelatedArtistsFromPlaylists(artist: any, topTracks: any): Promise<any> {
    const relatedArtistCounts: { [artistName: string]: { count: number, genres: string[] } } = {};
    
    // Search for playlists containing the artist's tracks
    for (const track of (topTracks.tracks || []).slice(0, 3)) {
      try {
        const playlistSearch = await this.searchService.makeRequest<any>(
          `/search?q="${encodeURIComponent(track.name)}" ${encodeURIComponent(artist.name)}&type=playlist&limit=10`
        );
        
        // For each playlist found, get its tracks to find co-appearing artists
        for (const playlist of (playlistSearch.playlists?.items || []).slice(0, 5)) {
          try {
            const playlistTracks = await this.searchService.makeRequest<any>(
              `/playlists/${playlist.id}/tracks?limit=50`
            );
            
            // Count co-appearing artists
            for (const playlistTrack of (playlistTracks.items || [])) {
              if (playlistTrack.track && playlistTrack.track.artists) {
                for (const trackArtist of playlistTrack.track.artists) {
                  if (trackArtist.name !== artist.name) {
                    if (!relatedArtistCounts[trackArtist.name]) {
                      relatedArtistCounts[trackArtist.name] = { count: 0, genres: [] };
                    }
                    relatedArtistCounts[trackArtist.name].count++;
                  }
                }
              }
            }
          } catch (error) {
            // Continue with other playlists if one fails
          }
        }
      } catch (error) {
        // Continue with other tracks if one fails
      }
    }
    
    // Get top related artists (minimum 2 co-appearances)
    const topRelatedArtists = Object.entries(relatedArtistCounts)
      .filter(([, data]) => data.count >= 2)
      .sort(([, a], [, b]) => b.count - a.count)
      .slice(0, 10)
      .map(([name, data]) => ({
        name,
        coAppearances: data.count,
        genres: [] // We'd need to fetch full artist data for genres
      }));
    
    return {
      count: topRelatedArtists.length,
      artists: topRelatedArtists,
      method: 'playlist_co_appearance',
      note: 'Related artists discovered through playlist co-appearances (minimum 2 shared playlists)'
    };
  }

  /**
   * Find playlists that contain a specific track
   */
  async findPlaylistsForTrack(trackName: string, artistName: string): Promise<any[]> {
    try {
      const query = `"${encodeURIComponent(trackName)}" ${encodeURIComponent(artistName)}`;
      const playlistSearch = await this.searchService.makeRequest<any>(
        `/search?q=${query}&type=playlist&limit=20`
      );
      
      return playlistSearch.playlists?.items || [];
    } catch (error) {
      console.error(`Error finding playlists for track ${trackName}:`, error);
      return [];
    }
  }

  /**
   * Static factory method to create PlaylistAnalyzer with search service
   */
  static create(searchService: SpotifySearchService): PlaylistAnalyzer {
    return new PlaylistAnalyzer(searchService);
  }
}
