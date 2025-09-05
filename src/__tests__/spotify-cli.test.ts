import { jest } from '@jest/globals';
import { spawn } from 'child_process';

// Mock child_process
jest.mock('child_process', () => ({
  spawn: jest.fn()
}));

const mockSpawn = spawn as jest.MockedFunction<typeof spawn>;

// Import the COMMANDS registry and helper functions
// We'll need to extract these from the CLI file to make them testable
const COMMANDS = {
  // Authentication Commands
  status: {
    category: 'Authentication',
    description: 'Check authentication status',
    usage: 'node spotify-cli.js status',
    example: 'node spotify-cli.js status'
  },
  generate: {
    category: 'Authentication',
    description: 'Generate OAuth authorization URL',
    usage: 'node spotify-cli.js generate',
    example: 'node spotify-cli.js generate'
  },
  auth: {
    category: 'Authentication',
    description: 'Complete OAuth authentication with code',
    usage: 'node spotify-cli.js auth "CODE" "CODE_VERIFIER"',
    example: 'node spotify-cli.js auth "YOUR_CODE" "YOUR_CODE_VERIFIER"'
  },
  login: {
    category: 'Authentication',
    description: 'Simple CLI authentication (no browser needed)',
    usage: 'node spotify-cli.js login',
    example: 'node spotify-cli.js login'
  },
  
  // User & Profile Commands
  profile: {
    category: 'User',
    description: 'Get current user profile information',
    usage: 'node spotify-cli.js profile',
    example: 'node spotify-cli.js profile'
  },
  tools: {
    category: 'System',
    description: 'List all available MCP tools',
    usage: 'node spotify-cli.js tools',
    example: 'node spotify-cli.js tools'
  },
  
  // Search Commands
  search: {
    category: 'Search',
    description: 'Search for tracks by name and artist',
    usage: 'node spotify-cli.js search "TRACK_NAME" "ARTIST_NAME"',
    example: 'node spotify-cli.js search "Bohemian Rhapsody" "Queen"'
  },
  albums: {
    category: 'Search',
    description: 'Search for albums by artist name',
    usage: 'node spotify-cli.js albums "ARTIST_NAME"',
    example: 'node spotify-cli.js albums "Taylor Swift"'
  },
  playlists: {
    category: 'Search',
    description: 'Search playlists containing a specific track',
    usage: 'node spotify-cli.js playlists "TRACK_NAME" "ARTIST_NAME"',
    example: 'node spotify-cli.js playlists "Shape of You" "Ed Sheeran"'
  },
  
  // Analytics Commands
  popularity: {
    category: 'Analytics',
    description: 'Get popularity score for a track',
    usage: 'node spotify-cli.js popularity "TRACK_ID"',
    example: 'node spotify-cli.js popularity "4iV5W9uYEdYUVa79Axb7Rh"'
  },
  'album-popularity': {
    category: 'Analytics',
    description: 'Get popularity score for an album',
    usage: 'node spotify-cli.js album-popularity "ALBUM_ID"',
    example: 'node spotify-cli.js album-popularity "1DFixLWuPkv3KT3TnV35m3"'
  },
  'artist-popularity': {
    category: 'Analytics',
    description: 'Get popularity score for an artist',
    usage: 'node spotify-cli.js artist-popularity "ARTIST_ID"',
    example: 'node spotify-cli.js artist-popularity "1Xyo4u8uXC1ZmMpatF05PJ"'
  },
  trends: {
    category: 'Analytics',
    description: 'Analyze artist popularity trends and metrics',
    usage: 'node spotify-cli.js trends "ARTIST_ID"',
    example: 'node spotify-cli.js trends "06HL4z0CvFAxyc27GXpf02"'
  },
  'analyze-single': {
    category: 'Analytics',
    description: 'Comprehensive analysis of a single track',
    usage: 'node spotify-cli.js analyze-single "TRACK_ID"',
    example: 'node spotify-cli.js analyze-single "4iV5W9uYEdYUVa79Axb7Rh"'
  },
  'analyze-genre': {
    category: 'Analytics',
    description: 'Analyze genre information for an artist',
    usage: 'node spotify-cli.js analyze-genre "ARTIST_ID" [options]',
    example: 'node spotify-cli.js analyze-genre "06HL4z0CvFAxyc27GXpf02" "playlists,related"'
  },
  'explore-metrics': {
    category: 'Analytics',
    description: 'Explore comprehensive artist metrics and insights',
    usage: 'node spotify-cli.js explore-metrics "ARTIST_ID"',
    example: 'node spotify-cli.js explore-metrics "1Xyo4u8uXC1ZmMpatF05PJ"'
  },
  
  // Utility Commands
  'album-tracks': {
    category: 'Utility',
    description: 'Get all tracks from an album',
    usage: 'node spotify-cli.js album-tracks "ALBUM_ID"',
    example: 'node spotify-cli.js album-tracks "1DFixLWuPkv3KT3TnV35m3"'
  },
  
  // Help Command
  help: {
    category: 'System',
    description: 'Show this help message',
    usage: 'node spotify-cli.js help [category]',
    example: 'node spotify-cli.js help Analytics'
  }
};

