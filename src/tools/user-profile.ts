import type { SpotifyToolDefinition, ToolDependencies } from "../core/types/tools.ts";
import { SpotifyError } from "../core/utils/errors.ts";

export const userProfileTool: SpotifyToolDefinition = {
  name: "getCurrentUserProfile",
  schema: {},
  handler: (deps: ToolDependencies) => async () => {
    try {
      const user = await deps.apiService.getCurrentUser();
      
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            success: true,
            user: {
              id: user.id,
              displayName: user.display_name,
              email: user.email,
              country: user.country,
              followers: user.followers.total,
              product: user.product,
              profileUrl: user.external_urls.spotify
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