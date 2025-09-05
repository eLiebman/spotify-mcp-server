import { jest } from '@jest/globals';
import { authStatusTool } from '../tools/auth-status';

const createMockDeps = (): any => ({
  authService: {
    isAuthenticated: jest.fn<() => boolean>()
  }
});

describe('authStatusTool', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should have correct name and schema', () => {
    expect(authStatusTool.name).toBe('getAuthStatus');
    expect(authStatusTool.schema).toEqual({});
  });

  it('should return authenticated status when user is authenticated', async () => {
    const deps = createMockDeps();
    deps.authService.isAuthenticated.mockReturnValue(true);

    const handler = authStatusTool.handler(deps);
    const result = await (handler as () => Promise<any>)();

    expect(result.content[0].text).toContain('"isAuthenticated": true');
    expect(result.content[0].text).toContain('"timestamp"');
  });

  it('should return unauthenticated status when user is not authenticated', async () => {
    const deps = createMockDeps();
    deps.authService.isAuthenticated.mockReturnValue(false);

    const handler = authStatusTool.handler(deps);
    const result = await (handler as () => Promise<any>)();

    expect(result.content[0].text).toContain('"isAuthenticated": false');
    expect(result.content[0].text).toContain('"timestamp"');
  });
});