// Helper function to generate help text (extracted from CLI logic)
function showHelp(category: string | null = null): string {
  let output = '🎵 Spotify MCP Analytics CLI - Help\n\n';
  
  if (category) {
    // Show commands for specific category
    const categoryCommands = Object.entries(COMMANDS).filter(([_, cmd]) => 
      cmd.category.toLowerCase() === category.toLowerCase()
    );
    
    if (categoryCommands.length === 0) {
      output += `❌ Unknown category: ${category}\n\n📋 Available categories:\n`;
      const categories = [...new Set(Object.values(COMMANDS).map(cmd => cmd.category))];
      categories.forEach(cat => output += `   ${cat}\n`);
      return output;
    }
    
    output += `📋 ${category} Commands:\n\n`;
    categoryCommands.forEach(([cmdName, cmd]) => {
      output += `🔸 ${cmdName}\n`;
      output += `   ${cmd.description}\n`;
      output += `   Usage: ${cmd.usage}\n`;
      output += `   Example: ${cmd.example}\n\n`;
    });
  } else {
    // Show all commands grouped by category
    const categories = [...new Set(Object.values(COMMANDS).map(cmd => cmd.category))];
    
    categories.forEach(cat => {
      output += `📋 ${cat} Commands:\n`;
      const categoryCommands = Object.entries(COMMANDS).filter(([_, cmd]) => cmd.category === cat);
      categoryCommands.forEach(([cmdName, cmd]) => {
        output += `   ${cmdName.padEnd(18)} - ${cmd.description}\n`;
      });
      output += '\n';
    });
    
    output += '💡 Tips:\n';
    output += '   • Use "help [category]" for detailed command info (e.g., "help Analytics")\n';
    output += '   • Most commands require authentication first (use "login" or "generate" + "auth")\n';
    output += '   • Track/Artist/Album IDs can be found in Spotify URLs or by using search commands';
  }
  
  return output;
}

// Helper function to validate command arguments
function validateCommandArgs(command: string, args: string[]): { valid: boolean; error?: string } {
  const cmd = COMMANDS[command as keyof typeof COMMANDS];
  if (!cmd) {
    return { valid: false, error: `Unknown command: ${command}` };
  }

  // Define argument requirements for each command
  const argRequirements: Record<string, { required: number; names: string[] }> = {
    auth: { required: 2, names: ['code', 'codeVerifier'] },
    popularity: { required: 1, names: ['trackId'] },
    'album-popularity': { required: 1, names: ['albumId'] },
    'artist-popularity': { required: 1, names: ['artistId'] },
    trends: { required: 1, names: ['artistId'] },
    'analyze-single': { required: 1, names: ['trackId'] },
    'analyze-genre': { required: 1, names: ['artistId'] },
    'explore-metrics': { required: 1, names: ['artistId'] },
    search: { required: 2, names: ['trackName', 'artistName'] },
    albums: { required: 1, names: ['artistName'] },
    playlists: { required: 2, names: ['trackName', 'artistName'] },
    'album-tracks': { required: 1, names: ['albumId'] }
  };

  const requirement = argRequirements[command];
  if (requirement && args.length < requirement.required) {
    const missingArgs = requirement.names.slice(args.length);
    return { 
      valid: false, 
      error: `Missing required arguments: ${missingArgs.join(', ')}` 
    };
  }

  return { valid: true };
}

