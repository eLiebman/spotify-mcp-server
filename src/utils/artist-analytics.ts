/**
 * Artist Analytics Utilities
 * Functions for analyzing artist trends, release patterns, and popularity metrics
 */

export class ArtistAnalytics {
  /**
   * Calculate average days between releases
   */
  static calculateAverageReleaseDays(releases: any[]): number {
    if (releases.length < 2) return 0;
    
    const releaseDates = releases
      .map(r => new Date(r.release_date))
      .sort((a, b) => a.getTime() - b.getTime());
    
    let totalDays = 0;
    for (let i = 1; i < releaseDates.length; i++) {
      const daysDiff = (releaseDates[i].getTime() - releaseDates[i-1].getTime()) / (1000 * 60 * 60 * 24);
      totalDays += daysDiff;
    }
    
    return Math.round(totalDays / (releaseDates.length - 1));
  }

  /**
   * Analyze popularity trends by track age
   */
  static analyzePopularityByAge(tracks: any[]): any {
    const now = new Date();
    const ageGroups = {
      recent: [] as number[], // < 6 months
      medium: [] as number[], // 6 months - 2 years  
      older: [] as number[]   // > 2 years
    };
    
    tracks.forEach(track => {
      const releaseDate = new Date(track.album?.release_date || track.release_date);
      const monthsOld = (now.getTime() - releaseDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
      
      if (monthsOld < 6) {
        ageGroups.recent.push(track.popularity);
      } else if (monthsOld < 24) {
        ageGroups.medium.push(track.popularity);
      } else {
        ageGroups.older.push(track.popularity);
      }
    });
    
    const average = (arr: number[]) => arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
    
    return {
      recent: {
        count: ageGroups.recent.length,
        averagePopularity: Math.round(average(ageGroups.recent))
      },
      medium: {
        count: ageGroups.medium.length,
        averagePopularity: Math.round(average(ageGroups.medium))
      },
      older: {
        count: ageGroups.older.length,
        averagePopularity: Math.round(average(ageGroups.older))
      },
      trend: this.determineTrend(ageGroups)
    };
  }

  /**
   * Calculate consistency score based on popularity variance
   */
  static calculateConsistencyScore(tracks: any[]): number {
    if (tracks.length < 2) return 0;
    
    const popularities = tracks.map(t => t.popularity);
    const mean = popularities.reduce((a, b) => a + b, 0) / popularities.length;
    const variance = popularities.reduce((sum, pop) => sum + Math.pow(pop - mean, 2), 0) / popularities.length;
    const standardDeviation = Math.sqrt(variance);
    
    // Convert to 0-100 scale (lower std dev = higher consistency)
    return Math.max(0, Math.round(100 - (standardDeviation * 2)));
  }

  /**
   * Estimate growth trend based on recent vs older releases
   */
  static estimateGrowthTrend(tracks: any[]): string {
    const analysis = this.analyzePopularityByAge(tracks);
    
    if (analysis.recent.count === 0) return 'insufficient_recent_data';
    if (analysis.older.count === 0) return 'new_artist';
    
    const recentAvg = analysis.recent.averagePopularity;
    const olderAvg = analysis.older.averagePopularity;
    const difference = recentAvg - olderAvg;
    
    if (difference > 10) return 'growing';
    if (difference < -10) return 'declining';
    return 'stable';
  }

  /**
   * Estimate next release timeframe based on release patterns
   */
  static estimateNextRelease(releases: any[]): string {
    const avgDays = this.calculateAverageReleaseDays(releases);
    
    if (avgDays === 0) return 'insufficient_data';
    if (avgDays < 90) return 'very_frequent'; // < 3 months
    if (avgDays < 180) return 'frequent';     // 3-6 months
    if (avgDays < 365) return 'regular';      // 6-12 months
    if (avgDays < 730) return 'yearly';       // 1-2 years
    return 'infrequent'; // > 2 years
  }

  /**
   * Generate strategic recommendations based on analysis
   */
  static generateStrategy(indicators: any): string {
    const strategies = [];
    
    if (indicators.trend === 'growing') {
      strategies.push('Capitalize on upward momentum with increased promotion');
    } else if (indicators.trend === 'declining') {
      strategies.push('Focus on re-engagement and refreshing artistic direction');
    }
    
    if (indicators.consistency < 50) {
      strategies.push('Work on maintaining quality consistency across releases');
    }
    
    if (indicators.releaseFrequency === 'infrequent') {
      strategies.push('Consider increasing release frequency to maintain audience engagement');
    } else if (indicators.releaseFrequency === 'very_frequent') {
      strategies.push('Quality over quantity - ensure each release meets high standards');
    }
    
    return strategies.join('. ') || 'Continue current strategy and monitor trends';
  }

  /**
   * Helper method to determine trend from age groups
   */
  private static determineTrend(ageGroups: any): string {
    const average = (arr: number[]) => arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
    
    const recentAvg = average(ageGroups.recent);
    const olderAvg = average(ageGroups.older);
    
    if (ageGroups.recent.length === 0) return 'no_recent_releases';
    if (ageGroups.older.length === 0) return 'new_artist_profile';
    
    const difference = recentAvg - olderAvg;
    if (difference > 10) return 'improving';
    if (difference < -10) return 'declining';
    return 'stable';
  }
}
