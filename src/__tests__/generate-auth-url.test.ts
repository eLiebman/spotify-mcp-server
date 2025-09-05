import { jest } from '@jest/globals';
import { generateAuthUrlTool } from '../tools/generate-auth-url';

const createMockDeps = (): any => ({
  authService: {
    generateAuthUrl: jest.fn<(state?: string) => { url: string; codeVerifier: string }>()
  }
});

describe('generateAuthUrlTool', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should have correct name and schema', () => {
    expect(generateAuthUrlTool.name).toBe('generateAuthUrl');
    expect(generateAuthUrlTool.schema).toHaveProperty('state');
  });

  it('should generate auth URL successfully', async () => {
    const deps = createMockDeps();
    deps.authService.generateAuthUrl.mockReturnValue({
      url: 'https://accounts.spotify.com/authorize?client_id=test&response_type=code',
      codeVerifier: 'test-verifier'
    });

    const handler = generateAuthUrlTool.handler(deps);
    const result = await (handler as (params: any) => Promise<any>)({});

    expect(deps.authService.generateAuthUrl).toHaveBeenCalled();
    expect(result.content[0].text).toContain('authUrl');
    expect(result.content[0].text).toContain('https://accounts.spotify.com/authorize');
    expect(result.content[0].text).toContain('test-verifier');
  });

  it('should handle auth URL generation error', async () => {
    const deps = createMockDeps();
    deps.authService.generateAuthUrl.mockImplementation(() => {
      throw new Error('Failed to generate URL');
    });

    const handler = generateAuthUrlTool.handler(deps);
    const result = await (handler as (params: any) => Promise<any>)({});

    expect(result.content[0].text).toContain('Error generating auth URL');
    expect(result.content[0].text).toContain('Failed to generate URL');
  });
});
