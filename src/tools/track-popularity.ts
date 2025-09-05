import { z } from "zod";
import type { SpotifyToolDefinition, ToolDependencies } from "../core/types/tools.ts";
import { SpotifyError } from "../core/utils/errors.ts";

export const trackPopularityTool: SpotifyToolDefinition = {
  name: "getTrackPopularity",
  schema: {
    trackId: z.string().describe("Spotify track ID (e.g., '4iV5W9uYEdYUVa79Axb7Rh')")
  },
  handler: (deps: ToolDependencies) => async ({ trackId }: { trackId: string }) => {
    try {
      const popularityData = await deps.trackService.getTrackPopularity(trackId);
      
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            success: true,
            data: popularityData
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
