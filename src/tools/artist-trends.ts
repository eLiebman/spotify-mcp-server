import { z } from "zod";
import type { SpotifyToolDefinition, ToolDependencies } from "../core/types/tools.ts";
import { SpotifyError } from "../core/utils/errors.ts";

export const artistTrendsTool: SpotifyToolDefinition = {
  name: "analyzeArtistTrends",
  schema: {
    artistId: z.string().describe("Spotify artist ID")
  },
  handler: (deps: ToolDependencies) => async ({ artistId }: { artistId: string }) => {
    try {
      const [artist, relatedArtists] = await Promise.all([
        deps.searchService.getArtist(artistId),
        deps.searchService.getRelatedArtists(artistId)
      ]);
      
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            success: true,
            artist: {
              id: artist.id,
              name: artist.name,
              popularity: artist.popularity,
              followers: artist.followers.total,
              genres: artist.genres,
              images: artist.images
            },
            relatedArtists: relatedArtists.map((ra: any) => ({
              id: ra.id,
              name: ra.name,
              popularity: ra.popularity,
              followers: ra.followers.total,
              genres: ra.genres
            })),
            analysis: {
              genreTrends: analyzeGenreTrends(artist.genres, relatedArtists),
              popularityContext: analyzePopularityContext(artist, relatedArtists),
              followerContext: analyzeFollowerContext(artist, relatedArtists)
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
              statusCode: error.statusCode,
              note: "Related artists endpoint may not be available for all artists"
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

// Helper functions that were in the class
function analyzeGenreTrends(artistGenres: string[], relatedArtists: any[]) {
  const genreCounts = new Map<string, number>();
  
  // Count genres from related artists
  relatedArtists.forEach(artist => {
    artist.genres?.forEach((genre: string) => {
      genreCounts.set(genre, (genreCounts.get(genre) || 0) + 1);
    });
  });
  
  // Convert to sorted array
  const sortedGenres = Array.from(genreCounts.entries())
    .sort(([,a], [,b]) => b - a)
    .map(([genre, count]) => ({ genre, count, percentage: (count / relatedArtists.length) * 100 }));
  
  return {
    artistGenres,
    commonGenresInNetwork: sortedGenres.slice(0, 10),
    genreOverlap: artistGenres.filter(genre => genreCounts.has(genre))
  };
}

function analyzePopularityContext(artist: any, relatedArtists: any[]) {
  const popularities = relatedArtists.map(ra => ra.popularity).filter(p => p !== undefined);
  const avgPopularity = popularities.length > 0 ? popularities.reduce((sum, p) => sum + p, 0) / popularities.length : 0;
  
  return {
    artistPopularity: artist.popularity,
    networkAveragePopularity: Math.round(avgPopularity),
    percentileInNetwork: calculatePercentile(artist.popularity, popularities),
    isAboveNetworkAverage: artist.popularity > avgPopularity
  };
}

function analyzeFollowerContext(artist: any, relatedArtists: any[]) {
  const followerCounts = relatedArtists.map(ra => ra.followers.total).filter(f => f !== undefined);
  const avgFollowers = followerCounts.length > 0 ? followerCounts.reduce((sum, f) => sum + f, 0) / followerCounts.length : 0;
  
  return {
    artistFollowers: artist.followers.total,
    networkAverageFollowers: Math.round(avgFollowers),
    percentileInNetwork: calculatePercentile(artist.followers.total, followerCounts),
    isAboveNetworkAverage: artist.followers.total > avgFollowers
  };
}

function calculatePercentile(value: number, array: number[]): number {
  if (array.length === 0) return 0;
  const sorted = [...array].sort((a, b) => a - b);
  const rank = sorted.filter(v => v <= value).length;
  return Math.round((rank / sorted.length) * 100);
}