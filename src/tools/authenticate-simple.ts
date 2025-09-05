import type { SpotifyToolDefinition, ToolDependencies } from "../core/types/tools.ts";
import { SpotifyError } from "../core/utils/errors.ts";

export const authenticateSimpleTool: SpotifyToolDefinition = {
  name: "authenticateSimple",
  schema: {},
  handler: (deps: ToolDependencies) => async () => {
    try {
      await deps.authService.authenticateClientCredentials();
      
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            success: true,
            message: "Successfully authenticated using client credentials!",
            isAuthenticated: deps.authService.isAuthenticated(),
            note: "This method works for public data access (tracks, albums, playlists)"
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
