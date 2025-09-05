import { z } from "zod";
import type { SpotifyToolDefinition, ToolDependencies } from "../core/types/tools.ts";
import { SpotifyError } from "../core/utils/errors.ts";
import { GenreAnalyzer } from "../utils/genre-analyzer.ts";

export const genreAnalysisTool: SpotifyToolDefinition = {
  name: "analyzeGenre",
  schema: {
    artistId: z.string().describe("Spotify artist ID"),
    includePlaylistAnalysis: z.boolean().optional().describe("Include playlist co-appearance analysis (default: true)"),
    includeRelatedArtists: z.boolean().optional().describe("Include related artists genre analysis (default: true)"),
  },
  handler: (deps: ToolDependencies) => async ({ 
    artistId, 
    includePlaylistAnalysis = true, 
    includeRelatedArtists = true
  }: { 
    artistId: string; 
    includePlaylistAnalysis?: boolean; 
    includeRelatedArtists?: boolean; 
  }) => {
    try {
      // Get base artist info
      const artist = await deps.searchService.makeRequest<any>(`/artists/${artistId}`);
      
      // Get artist's top tracks for analysis
      const topTracks = await deps.searchService.makeRequest<any>(`/artists/${artistId}/top-tracks?market=US`);
      
      let genreAnalysis: any = {
        artistGenres: artist.genres || [],
        directGenreCount: (artist.genres || []).length
      };
      
      // Related Artists Analysis (with fallback to playlist-based discovery)
      if (includeRelatedArtists) {
        try {
          const relatedArtistsResponse = await deps.searchService.makeRequest<any>(`/artists/${artistId}/related-artists`);
          const relatedArtists = relatedArtistsResponse.artists || [];
          
          if (relatedArtists.length > 0) {
            const suggestedGenres = GenreAnalyzer.extractCommonGenres(relatedArtists);
            genreAnalysis.relatedArtists = {
              count: relatedArtists.length,
              suggestedGenres: suggestedGenres,
              artists: relatedArtists.slice(0, 10).map((artist: any) => ({
                name: artist.name,
                popularity: artist.popularity,
                genres: artist.genres
              }))
            };
          } else {
            genreAnalysis.relatedArtists = {
              error: "No related artists found",
              note: "This may indicate a newer or less established artist"
            };
          }
        } catch (error) {
          genreAnalysis.relatedArtists = {
            error: "Related artists data unavailable",
            note: "API endpoint may not be accessible for this artist",
            statusCode: error instanceof SpotifyError ? error.statusCode : 'unknown'
          };
        }
      }
      
      // Playlist Analysis - Search for playlists containing this artist's tracks
      if (includePlaylistAnalysis && topTracks.tracks && topTracks.tracks.length > 0) {
        try {
          const playlistAnalysisResults = [];
          
          // Analyze playlists for the artist's most popular tracks
          for (const track of topTracks.tracks.slice(0, 3)) { // Limit to top 3 tracks
            try {
              const playlists = await deps.playlistAnalyzer.findPlaylistsForTrack(track.name, artist.name);
              
              if (playlists && playlists.length > 0) {
                playlistAnalysisResults.push({
                  trackName: track.name,
                  playlistsFound: playlists.length,
                  samplePlaylists: playlists.slice(0, 5).map(p => ({
                    name: p.name,
                    owner: p.owner?.display_name || p.owner?.id,
                    totalTracks: p.tracks?.total
                  }))
                });
              }
            } catch (trackError) {
              // Continue with other tracks if one fails
              playlistAnalysisResults.push({
                trackName: track.name,
                error: "Could not analyze playlists for this track"
              });
            }
          }
          
          genreAnalysis.playlistAnalysis = {
            tracksAnalyzed: Math.min(3, topTracks.tracks.length),
            results: playlistAnalysisResults,
            summary: {
              totalPlaylistsFound: playlistAnalysisResults.reduce((sum, result) => 
                sum + (result.playlistsFound || 0), 0),
              averagePlaylistsPerTrack: playlistAnalysisResults.length > 0 
                ? playlistAnalysisResults.reduce((sum, result) => sum + (result.playlistsFound || 0), 0) / playlistAnalysisResults.length 
                : 0
            }
          };
          
          if (genreAnalysis.playlistAnalysis.summary.totalPlaylistsFound === 0) {
            genreAnalysis.playlistAnalysis.note = "No playlists found containing this artist's tracks. This may indicate limited playlist presence or a newer artist.";
          }
        } catch (error) {
          genreAnalysis.playlistAnalysis = {
            error: "Playlist analysis failed",
            note: "Could not search for playlists containing this artist's tracks"
          };
        }
      }
      
      
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
            analysis: genreAnalysis,
            metadata: {
              analysisDate: new Date().toISOString(),
              includedAnalyses: {
                relatedArtists: includeRelatedArtists,
                playlistAnalysis: includePlaylistAnalysis
              }
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