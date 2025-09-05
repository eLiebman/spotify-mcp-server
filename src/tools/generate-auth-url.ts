import { z } from "zod";
import type { SpotifyToolDefinition, ToolDependencies } from "../core/types/tools.ts";

export const generateAuthUrlTool: SpotifyToolDefinition = {
  name: "generateAuthUrl",
  schema: {
    state: z.string().optional().describe("Optional state parameter for security")
  },
  handler: (deps: ToolDependencies) => async ({ state }: { state?: string }) => {
    try {
      const { url, codeVerifier } = deps.authService.generateAuthUrl(state);
      
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            authUrl: url,
            codeVerifier: codeVerifier,
            instructions: [
              "1. Visit the authUrl in your browser",
              "2. Log in to Spotify and authorize the application",
              "3. Copy the 'code' parameter from the redirect URL",
              "4. Use the 'authenticate' tool with the code and codeVerifier"
            ]
          }, null, 2)
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error generating auth URL: ${error instanceof Error ? error.message : 'Unknown error'}`
        }]
      };
    }
  }
};
