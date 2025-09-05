import { jest } from '@jest/globals';
import { albumTracksTool } from '../tools/album-tracks';
import { SpotifyError, SpotifyErrorCode } from '../core/utils/errors';

const createMockDeps = (): any => ({
  searchService: { makeRequest: jest.fn() }
});

describe('albumTracksTool', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should get album tracks successfully', async () => {
    const deps = createMockDeps();
    deps.searchService.makeRequest
      .mockResolvedValueOnce({
        id: 'album1',
        name: 'Test Album',
        artists: [{ name: 'Test Artist' }],
        release_date: '2024-01-01',
        total_tracks: 2,
        album_type: 'album',
        external_urls: { spotify: 'https://open.spotify.com/album/album1' },
        images: []
      })
      .mockResolvedValueOnce({
        items: [
          { id: 'track1', name: 'Track 1' },
          { id: 'track2', name: 'Track 2' }
        ]
      })
      .mockResolvedValueOnce({
        tracks: [
          {
            id: 'track1',
            name: 'Track 1',
            track_number: 1,
            disc_number: 1,
            duration_ms: 180000,
            explicit: false,
            popularity: 75,
            preview_url: null,
            external_urls: { spotify: 'https://open.spotify.com/track/track1' }
          },
          {
            id: 'track2',
            name: 'Track 2',
            track_number: 2,
            disc_number: 1,
            duration_ms: 200000,
            explicit: false,
            popularity: 80,
            preview_url: null,
            external_urls: { spotify: 'https://open.spotify.com/track/track2' }
          }
        ]
      });

    const handler = albumTracksTool.handler(deps);
    const result = await handler({ albumId: 'album1' });

    expect(JSON.parse(result.content[0].text).success).toBe(true);
    expect(JSON.parse(result.content[0].text).tracks).toHaveLength(2);
    expect(JSON.parse(result.content[0].text).album.name).toBe('Test Album');
  });

  it('should handle album not found', async () => {
    const deps = createMockDeps();
    deps.searchService.makeRequest.mockRejectedValue(
      new SpotifyError(SpotifyErrorCode.NotFoundError, 'Album not found', 404)
    );

    const handler = albumTracksTool.handler(deps);
    const result = await handler({ albumId: 'invalid' });

    expect(JSON.parse(result.content[0].text).success).toBe(false);
    expect(JSON.parse(result.content[0].text).error).toBe('Album not found');
  });
});
