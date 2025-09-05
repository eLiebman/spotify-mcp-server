// Import all refactored tool definitions
import { authStatusTool } from "./auth-status.ts";
import { generateAuthUrlTool } from "./generate-auth-url.ts";
import { authenticateSimpleTool } from "./authenticate-simple.ts";
import { authenticateTool } from "./authenticate.ts";
import { trackPopularityTool } from "./track-popularity.ts";
import { albumPopularityTool } from "./album-popularity.ts";
import { artistPopularityTool } from "./artist-popularity.ts";
import { userProfileTool } from "./user-profile.ts";
import { searchTracksTool } from "./search-tracks.ts";
import { searchArtistAlbumsTool } from "./search-artist-albums.ts";
import { searchPlaylistsTool } from "./search-playlists.ts";
import { albumTracksTool } from "./album-tracks.ts";
import { analyzeSingleTool } from "./analyze-single.ts";
import { artistTrendsTool } from "./artist-trends.ts";
import { genreAnalysisTool } from "./genre-analysis.ts";
import { exploreArtistMetricsTool } from "./explore-artist-metrics.ts";
import { simulateMarketTrendsTool } from "./simulate-market-trends.ts";

// Export all refactored tool definitions
export { authStatusTool, generateAuthUrlTool, authenticateSimpleTool, authenticateTool };
export { trackPopularityTool, albumPopularityTool, artistPopularityTool, userProfileTool };
export { searchTracksTool, searchArtistAlbumsTool, searchPlaylistsTool, albumTracksTool };
export { analyzeSingleTool, artistTrendsTool, genreAnalysisTool };
export { exploreArtistMetricsTool, simulateMarketTrendsTool };

// All tool definitions registry - fully migrated to functional approach
export const TOOL_DEFINITIONS = [
  // Authentication tools
  authStatusTool,
  generateAuthUrlTool,
  authenticateSimpleTool,
  authenticateTool,
  
  // Analytics tools
  trackPopularityTool,
  albumPopularityTool,
  artistPopularityTool,
  analyzeSingleTool,
  artistTrendsTool,
  genreAnalysisTool,
  exploreArtistMetricsTool,
  simulateMarketTrendsTool,
  
  // Search tools
  searchTracksTool,
  searchArtistAlbumsTool,
  searchPlaylistsTool,
  
  // Utility tools
  userProfileTool,
  albumTracksTool,
] as const;
