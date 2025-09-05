import { jest } from '@jest/globals';
import { userProfileTool } from '../tools/user-profile';
import { SpotifyError, SpotifyErrorCode } from '../core/utils/errors';

const createMockDeps = (): any => ({
  apiService: { getCurrentUser: jest.fn() }
});

describe('userProfileTool', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should get user profile successfully', async () => {
    const deps = createMockDeps();
    deps.apiService.getCurrentUser.mockResolvedValue({
      id: 'user123',
      display_name: 'Test User',
      email: 'test@example.com',
      country: 'US',
      followers: { total: 100 },
      product: 'premium',
      external_urls: { spotify: 'https://open.spotify.com/user/user123' }
    });

    const handler = userProfileTool.handler(deps);
    const result = await handler();

    expect(deps.apiService.getCurrentUser).toHaveBeenCalled();
    expect(JSON.parse(result.content[0].text).success).toBe(true);
    expect(JSON.parse(result.content[0].text).user.displayName).toBe('Test User');
  });

  it('should handle unauthorized access', async () => {
    const deps = createMockDeps();
    deps.apiService.getCurrentUser.mockRejectedValue(
      new SpotifyError(SpotifyErrorCode.AuthenticationError, 'Unauthorized', 401)
    );

    const handler = userProfileTool.handler(deps);
    const result = await handler();

    expect(JSON.parse(result.content[0].text).success).toBe(false);
    expect(JSON.parse(result.content[0].text).error).toBe('Unauthorized');
  });
});
