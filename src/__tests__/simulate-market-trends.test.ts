import { jest } from '@jest/globals';
import { simulateMarketTrendsTool } from '../tools/simulate-market-trends';
import { SpotifyError, SpotifyErrorCode } from '../core/utils/errors';

const createMockDeps = (): any => ({
  searchService: { makeRequest: jest.fn() }
});

describe('simulateMarketTrendsTool', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should simulate market trends successfully', async () => {
    const deps = createMockDeps();
    deps.searchService.makeRequest
      .mockResolvedValueOnce({
        id: 'artist1',
        name: 'Test Artist',
        popularity: 85,
        followers: { total: 2000000 },
        genres: ['pop']
      })
      .mockResolvedValueOnce({
        items: [{
          id: 'album1',
          name: 'Recent Album',
          release_date: '2024-01-01',
          album_type: 'album',
          total_tracks: 12
        }]
      })
      .mockResolvedValueOnce({
        tracks: [{
          id: 'track1',
          name: 'Hit Track',
          popularity: 90
        }]
      });

    const handler = simulateMarketTrendsTool.handler(deps);
    const result = await handler({ artistId: 'artist1', timeframe: 'recent' });

    expect(JSON.parse(result.content[0].text).success).toBe(true);
    expect(JSON.parse(result.content[0].text).artist.name).toBe('Test Artist');
    expect(JSON.parse(result.content[0].text).releaseAnalysis).toBeDefined();
    expect(JSON.parse(result.content[0].text).simulatedTrends).toBeDefined();
  });

  it('should handle different timeframes', async () => {
    const deps = createMockDeps();
    deps.searchService.makeRequest
      .mockResolvedValueOnce({
        id: 'artist1',
        name: 'Test Artist',
        popularity: 85
      })
      .mockResolvedValueOnce({ items: [] })
      .mockResolvedValueOnce({ tracks: [] });

    const handler = simulateMarketTrendsTool.handler(deps);
    const result = await handler({ artistId: 'artist1', timeframe: 'career' });

    expect(JSON.parse(result.content[0].text).success).toBe(true);
  });

  it('should handle artist not found', async () => {
    const deps = createMockDeps();
    deps.searchService.makeRequest.mockRejectedValue(
      new SpotifyError(SpotifyErrorCode.NotFoundError, 'Artist not found', 404)
    );

    const handler = simulateMarketTrendsTool.handler(deps);
    const result = await handler({ artistId: 'invalid' });

    expect(JSON.parse(result.content[0].text).success).toBe(false);
    expect(JSON.parse(result.content[0].text).error).toBe('Artist not found');
  });
});
