import { jest } from '@jest/globals';
import { albumPopularityTool } from '../tools/album-popularity';
import { SpotifyError, SpotifyErrorCode } from '../core/utils/errors';

const createMockDeps = (): any => ({
  searchService: { makeRequest: jest.fn() }
});

describe('albumPopularityTool', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should get album popularity successfully', async () => {
    const deps = createMockDeps();
    deps.searchService.makeRequest.mockResolvedValue({
      id: 'album1',
      name: 'Test Album',
      artists: [{ name: 'Test Artist' }],
      popularity: 75,
      release_date: '2024-01-01',
      total_tracks: 12,
      album_type: 'album',
      genres: ['pop'],
      label: 'Test Label',
      external_urls: { spotify: 'https://open.spotify.com/album/album1' }
    });

    const handler = albumPopularityTool.handler(deps);
    const result = await handler({ albumId: 'album1' });

    expect(deps.searchService.makeRequest).toHaveBeenCalledWith('/albums/album1');
    expect(JSON.parse(result.content[0].text).success).toBe(true);
    expect(JSON.parse(result.content[0].text).data.popularity).toBe(75);
  });

  it('should handle album not found', async () => {
    const deps = createMockDeps();
    deps.searchService.makeRequest.mockRejectedValue(
      new SpotifyError(SpotifyErrorCode.NotFoundError, 'Album not found', 404)
    );

    const handler = albumPopularityTool.handler(deps);
    const result = await handler({ albumId: 'invalid' });

    expect(JSON.parse(result.content[0].text).success).toBe(false);
    expect(JSON.parse(result.content[0].text).error).toBe('Album not found');
  });
});
