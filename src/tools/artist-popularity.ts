import { z } from "zod";
import type { SpotifyToolDefinition, ToolDependencies } from "../core/types/tools.ts";
import { SpotifyError } from "../core/utils/errors.ts";

export const artistPopularityTool: SpotifyToolDefinition = {
  name: "getArtistPopularity",
  schema: {
    artistId: z.string().describe("Spotify artist ID")
  },
  handler: (deps: ToolDependencies) => async ({ artistId }: { artistId: string }) => {
    try {
      const artistResponse = await deps.searchService.makeRequest<any>(
        `/artists/${artistId}`
      );
      
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            success: true,
            data: {
              artistId: artistResponse.id,
              name: artistResponse.name,
              popularity: artistResponse.popularity || 0,
              followers: artistResponse.followers?.total || 0,
              genres: artistResponse.genres || [],
              spotifyUrl: artistResponse.external_urls?.spotify,
              images: artistResponse.images || []
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