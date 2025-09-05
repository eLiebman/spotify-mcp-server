import { jest } from '@jest/globals';
import { artistPopularityTool } from '../tools/artist-popularity';
import { SpotifyError, SpotifyErrorCode } from '../core/utils/errors';

const createMockDeps = (): any => ({
  searchService: { makeRequest: jest.fn() }
});

describe('artistPopularityTool', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should get artist popularity successfully', async () => {
    const deps = createMockDeps();
    deps.searchService.makeRequest.mockResolvedValue({
      id: 'artist1',
      name: 'Test Artist',
      popularity: 90,
      followers: { total: 5000000 },
      genres: ['pop', 'dance'],
      external_urls: { spotify: 'https://open.spotify.com/artist/artist1' },
      images: []
    });

    const handler = artistPopularityTool.handler(deps);
    const result = await handler({ artistId: 'artist1' });

    expect(deps.searchService.makeRequest).toHaveBeenCalledWith('/artists/artist1');
    expect(JSON.parse(result.content[0].text).success).toBe(true);
    expect(JSON.parse(result.content[0].text).data.popularity).toBe(90);
    expect(JSON.parse(result.content[0].text).data.followers).toBe(5000000);
  });

  it('should handle artist not found', async () => {
    const deps = createMockDeps();
    deps.searchService.makeRequest.mockRejectedValue(
      new SpotifyError(SpotifyErrorCode.NotFoundError, 'Artist not found', 404)
    );

    const handler = artistPopularityTool.handler(deps);
    const result = await handler({ artistId: 'invalid' });

    expect(JSON.parse(result.content[0].text).success).toBe(false);
    expect(JSON.parse(result.content[0].text).error).toBe('Artist not found');
  });
});