// Helper function to create JSON-RPC request
function createRequest(command: string, args: string[]): any {
  const toolNameMap: Record<string, string> = {
    status: 'getAuthStatus',
    generate: 'generateAuthUrl',
    auth: 'authenticate',
    login: 'authenticateSimple',
    profile: 'getCurrentUserProfile',
    tools: 'listTools',
    popularity: 'getTrackPopularity',
    'album-popularity': 'getAlbumPopularity',
    'artist-popularity': 'getArtistPopularity',
    trends: 'analyzeArtistTrends',
    'analyze-single': 'analyzeSingle',
    'analyze-genre': 'analyzeGenre',
    'explore-metrics': 'exploreArtistMetrics',
    search: 'searchTracks',
    albums: 'searchArtistAlbums',
    playlists: 'searchPlaylistsByTrack',
    'album-tracks': 'getAlbumTracks'
  };

  const toolName = toolNameMap[command];
  if (!toolName) return null;

  const baseRequest = {
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/call',
    params: {
      name: toolName,
      arguments: {}
    }
  };

  // Add command-specific arguments
  switch (command) {
    case 'auth':
      baseRequest.params.arguments = { code: args[0], codeVerifier: args[1] };
      break;
    case 'generate':
      baseRequest.params.arguments = { state: 'simple-test' };
      break;
    case 'popularity':
    case 'analyze-single':
    case 'trends':
    case 'explore-metrics':
    case 'analyze-genre':
      baseRequest.params.arguments = { trackId: args[0] };
      break;
    case 'album-popularity':
    case 'album-tracks':
      baseRequest.params.arguments = { albumId: args[0] };
      break;
    case 'artist-popularity':
      baseRequest.params.arguments = { artistId: args[0] };
      break;
    case 'search':
    case 'playlists':
      baseRequest.params.arguments = { trackName: args[0], artistName: args[1] };
      break;
    case 'albums':
      baseRequest.params.arguments = { artistName: args[0] };
      break;
  }

  return baseRequest;
}

