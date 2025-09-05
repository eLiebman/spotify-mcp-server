import { z } from "zod";
import type { SpotifyToolDefinition, ToolDependencies } from "../core/types/tools.ts";
import { SpotifyError } from "../core/utils/errors.ts";

export const searchTracksTool: SpotifyToolDefinition = {
  name: "searchTracks",
  schema: {
    query: z.string().describe("Search query (e.g., 'track:\"song name\" artist:\"artist name\"')"),
    limit: z.number().optional().describe("Number of tracks to return (default: 20)")
  },
  handler: (deps: ToolDependencies) => async ({ query, limit = 20 }: { query: string; limit?: number }) => {
    try {
      const encodedQuery = encodeURIComponent(query);
      const response = await deps.searchService.makeRequest<any>(
        `/search?q=${encodedQuery}&type=track&limit=${limit}`
      );
      
      // Simplify track data to reduce response size
      const simplifiedTracks = response.tracks?.items?.map((track: any) => ({
        id: track.id,
        name: track.name,
        artists: track.artists.map((a: any) => a.name),
        album: track.album.name,
        releaseDate: track.album.release_date,
        popularity: track.popularity,
        durationMs: track.duration_ms,
        previewUrl: track.preview_url,
        spotifyUrl: track.external_urls?.spotify
      })) || [];
      
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            success: true,
            query: query,
            totalFound: response.tracks?.total || 0,
            limit: limit,
            tracks: simplifiedTracks
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