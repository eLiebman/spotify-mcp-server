/**
 * Genre Analysis Utilities
 * Functions for analyzing and classifying music genres
 */

export class GenreAnalyzer {

  /**
   * Generate comprehensive genre recommendations
   */
  static generateGenreRecommendations(analysis: any): any {
    const recommendations: any = {
      primaryGenres: [],
      secondaryGenres: [],
      confidenceLevel: 'low',
      reasoning: []
    };

    // Start with official Spotify genres (highest confidence)
    if (analysis.artistGenres && analysis.artistGenres.length > 0) {
      recommendations.primaryGenres = [...analysis.artistGenres];
      recommendations.confidenceLevel = 'high';
      recommendations.reasoning.push('Based on official Spotify genre tags');
    }

    // Add related artist genres (medium confidence)
    if (analysis.relatedArtists?.suggestedGenres?.length > 0) {
      const relatedGenres = analysis.relatedArtists.suggestedGenres.filter(
        (genre: string) => !recommendations.primaryGenres.includes(genre)
      );
      recommendations.secondaryGenres.push(...relatedGenres.slice(0, 3));
      if (recommendations.confidenceLevel === 'low') {
        recommendations.confidenceLevel = 'medium';
      }
      recommendations.reasoning.push('Inferred from related artists analysis');
    }

    // Add playlist-based genre patterns (lower confidence)
    if (analysis.playlistAnalysis?.genrePatterns) {
      const playlistGenres = Object.keys(analysis.playlistAnalysis.genrePatterns)
        .filter(genre => !recommendations.primaryGenres.includes(genre) && 
                        !recommendations.secondaryGenres.includes(genre))
        .slice(0, 2);
      recommendations.secondaryGenres.push(...playlistGenres);
      if (recommendations.confidenceLevel === 'low') {
        recommendations.confidenceLevel = 'medium';
      }
      recommendations.reasoning.push('Derived from playlist co-appearance patterns');
    }


    // Adjust confidence based on data sources
    const totalSources = recommendations.reasoning.length;
    if (totalSources >= 3) {
      recommendations.confidenceLevel = 'high';
    } else if (totalSources >= 2) {
      recommendations.confidenceLevel = 'medium';
    }

    return recommendations;
  }

  /**
   * Extract common genres from a list of artists
   */
  static extractCommonGenres(artists: any[]): string[] {
    const genreCount: { [genre: string]: number } = {};
    
    artists.forEach(artist => {
      if (artist.genres) {
        artist.genres.forEach((genre: string) => {
          genreCount[genre] = (genreCount[genre] || 0) + 1;
        });
      }
    });
    
    // Return genres that appear in at least 30% of artists, sorted by frequency
    const threshold = Math.max(1, Math.ceil(artists.length * 0.3));
    return Object.entries(genreCount)
      .filter(([, count]) => count >= threshold)
      .sort(([, a], [, b]) => b - a)
      .map(([genre]) => genre);
  }
}
