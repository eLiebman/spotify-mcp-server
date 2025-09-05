import { z } from "zod";
import type { SpotifyToolDefinition, ToolDependencies } from "../core/types/tools.ts";
import { SpotifyError } from "../core/utils/errors.ts";

export const searchPlaylistsTool: SpotifyToolDefinition = {
  name: "searchPlaylistsByTrack",
  schema: {
    trackName: z.string().describe("Name of the track to search for"),
    artistName: z.string().describe("Name of the artist"),
    limit: z.number().optional().describe("Number of playlists to return (default: 20)")
  },
  handler: (deps: ToolDependencies) => async ({ trackName, artistName, limit = 20 }: { trackName: string; artistName: string; limit?: number }) => {
    try {
      const playlists = await deps.searchService.searchPlaylistsByTrack(trackName, artistName, limit);
      
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            success: true,
            query: { trackName, artistName },
            foundPlaylists: playlists.length,
            data: playlists.filter(playlist => playlist && playlist.id).map(playlist => ({
              id: playlist.id,
              name: playlist.name,
              description: playlist.description,
              owner: playlist.owner?.display_name || playlist.owner?.id,
              isPublic: playlist.public,
              collaborative: playlist.collaborative,
              totalTracks: playlist.tracks?.total || 0,
              spotifyUrl: playlist.external_urls?.spotify,
              images: playlist.images || []
            }))
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