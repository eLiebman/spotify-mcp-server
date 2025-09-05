import { z } from "zod";
import type { SpotifyToolDefinition, ToolDependencies } from "../core/types/tools.ts";
import { SpotifyError } from "../core/utils/errors.ts";

export const analyzeSingleTool: SpotifyToolDefinition = {
  name: "analyzeSingle",
  schema: {
    trackId: z.string().describe("Spotify track ID"),
    includeAlbumTracks: z.boolean().optional().describe("Include analysis of other tracks on the album (default: false)")
  },
  handler: (deps: ToolDependencies) => async ({ trackId, includeAlbumTracks = false }: { trackId: string; includeAlbumTracks?: boolean }) => {
    try {
      // Get track details
      const trackResponse = await deps.searchService.makeRequest<any>(
        `/tracks/${trackId}`
      );
      
      // Get album details
      const albumResponse = await deps.searchService.makeRequest<any>(
        `/albums/${trackResponse.album.id}`
      );
      
      // Get album tracks if requested
      let albumTracksAnalysis = null;
      if (includeAlbumTracks && albumResponse.total_tracks > 1) {
        const tracksResponse = await deps.searchService.makeRequest<any>(
          `/albums/${trackResponse.album.id}/tracks`
        );
        
        // Get detailed track info for popularity scores
        const trackIds = tracksResponse.items?.map((track: any) => track.id).join(',') || '';
        const detailedTracksResponse = await deps.searchService.makeRequest<any>(
          `/tracks?ids=${trackIds}`
        );
        
        const tracks = detailedTracksResponse.tracks?.map((track: any) => ({
          id: track.id,
          name: track.name,
          trackNumber: track.track_number,
          popularity: track.popularity,
          durationMs: track.duration_ms,
          isCurrentTrack: track.id === trackId
        })) || [];
        
        // Calculate album statistics
        const popularityScores = tracks.map((t: any) => t.popularity).filter((p: any) => p !== undefined);
        const avgPopularity = popularityScores.length > 0 
          ? popularityScores.reduce((sum: number, p: number) => sum + p, 0) / popularityScores.length 
          : 0;
        
        const currentTrackRank = tracks
          .sort((a: any, b: any) => b.popularity - a.popularity)
          .findIndex((t: any) => t.id === trackId) + 1;
        
        albumTracksAnalysis = {
          tracks: tracks,
          statistics: {
            totalTracks: tracks.length,
            averagePopularity: Math.round(avgPopularity),
            currentTrackRank: currentTrackRank,
            currentTrackIsTopTrack: currentTrackRank === 1
          }
        };
      }
      
      // Build comprehensive analysis
      const analysis = {
        track: {
          id: trackResponse.id,
          name: trackResponse.name,
          artists: trackResponse.artists?.map((a: any) => a.name) || [],
          popularity: trackResponse.popularity,
          durationMs: trackResponse.duration_ms,
          explicit: trackResponse.explicit,
          releaseDate: trackResponse.album?.release_date,
          spotifyUrl: trackResponse.external_urls?.spotify
        },
        album: {
          id: albumResponse.id,
          name: albumResponse.name,
          artists: albumResponse.artists?.map((a: any) => a.name) || [],
          popularity: albumResponse.popularity,
          releaseDate: albumResponse.release_date,
          totalTracks: albumResponse.total_tracks,
          albumType: albumResponse.album_type,
          genres: albumResponse.genres || [],
          label: albumResponse.label,
          spotifyUrl: albumResponse.external_urls?.spotify,
          images: albumResponse.images || []
        },
        analysis: {
          trackVsAlbumPopularity: {
            trackPopularity: trackResponse.popularity,
            albumPopularity: albumResponse.popularity,
            difference: trackResponse.popularity - albumResponse.popularity,
            trackIsMorePopular: trackResponse.popularity > albumResponse.popularity
          },
          releaseContext: {
            releaseDate: trackResponse.album?.release_date,
            albumType: albumResponse.album_type,
            isPartOfLargerWork: albumResponse.total_tracks > 1
          }
        }
      };
      
      if (albumTracksAnalysis) {
        (analysis as any).albumTracksAnalysis = albumTracksAnalysis;
      }
      
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            success: true,
            data: analysis
          }, null, 2)
        }]
      };
    } catch (error) {
      if (error instanceof SpotifyError) {
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: false,
              error: error.message,
              code: error.code,
              statusCode: error.statusCode
            }, null, 2)
          }]
        };
      }
      
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          }, null, 2)
        }]
      };
    }
  }
};