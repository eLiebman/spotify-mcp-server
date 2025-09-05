import { jest } from '@jest/globals';
import { searchPlaylistsTool } from '../tools/search-playlists';
import { SpotifyError, SpotifyErrorCode } from '../core/utils/errors';

const createMockDeps = (): any => ({
  searchService: { searchPlaylistsByTrack: jest.fn() }
});

describe('searchPlaylistsTool', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should find playlists by track', async () => {
    const deps = createMockDeps();
    deps.searchService.searchPlaylistsByTrack.mockResolvedValue([{
      id: 'playlist1',
      name: 'Test Playlist',
      description: 'A test playlist',
      owner: { display_name: 'Test User' },
      public: true,
      collaborative: false,
      tracks: { total: 50 },
      external_urls: { spotify: 'https://open.spotify.com/playlist/playlist1' },
      images: []
    }]);

    const handler = searchPlaylistsTool.handler(deps);
    const result = await handler({ trackName: 'Test Track', artistName: 'Test Artist' });

    expect(deps.searchService.searchPlaylistsByTrack).toHaveBeenCalledWith('Test Track', 'Test Artist', 20);
    expect(JSON.parse(result.content[0].text).success).toBe(true);
    expect(JSON.parse(result.content[0].text).foundPlaylists).toBe(1);
  });

  it('should handle playlist search errors', async () => {
    const deps = createMockDeps();
    deps.searchService.searchPlaylistsByTrack.mockRejectedValue(new Error('Search failed'));

    const handler = searchPlaylistsTool.handler(deps);
    const result = await handler({ trackName: 'Test Track', artistName: 'Test Artist' });

    expect(JSON.parse(result.content[0].text).success).toBe(false);
    expect(JSON.parse(result.content[0].text).error).toBe('Search failed');
  });
});
