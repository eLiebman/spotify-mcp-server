import { z } from "zod";
import type { SpotifyToolDefinition, ToolDependencies } from "../core/types/tools.ts";
import { SpotifyError } from "../core/utils/errors.ts";

export const albumPopularityTool: SpotifyToolDefinition = {
  name: "getAlbumPopularity",
  schema: {
    albumId: z.string().describe("Spotify album ID")
  },
  handler: (deps: ToolDependencies) => async ({ albumId }: { albumId: string }) => {
    try {
      const albumResponse = await deps.searchService.makeRequest<any>(
        `/albums/${albumId}`
      );
      
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            success: true,
            data: {
              albumId: albumResponse.id,
              name: albumResponse.name,
              artists: albumResponse.artists?.map((a: any) => a.name) || [],
              popularity: albumResponse.popularity || 0,
              releaseDate: albumResponse.release_date,
              totalTracks: albumResponse.total_tracks,
              albumType: albumResponse.album_type,
              genres: albumResponse.genres || [],
              label: albumResponse.label || null,
              spotifyUrl: albumResponse.external_urls?.spotify
            }
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