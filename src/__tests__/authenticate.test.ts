import { jest } from '@jest/globals';
import { authenticateTool } from '../tools/authenticate';
import { SpotifyError, SpotifyErrorCode } from '../core/utils/errors';

const createMockDeps = (): any => ({
  authService: {
    exchangeCodeForToken: jest.fn<(code: string, codeVerifier: string) => Promise<any>>(),
    isAuthenticated: jest.fn<() => boolean>()
  }
});

describe('authenticateTool', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should have correct name and schema', () => {
    expect(authenticateTool.name).toBe('authenticate');
    expect(authenticateTool.schema).toHaveProperty('code');
    expect(authenticateTool.schema).toHaveProperty('codeVerifier');
  });

  it('should authenticate successfully with code and verifier', async () => {
    const deps = createMockDeps();
    deps.authService.exchangeCodeForToken.mockResolvedValue(undefined);
    deps.authService.isAuthenticated.mockReturnValue(true);

    const handler = authenticateTool.handler(deps);
    const result = await (handler as (params: any) => Promise<any>)({
      code: 'auth-code',
      codeVerifier: 'code-verifier'
    });

    expect(deps.authService.exchangeCodeForToken).toHaveBeenCalledWith('auth-code', 'code-verifier');
    expect(JSON.parse(result.content[0].text).success).toBe(true);
    expect(JSON.parse(result.content[0].text).message).toBe('Successfully authenticated with Spotify!');
    expect(JSON.parse(result.content[0].text).isAuthenticated).toBe(true);
  });

  it('should handle authentication error', async () => {
    const deps = createMockDeps();
    deps.authService.exchangeCodeForToken.mockRejectedValue(
      new SpotifyError(SpotifyErrorCode.AuthenticationError, 'Invalid authorization code')
    );

    const handler = authenticateTool.handler(deps);
    const result = await (handler as (params: any) => Promise<any>)({
      code: 'invalid-code',
      codeVerifier: 'code-verifier'
    });

    expect(JSON.parse(result.content[0].text).success).toBe(false);
    expect(JSON.parse(result.content[0].text).error).toBe('Invalid authorization code');
  });
});
