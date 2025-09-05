import { jest } from '@jest/globals';
import { exploreArtistMetricsTool } from '../tools/explore-artist-metrics';
import { SpotifyError, SpotifyErrorCode } from '../core/utils/errors';

const createMockDeps = (): any => ({
  searchService: { makeRequest: jest.fn() }
});

describe('exploreArtistMetricsTool', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should explore artist metrics successfully', async () => {
    const deps = createMockDeps();
    deps.searchService.makeRequest
      .mockResolvedValueOnce({
        id: 'artist1',
        name: 'Test Artist',
        popularity: 85,
        followers: { total: 2000000 },
        genres: ['pop']
      })
      .mockResolvedValue({
        tracks: [{
          id: 'track1',
          name: 'Popular Track',
          popularity: 90,
          album: { name: 'Test Album' }
        }]
      });

    const handler = exploreArtistMetricsTool.handler(deps);
    const result = await handler({ artistId: 'artist1', countries: ['US', 'GB'] });

    expect(JSON.parse(result.content[0].text).success).toBe(true);
    expect(JSON.parse(result.content[0].text).data.artist.name).toBe('Test Artist');
    expect(JSON.parse(result.content[0].text).data.countryAnalysis.countries).toEqual(['US', 'GB']);
  });

  it('should handle artist not found', async () => {
    const deps = createMockDeps();
    deps.searchService.makeRequest.mockRejectedValue(
      new SpotifyError(SpotifyErrorCode.NotFoundError, 'Artist not found', 404)
    );

    const handler = exploreArtistMetricsTool.handler(deps);
    const result = await handler({ artistId: 'invalid' });

    expect(JSON.parse(result.content[0].text).success).toBe(false);
    expect(JSON.parse(result.content[0].text).error).toBe('Artist not found');
  });
});
