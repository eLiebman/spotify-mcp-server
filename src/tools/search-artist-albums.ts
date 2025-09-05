import { z } from "zod";
import type { SpotifyToolDefinition, ToolDependencies } from "../core/types/tools.ts";
import { SpotifyError } from "../core/utils/errors.ts";

export const searchArtistAlbumsTool: SpotifyToolDefinition = {
  name: "searchArtistAlbums",
  schema: {
    artistName: z.string().describe("Artist name to search for"),
    limit: z.number().optional().describe("Number of albums to return (default: 10)")
  },
  handler: (deps: ToolDependencies) => async ({ artistName, limit = 10 }: { artistName: string; limit?: number }) => {
    try {
      // First search for the artist
      const artistQuery = encodeURIComponent(`artist:"${artistName}"`);
      const artistResponse = await deps.searchService.makeRequest<any>(
        `/search?q=${artistQuery}&type=artist&limit=1`
      );
      
      if (!artistResponse.artists?.items?.length) {
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: false,
              error: `Artist "${artistName}" not found`
            }, null, 2)
          }]
        };
      }
      
      const artist = artistResponse.artists.items[0];
      
      // Get albums for this artist
      const albumsResponse = await deps.searchService.makeRequest<any>(
        `/artists/${artist.id}/albums?include_groups=album,single&market=US&limit=${limit}&offset=0`
      );
      
      const albums = albumsResponse.items?.map((album: any) => ({
        id: album.id,
        name: album.name,
        releaseDate: album.release_date,
        totalTracks: album.total_tracks,
        albumType: album.album_type,
        spotifyUrl: album.external_urls?.spotify,
        images: album.images || []
      })) || [];
      
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            success: true,
            artist: {
              id: artist.id,
              name: artist.name,
              popularity: artist.popularity,
              followers: artist.followers?.total || 0,
              genres: artist.genres || []
            },
            albums: albums,
            totalAlbums: albums.length
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