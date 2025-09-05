import { jest } from '@jest/globals';
import { analyzeSingleTool } from '../tools/analyze-single';
import { SpotifyError, SpotifyErrorCode } from '../core/utils/errors';

const createMockDeps = (): any => ({
  searchService: { makeRequest: jest.fn() }
});

describe('analyzeSingleTool', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should analyze single track successfully', async () => {
    const deps = createMockDeps();
    deps.searchService.makeRequest
      .mockResolvedValueOnce({
        id: 'track1',
        name: 'Test Track',
        artists: [{ name: 'Test Artist' }],
        popularity: 85,
        duration_ms: 180000,
        explicit: false,
        album: { id: 'album1', release_date: '2024-01-01' },
        external_urls: { spotify: 'https://open.spotify.com/track/track1' }
      })
      .mockResolvedValueOnce({
        id: 'album1',
        name: 'Test Album',
        artists: [{ name: 'Test Artist' }],
        popularity: 80,
        release_date: '2024-01-01',
        total_tracks: 3,
        album_type: 'album',
        external_urls: { spotify: 'https://open.spotify.com/album/album1' },
        images: []
      });

    const handler = analyzeSingleTool.handler(deps);
    const result = await handler({ trackId: 'track1' });

    expect(JSON.parse(result.content[0].text).success).toBe(true);
    expect(JSON.parse(result.content[0].text).data.track.name).toBe('Test Track');
    expect(JSON.parse(result.content[0].text).data.analysis.trackVsAlbumPopularity.trackIsMorePopular).toBe(true);
  });

  it('should analyze with album tracks when requested', async () => {
    const deps = createMockDeps();
    deps.searchService.makeRequest
      .mockResolvedValueOnce({
        id: 'track1',
        name: 'Test Track',
        artists: [{ name: 'Test Artist' }],
        popularity: 85,
        album: { id: 'album1' }
      })
      .mockResolvedValueOnce({
        id: 'album1',
        name: 'Test Album',
        total_tracks: 2
      })
      .mockResolvedValueOnce({
        items: [{ id: 'track1' }, { id: 'track2' }]
      })
      .mockResolvedValueOnce({
        tracks: [
          { id: 'track1', popularity: 85, track_number: 1, duration_ms: 180000 },
          { id: 'track2', popularity: 75, track_number: 2, duration_ms: 200000 }
        ]
      });

    const handler = analyzeSingleTool.handler(deps);
    const result = await handler({ trackId: 'track1', includeAlbumTracks: true });

    expect(JSON.parse(result.content[0].text).success).toBe(true);
    expect(JSON.parse(result.content[0].text).data.albumTracksAnalysis).toBeDefined();
  });

  it('should handle track not found', async () => {
    const deps = createMockDeps();
    deps.searchService.makeRequest.mockRejectedValue(
      new SpotifyError(SpotifyErrorCode.NotFoundError, 'Track not found', 404)
    );

    const handler = analyzeSingleTool.handler(deps);
    const result = await handler({ trackId: 'invalid' });

    expect(JSON.parse(result.content[0].text).success).toBe(false);
    expect(JSON.parse(result.content[0].text).error).toBe('Track not found');
  });
});
