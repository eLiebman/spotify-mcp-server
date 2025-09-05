import { jest } from '@jest/globals';
import { searchArtistAlbumsTool } from '../tools/search-artist-albums';
import { SpotifyError, SpotifyErrorCode } from '../core/utils/errors';

const createMockDeps = (): any => ({
  searchService: { makeRequest: jest.fn() }
});

describe('searchArtistAlbumsTool', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should find artist albums successfully', async () => {
    const deps = createMockDeps();
    deps.searchService.makeRequest
      .mockResolvedValueOnce({
        artists: {
          items: [{
            id: 'artist1',
            name: 'Test Artist',
            popularity: 80,
            followers: { total: 1000000 },
            genres: ['pop']
          }]
        }
      })
      .mockResolvedValueOnce({
        items: [{
          id: 'album1',
          name: 'Test Album',
          release_date: '2024-01-01',
          total_tracks: 12,
          album_type: 'album',
          external_urls: { spotify: 'https://open.spotify.com/album/album1' },
          images: []
        }]
      });

    const handler = searchArtistAlbumsTool.handler(deps);
    const result = await handler({ artistName: 'Test Artist' });

    expect(JSON.parse(result.content[0].text).success).toBe(true);
    expect(JSON.parse(result.content[0].text).artist.name).toBe('Test Artist');
    expect(JSON.parse(result.content[0].text).albums).toHaveLength(1);
  });

  it('should handle artist not found', async () => {
    const deps = createMockDeps();
    deps.searchService.makeRequest.mockResolvedValue({
      artists: { items: [] }
    });

    const handler = searchArtistAlbumsTool.handler(deps);
    const result = await handler({ artistName: 'Unknown Artist' });

    expect(JSON.parse(result.content[0].text).success).toBe(false);
    expect(JSON.parse(result.content[0].text).error).toContain('not found');
  });
});
