import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SpotifyApiService } from "../../services/spotify/api.service.ts";
import { SpotifyAuthService } from "../../services/spotify/auth.service.ts";
import { SpotifyTrackService } from "../../services/spotify/track.service.ts";
import { SpotifySearchService } from "../../services/spotify/search.service.ts";
import { PlaylistAnalyzer } from "../../utils/playlist-analyzer.ts";

export type ToolDependencies = {
  server: McpServer;
  apiService: SpotifyApiService;
  authService: SpotifyAuthService;
  trackService: SpotifyTrackService;
  searchService: SpotifySearchService;
  playlistAnalyzer: PlaylistAnalyzer;
};

export type SpotifyToolDefinition = {
  name: string;
  schema: Record<string, any>;
  handler: (deps: ToolDependencies) => (...args: any[]) => Promise<any>;
};
