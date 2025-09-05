import { jest } from '@jest/globals';
import { authenticateSimpleTool } from '../tools/authenticate-simple';
import { SpotifyError, SpotifyErrorCode } from '../core/utils/errors';

const createMockDeps = (): any => ({
  authService: {
    authenticateClientCredentials: jest.fn<() => Promise<any>>(),
    isAuthenticated: jest.fn<() => boolean>()
  }
});

describe('authenticateSimpleTool', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should have correct name and schema', () => {
    expect(authenticateSimpleTool.name).toBe('authenticateSimple');
    expect(authenticateSimpleTool.schema).toEqual({});
  });

  it('should authenticate successfully with client credentials', async () => {
    const deps = createMockDeps();
    deps.authService.authenticateClientCredentials.mockResolvedValue(undefined);
    deps.authService.isAuthenticated.mockReturnValue(true);

    const handler = authenticateSimpleTool.handler(deps);
    const result = await (handler as () => Promise<any>)();

    expect(deps.authService.authenticateClientCredentials).toHaveBeenCalled();
    expect(JSON.parse(result.content[0].text).success).toBe(true);
    expect(JSON.parse(result.content[0].text).message).toBe('Successfully authenticated using client credentials!');
    expect(JSON.parse(result.content[0].text).isAuthenticated).toBe(true);
  });

  it('should handle authentication error', async () => {
    const deps = createMockDeps();
    deps.authService.authenticateClientCredentials.mockRejectedValue(
      new SpotifyError(SpotifyErrorCode.AuthenticationError, 'Invalid client credentials')
    );

    const handler = authenticateSimpleTool.handler(deps);
    const result = await (handler as () => Promise<any>)();

    expect(JSON.parse(result.content[0].text).success).toBe(false);
    expect(JSON.parse(result.content[0].text).error).toBe('Invalid client credentials');
  });
});
