import { jest } from '@jest/globals';
import { searchTracksTool } from '../tools/search-tracks';
import { SpotifyError, SpotifyErrorCode } from '../core/utils/errors';

const createMockDeps = (): any => ({
  searchService: { makeRequest: jest.fn() }
});

describe('searchTracksTool', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should search tracks successfully', async () => {
    const deps = createMockDeps();
    deps.searchService.makeRequest.mockResolvedValue({
      tracks: {
        total: 1,
        items: [{
          id: 'track1',
          name: 'Test Track',
          artists: [{ name: 'Test Artist' }],
          album: { name: 'Test Album', release_date: '2024-01-01' },
          popularity: 75,
          duration_ms: 180000,
          preview_url: null,
          external_urls: { spotify: 'https://open.spotify.com/track/track1' }
        }]
      }
    });

    const handler = searchTracksTool.handler(deps);
    const result = await handler({ query: 'test query', limit: 5 });

    expect(deps.searchService.makeRequest).toHaveBeenCalledWith('/search?q=test%20query&type=track&limit=5');
    expect(JSON.parse(result.content[0].text).success).toBe(true);
    expect(JSON.parse(result.content[0].text).tracks).toHaveLength(1);
  });

  it('should handle search errors', async () => {
    const deps = createMockDeps();
    deps.searchService.makeRequest.mockRejectedValue(
      new SpotifyError(SpotifyErrorCode.NotFoundError, 'Not found', 404)
    );

    const handler = searchTracksTool.handler(deps);
    const result = await handler({ query: 'test query' });

    expect(JSON.parse(result.content[0].text).success).toBe(false);
    expect(JSON.parse(result.content[0].text).error).toBe('Not found');
  });
});
