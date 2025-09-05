import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { SpotifyApiService } from "./services/spotify/api.service.ts";
import { SpotifyAuthService } from "./services/spotify/auth.service.ts";
import { SpotifyTrackService } from "./services/spotify/track.service.ts";
import { SpotifySearchService } from "./services/spotify/search.service.ts";
import { PlaylistAnalyzer } from "./utils/playlist-analyzer.ts";
import { TOOL_DEFINITIONS } from "./tools/index.ts";
import { ToolDependencies } from "./core/types/tools.ts";

export class SpotifyMcpServer {
  private server: McpServer;
  private apiService: SpotifyApiService;
  private authService: SpotifyAuthService;
  private trackService: SpotifyTrackService;
  private searchService: SpotifySearchService;
  private playlistAnalyzer: PlaylistAnalyzer;

  constructor() {
    this.server = new McpServer({
      transport: new StdioServerTransport(),
      name: "spotify-analytics",
      version: "1.0.0"
    });

    this.apiService = SpotifyApiService.getInstance();
    this.authService = SpotifyAuthService.getInstance();
    this.trackService = SpotifyTrackService.getInstance();
    this.searchService = SpotifySearchService.getInstance();
    this.playlistAnalyzer = PlaylistAnalyzer.create(this.searchService);
    this.setupTools();
  }

  private setupTools(): void {
    // Create dependencies object
    const deps: ToolDependencies = {
      server: this.server,
      apiService: this.apiService,
      authService: this.authService,
      trackService: this.trackService,
      searchService: this.searchService,
      playlistAnalyzer: this.playlistAnalyzer
    };

    // Register new simplified tool definitions
    TOOL_DEFINITIONS.forEach(toolDef => {
      this.server.tool(toolDef.name, toolDef.schema, toolDef.handler(deps));
    });
  }

  public async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("Spotify MCP Server running on stdio");
  }
}