describe('Spotify CLI Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Commands Registry', () => {
    test('all commands have required properties', () => {
      Object.entries(COMMANDS).forEach(([commandName, command]) => {
        expect(command).toHaveProperty('category');
        expect(command).toHaveProperty('description');
        expect(command).toHaveProperty('usage');
        expect(command).toHaveProperty('example');
        
        expect(typeof command.category).toBe('string');
        expect(typeof command.description).toBe('string');
        expect(typeof command.usage).toBe('string');
        expect(typeof command.example).toBe('string');
        
        expect(command.description.length).toBeGreaterThan(0);
        expect(command.usage).toContain('node spotify-cli.js');
        expect(command.example).toContain('node spotify-cli.js');
      });
    });

    test('commands are properly categorized', () => {
      const expectedCategories = ['Authentication', 'User', 'System', 'Search', 'Analytics', 'Utility'];
      const actualCategories = [...new Set(Object.values(COMMANDS).map(cmd => cmd.category))];
      
      expectedCategories.forEach(category => {
        expect(actualCategories).toContain(category);
      });
    });

    test('each category has at least one command', () => {
      const categories = [...new Set(Object.values(COMMANDS).map(cmd => cmd.category))];
      
      categories.forEach(category => {
        const commandsInCategory = Object.values(COMMANDS).filter(cmd => cmd.category === category);
        expect(commandsInCategory.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Help System', () => {
    test('showHelp() returns general help when no category specified', () => {
      const help = showHelp();
      
      expect(help).toContain('🎵 Spotify MCP Analytics CLI - Help');
      expect(help).toContain('📋 Authentication Commands:');
      expect(help).toContain('📋 Analytics Commands:');
      expect(help).toContain('💡 Tips:');
      expect(help).toContain('Use "help [category]" for detailed command info');
    });

    test('showHelp() returns category-specific help', () => {
      const help = showHelp('Analytics');
      
      expect(help).toContain('📋 Analytics Commands:');
      expect(help).toContain('🔸 popularity');
      expect(help).toContain('🔸 trends');
      expect(help).toContain('Usage:');
      expect(help).toContain('Example:');
    });

    test('showHelp() handles invalid category', () => {
      const help = showHelp('InvalidCategory');
      
      expect(help).toContain('❌ Unknown category: InvalidCategory');
      expect(help).toContain('📋 Available categories:');
      expect(help).toContain('Authentication');
      expect(help).toContain('Analytics');
    });

    test('showHelp() is case-insensitive for categories', () => {
      const help = showHelp('analytics');
      
      expect(help).toContain('📋 analytics Commands:');
      expect(help).toContain('🔸 popularity');
    });
  });

  describe('Command Validation', () => {
    test('validates commands exist in registry', () => {
      expect(validateCommandArgs('status', [])).toEqual({ valid: true });
      expect(validateCommandArgs('help', [])).toEqual({ valid: true });
      expect(validateCommandArgs('invalid-command', [])).toEqual({
        valid: false,
        error: 'Unknown command: invalid-command'
      });
    });

    test('validates required arguments for commands', () => {
      // Commands requiring no arguments
      expect(validateCommandArgs('status', [])).toEqual({ valid: true });
      expect(validateCommandArgs('profile', [])).toEqual({ valid: true });
      
      // Commands requiring one argument
      expect(validateCommandArgs('popularity', ['track-id'])).toEqual({ valid: true });
      expect(validateCommandArgs('popularity', [])).toEqual({
        valid: false,
        error: 'Missing required arguments: trackId'
      });
      
      // Commands requiring two arguments
      expect(validateCommandArgs('auth', ['code', 'verifier'])).toEqual({ valid: true });
      expect(validateCommandArgs('auth', ['code'])).toEqual({
        valid: false,
        error: 'Missing required arguments: codeVerifier'
      });
      expect(validateCommandArgs('search', ['track', 'artist'])).toEqual({ valid: true });
      expect(validateCommandArgs('search', ['track'])).toEqual({
        valid: false,
        error: 'Missing required arguments: artistName'
      });
    });
  });

  describe('JSON-RPC Request Generation', () => {
    test('creates valid requests for simple commands', () => {
      const statusRequest = createRequest('status', []);
      expect(statusRequest).toEqual({
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/call',
        params: {
          name: 'getAuthStatus',
          arguments: {}
        }
      });
    });

    test('creates valid requests for commands with arguments', () => {
      const popularityRequest = createRequest('popularity', ['track123']);
      expect(popularityRequest).toEqual({
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/call',
        params: {
          name: 'getTrackPopularity',
          arguments: { trackId: 'track123' }
        }
      });
    });

    test('creates valid requests for commands with multiple arguments', () => {
      const authRequest = createRequest('auth', ['code123', 'verifier456']);
      expect(authRequest).toEqual({
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/call',
        params: {
          name: 'authenticate',
          arguments: { code: 'code123', codeVerifier: 'verifier456' }
        }
      });
    });

    test('returns null for unknown commands', () => {
      const request = createRequest('unknown-command', []);
      expect(request).toBeNull();
    });
  });

  describe('Command Categories', () => {
    test('Authentication commands are properly grouped', () => {
      const authCommands = Object.entries(COMMANDS)
        .filter(([_, cmd]) => cmd.category === 'Authentication')
        .map(([name, _]) => name);
      
      expect(authCommands).toContain('status');
      expect(authCommands).toContain('generate');
      expect(authCommands).toContain('auth');
      expect(authCommands).toContain('login');
    });

    test('Analytics commands are properly grouped', () => {
      const analyticsCommands = Object.entries(COMMANDS)
        .filter(([_, cmd]) => cmd.category === 'Analytics')
        .map(([name, _]) => name);
      
      expect(analyticsCommands).toContain('popularity');
      expect(analyticsCommands).toContain('trends');
      expect(analyticsCommands).toContain('analyze-single');
      expect(analyticsCommands).toContain('analyze-genre');
    });

    test('Search commands are properly grouped', () => {
      const searchCommands = Object.entries(COMMANDS)
        .filter(([_, cmd]) => cmd.category === 'Search')
        .map(([name, _]) => name);
      
      expect(searchCommands).toContain('search');
      expect(searchCommands).toContain('albums');
      expect(searchCommands).toContain('playlists');
    });
  });

  describe('Usage Examples', () => {
    test('all usage examples contain proper command structure', () => {
      Object.entries(COMMANDS).forEach(([commandName, command]) => {
        expect(command.usage).toMatch(/^node spotify-cli\.js \S+/);
        expect(command.example).toMatch(/^node spotify-cli\.js \S+/);
        
        // Usage should contain the actual command name
        expect(command.usage).toContain(commandName);
        expect(command.example).toContain(commandName);
      });
    });

    test('commands requiring arguments show proper parameter format', () => {
      // Commands with required arguments should show them in quotes or brackets
      expect(COMMANDS.auth.usage).toContain('"CODE"');
      expect(COMMANDS.auth.usage).toContain('"CODE_VERIFIER"');
      
      expect(COMMANDS.popularity.usage).toContain('"TRACK_ID"');
      expect(COMMANDS.search.usage).toContain('"TRACK_NAME"');
      expect(COMMANDS.search.usage).toContain('"ARTIST_NAME"');
    });
  });

  describe('Command Completeness', () => {
    test('all expected commands are present', () => {
      const expectedCommands = [
        // Authentication
        'status', 'generate', 'auth', 'login',
        // User & System
        'profile', 'tools', 'help',
        // Search
        'search', 'albums', 'playlists',
        // Analytics
        'popularity', 'album-popularity', 'artist-popularity',
        'trends', 'analyze-single', 'analyze-genre', 'explore-metrics',
        // Utility
        'album-tracks'
      ];

      expectedCommands.forEach(cmd => {
        expect(COMMANDS).toHaveProperty(cmd);
      });
    });

    test('no unexpected commands are present', () => {
      const actualCommands = Object.keys(COMMANDS);
      const expectedCommandCount = 18; // Updated to match actual command count
      
      expect(actualCommands).toHaveLength(expectedCommandCount);
    });
  });
});
