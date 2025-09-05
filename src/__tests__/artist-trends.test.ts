import { jest } from '@jest/globals';
import { artistTrendsTool } from '../tools/artist-trends';
import { SpotifyError, SpotifyErrorCode } from '../core/utils/errors';

const createMockDeps = (): any => ({
  searchService: {
    getArtist: jest.fn(),
    getRelatedArtists: jest.fn()
  }
});

describe('artistTrendsTool', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should analyze artist trends successfully', async () => {
    const deps = createMockDeps();
    deps.searchService.getArtist.mockResolvedValue({
      id: 'artist1',
      name: 'Test Artist',
      popularity: 85,
      followers: { total: 2000000 },
      genres: ['pop', 'dance'],
      images: []
    });

    deps.searchService.getRelatedArtists.mockResolvedValue([
      {
        id: 'related1',
        name: 'Related Artist 1',
        popularity: 80,
        followers: { total: 1500000 },
        genres: ['pop']
      },
      {
        id: 'related2',
        name: 'Related Artist 2',
        popularity: 75,
        followers: { total: 1000000 },
        genres: ['dance', 'electronic']
      }
    ]);

    const handler = artistTrendsTool.handler(deps);
    const result = await handler({ artistId: 'artist1' });

    expect(deps.searchService.getArtist).toHaveBeenCalledWith('artist1');
    expect(deps.searchService.getRelatedArtists).toHaveBeenCalledWith('artist1');
    expect(JSON.parse(result.content[0].text).success).toBe(true);
    expect(JSON.parse(result.content[0].text).artist.name).toBe('Test Artist');
    expect(JSON.parse(result.content[0].text).relatedArtists).toHaveLength(2);
  });

  it('should handle related artists endpoint error', async () => {
    const deps = createMockDeps();
    deps.searchService.getArtist.mockResolvedValue({
      id: 'artist1',
      name: 'Test Artist'
    });
    deps.searchService.getRelatedArtists.mockRejectedValue(
      new SpotifyError(SpotifyErrorCode.NotFoundError, 'Not Found', 404)
    );

    const handler = artistTrendsTool.handler(deps);
    const result = await handler({ artistId: 'artist1' });

    expect(JSON.parse(result.content[0].text).success).toBe(false);
    expect(JSON.parse(result.content[0].text).statusCode).toBe(404);
    expect(JSON.parse(result.content[0].text).note).toContain('Related artists endpoint');
  });
});
