import { z } from "zod";
import type { SpotifyToolDefinition, ToolDependencies } from "../core/types/tools.ts";
import { SpotifyError } from "../core/utils/errors.ts";

export const albumTracksTool: SpotifyToolDefinition = {
  name: "getAlbumTracks",
  schema: {
    albumId: z.string().describe("Spotify album ID"),
    limit: z.number().optional().describe("Number of tracks to return (default: 50)")
  },
  handler: (deps: ToolDependencies) => async ({ albumId, limit = 50 }: { albumId: string; limit?: number }) => {
    try {
      // Get album info
      const albumResponse = await deps.searchService.makeRequest<any>(
        `/albums/${albumId}`
      );
      
      // Get album tracks
      const tracksResponse = await deps.searchService.makeRequest<any>(
        `/albums/${albumId}/tracks?limit=${limit}`
      );
      
      // Get detailed track info with popularity for each track
      const trackIds = tracksResponse.items?.map((track: any) => track.id).join(',') || '';
      const detailedTracksResponse = await deps.searchService.makeRequest<any>(
        `/tracks?ids=${trackIds}`
      );
      
      const tracks = detailedTracksResponse.tracks?.map((track: any) => ({
        id: track.id,
        name: track.name,
        trackNumber: track.track_number,
        discNumber: track.disc_number,
        durationMs: track.duration_ms,
        explicit: track.explicit,
        popularity: track.popularity,
        previewUrl: track.preview_url,
        spotifyUrl: track.external_urls?.spotify
      })) || [];
      
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            success: true,
            album: {
              id: albumResponse.id,
              name: albumResponse.name,
              artists: albumResponse.artists?.map((a: any) => a.name) || [],
              releaseDate: albumResponse.release_date,
              totalTracks: albumResponse.total_tracks,
              albumType: albumResponse.album_type,
              genres: albumResponse.genres || [],
              label: albumResponse.label,
              popularity: albumResponse.popularity,
              spotifyUrl: albumResponse.external_urls?.spotify,
              images: albumResponse.images || []
            },
            tracks: tracks,
            totalTracks: tracks.length
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