import { z } from "zod";
import type { SpotifyToolDefinition, ToolDependencies } from "../core/types/tools.ts";
import { SpotifyError } from "../core/utils/errors.ts";
import { GenreAnalyzer } from "../utils/genre-analyzer.ts";

export const exploreArtistMetricsTool: SpotifyToolDefinition = {
  name: "exploreArtistMetrics",
  schema: {
    artistId: z.string().describe("Spotify artist ID"),
    countries: z.array(z.string()).optional().describe("Country codes to analyze (e.g., ['US', 'GB', 'DE'])"),
    includeRelated: z.boolean().optional().describe("Include related artists analysis (default: true)")
  },
  handler: (deps: ToolDependencies) => async ({ 
    artistId, 
    countries = ['US', 'GB', 'DE', 'FR', 'ES', 'IT', 'CA', 'AU'], 
    includeRelated = true 
  }: { 
    artistId: string; 
    countries?: string[]; 
    includeRelated?: boolean; 
  }) => {
    try {
      // Get base artist info
      const artist = await deps.searchService.makeRequest<any>(`/artists/${artistId}`);
      
      // Get top tracks for each country
      const countryTopTracks: any = {};
      for (const country of countries) {
        try {
          const topTracks = await deps.searchService.makeRequest<any>(
            `/artists/${artistId}/top-tracks?market=${country}`
          );
          
          countryTopTracks[country] = {
            tracks: topTracks.tracks?.slice(0, 5).map((track: any) => ({
              id: track.id,
              name: track.name,
              popularity: track.popularity,
              album: track.album.name
            })) || [],
            topTrack: topTracks.tracks?.[0] ? {
              name: topTracks.tracks[0].name,
              popularity: topTracks.tracks[0].popularity
            } : null
          };
        } catch (error) {
          countryTopTracks[country] = {
            error: `Could not fetch data for ${country}`,
            tracks: []
          };
        }
      }
      
      // Analyze cross-country patterns
      const crossCountryAnalysis = analyzeCrossCountryPatterns(countryTopTracks);
      
      // Get related artists if requested
      let relatedArtistsAnalysis = null;
      if (includeRelated) {
        try {
          const relatedArtists = await deps.searchService.makeRequest<any>(`/artists/${artistId}/related-artists`);
          const suggestedGenres = GenreAnalyzer.extractCommonGenres(relatedArtists.artists || []);
          relatedArtistsAnalysis = {
            count: relatedArtists.artists?.length || 0,
            suggestedGenres: suggestedGenres,
            artists: (relatedArtists.artists || []).slice(0, 10).map((artist: any) => ({
              name: artist.name,
              popularity: artist.popularity,
              genres: artist.genres
            }))
          };
        } catch (error) {
          relatedArtistsAnalysis = {
            error: "Could not fetch related artists data",
            note: "This endpoint may not be available for all artists"
          };
        }
      }
      
      // Compile comprehensive metrics
      const metrics = {
        artist: {
          id: artist.id,
          name: artist.name,
          popularity: artist.popularity,
          followers: artist.followers?.total || 0,
          genres: artist.genres || []
        },
        countryAnalysis: {
          countries: countries,
          topTracksByCountry: countryTopTracks,
          crossCountryPatterns: crossCountryAnalysis
        },
        relatedArtistsAnalysis: relatedArtistsAnalysis,
        limitations: {
          note: "Spotify API does not provide historical streaming data or detailed country-specific metrics",
          availableData: "Top tracks by market, popularity scores, and related artists only",
          recommendation: "For detailed streaming analytics, consider Spotify for Artists or other analytics platforms"
        }
      };
      
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            success: true,
            data: metrics
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

function analyzeCrossCountryPatterns(countryData: any) {
  const countries = Object.keys(countryData);
  const trackPopularity: { [trackName: string]: { countries: string[], avgPopularity: number } } = {};
  
  // Collect track popularity across countries
  countries.forEach(country => {
    const countryTracks = countryData[country].tracks || [];
    countryTracks.forEach((track: any) => {
      if (!trackPopularity[track.name]) {
        trackPopularity[track.name] = { countries: [], avgPopularity: 0 };
      }
      trackPopularity[track.name].countries.push(country);
      trackPopularity[track.name].avgPopularity += track.popularity;
    });
  });
  
  // Calculate averages and find global hits
  const globalTracks = Object.entries(trackPopularity)
    .map(([name, data]) => ({
      name,
      countriesCount: data.countries.length,
      avgPopularity: data.avgPopularity / data.countries.length,
      countries: data.countries
    }))
    .sort((a, b) => b.countriesCount - a.countriesCount || b.avgPopularity - a.avgPopularity);
  
  return {
    globalHits: globalTracks.filter(t => t.countriesCount >= Math.ceil(countries.length * 0.6)),
    regionalHits: globalTracks.filter(t => t.countriesCount < Math.ceil(countries.length * 0.6) && t.countriesCount > 1),
    localHits: globalTracks.filter(t => t.countriesCount === 1),
    mostPopularGlobally: globalTracks[0] || null
  };
}