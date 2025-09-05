import type { SpotifyToolDefinition, ToolDependencies } from "../core/types/tools.ts";

export const authStatusTool: SpotifyToolDefinition = {
  name: "getAuthStatus",
  schema: {},
  handler: (deps: ToolDependencies) => async () => {
    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          isAuthenticated: deps.authService.isAuthenticated(),
          timestamp: new Date().toISOString()
        }, null, 2)
      }]
    };
  }
};
