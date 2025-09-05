import { z } from "zod";
import type { SpotifyToolDefinition, ToolDependencies } from "../core/types/tools.ts";

export const authenticateTool: SpotifyToolDefinition = {
  name: "authenticate",
  schema: {
    code: z.string().describe("Authorization code from Spotify callback"),
    codeVerifier: z.string().describe("Code verifier from generateAuthUrl")
  },
  handler: (deps: ToolDependencies) => async ({ code, codeVerifier }: { code: string; codeVerifier: string }) => {
    try {
      await deps.authService.exchangeCodeForToken(code, codeVerifier);
      
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            success: true,
            message: "Successfully authenticated with Spotify!",
            isAuthenticated: deps.authService.isAuthenticated()
          }, null, 2)
        }]
      };
    } catch (error) {
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
