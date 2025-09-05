import { jest } from '@jest/globals';
import { genreAnalysisTool } from '../tools/genre-analysis';
import { SpotifyError, SpotifyErrorCode } from '../core/utils/errors';

const createMockDeps = (): any => ({
  searchService: { makeRequest: jest.fn() },
  playlistAnalyzer: { findPlaylistsForTrack: jest.fn() }
});

describe('genreAnalysisTool', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should analyze genre successfully', async () => {
    const deps = createMockDeps();
    deps.searchService.makeRequest
      .mockResolvedValueOnce({
        id: 'artist1',
        name: 'Test Artist',
        popularity: 80,
        followers: { total: 1000000 },
        genres: ['pop', 'dance']
      })
      .mockResolvedValueOnce({
        tracks: [
          { id: 'track1', name: 'Track 1' },
          { id: 'track2', name: 'Track 2' }
        ]
      })
      .mockRejectedValueOnce(new SpotifyError(SpotifyErrorCode.NotFoundError, 'Related artists not found', 404));

    deps.playlistAnalyzer.findPlaylistsForTrack.mockResolvedValue([]);

    const handler = genreAnalysisTool.handler(deps);
    const result = await handler({ artistId: 'artist1' });

    expect(JSON.parse(result.content[0].text).success).toBe(true);
    expect(JSON.parse(result.content[0].text).artist.genres).toEqual(['pop', 'dance']);
    expect(JSON.parse(result.content[0].text).analysis.directGenreCount).toBe(2);
  });

  it('should handle artist not found', async () => {
    const deps = createMockDeps();
    deps.searchService.makeRequest.mockRejectedValue(
      new SpotifyError(SpotifyErrorCode.NotFoundError, 'Artist not found', 404)
    );

    const handler = genreAnalysisTool.handler(deps);
    const result = await handler({ artistId: 'invalid' });

    expect(JSON.parse(result.content[0].text).success).toBe(false);
    expect(JSON.parse(result.content[0].text).error).toBe('Artist not found');
  });
});
