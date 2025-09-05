import { jest } from '@jest/globals';
import { trackPopularityTool } from '../tools/track-popularity';
import { SpotifyError, SpotifyErrorCode } from '../core/utils/errors';

const createMockDeps = (): any => ({
  trackService: { getTrackPopularity: jest.fn() }
});

describe('trackPopularityTool', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should get track popularity successfully', async () => {
    const deps = createMockDeps();
    deps.trackService.getTrackPopularity.mockResolvedValue({
      trackId: 'track1',
      name: 'Test Track',
      artists: ['Test Artist'],
      popularity: 85,
      releaseDate: '2024-01-01'
    });

    const handler = trackPopularityTool.handler(deps);
    const result = await handler({ trackId: 'track1' });

    expect(deps.trackService.getTrackPopularity).toHaveBeenCalledWith('track1');
    expect(JSON.parse(result.content[0].text).success).toBe(true);
    expect(JSON.parse(result.content[0].text).data.popularity).toBe(85);
  });

  it('should handle track not found', async () => {
    const deps = createMockDeps();
    deps.trackService.getTrackPopularity.mockRejectedValue(
      new SpotifyError(SpotifyErrorCode.NotFoundError, 'Track not found', 404)
    );

    const handler = trackPopularityTool.handler(deps);
    const result = await handler({ trackId: 'invalid' });

    expect(JSON.parse(result.content[0].text).success).toBe(false);
    expect(JSON.parse(result.content[0].text).error).toBe('Track not found');
    expect(JSON.parse(result.content[0].text).statusCode).toBe(404);
  });
});
