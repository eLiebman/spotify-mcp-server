#!/usr/bin/env node
import { spawn } from 'child_process';

console.log('🎵 Spotify MCP Analytics CLI\n');

// Commands registry for easy maintenance and help generation
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

// Check command line arguments
const command = process.argv[2];
const arg1 = process.argv[3];
const arg2 = process.argv[4];

// Show help if no command or help command
if (!command || command === 'help') {
  showHelp(arg1);
  process.exit(0);
}

function showHelp(category = null) {
  console.log('🎵 Spotify MCP Analytics CLI - Help\n');
  
  if (category) {
    // Show commands for specific category
    const categoryCommands = Object.entries(COMMANDS).filter(([_, cmd]) => 
      cmd.category.toLowerCase() === category.toLowerCase()
    );
    
    if (categoryCommands.length === 0) {
      console.log(`❌ Unknown category: ${category}`);
      console.log('\n📋 Available categories:');
      const categories = [...new Set(Object.values(COMMANDS).map(cmd => cmd.category))];
      categories.forEach(cat => console.log(`   ${cat}`));
      return;
    }
    
    console.log(`📋 ${category} Commands:\n`);
    categoryCommands.forEach(([cmdName, cmd]) => {
      console.log(`🔸 ${cmdName}`);
      console.log(`   ${cmd.description}`);
      console.log(`   Usage: ${cmd.usage}`);
      console.log(`   Example: ${cmd.example}\n`);
    });
  } else {
    // Show all commands grouped by category
    const categories = [...new Set(Object.values(COMMANDS).map(cmd => cmd.category))];
    
    categories.forEach(cat => {
      console.log(`📋 ${cat} Commands:`);
      const categoryCommands = Object.entries(COMMANDS).filter(([_, cmd]) => cmd.category === cat);
      categoryCommands.forEach(([cmdName, cmd]) => {
        console.log(`   ${cmdName.padEnd(18)} - ${cmd.description}`);
      });
      console.log('');
    });
    
    console.log('💡 Tips:');
    console.log('   • Use "help [category]" for detailed command info (e.g., "help Analytics")');
    console.log('   • Most commands require authentication first (use "login" or "generate" + "auth")');
    console.log('   • Track/Artist/Album IDs can be found in Spotify URLs or by using search commands');
  }
}

// Start MCP server
const server = spawn('npx', ['tsx', 'src/index.ts'], {
  stdio: ['pipe', 'pipe', 'pipe']
});

let requestSent = false;

// Handle server output
server.stdout.on('data', (data) => {
  const output = data.toString().trim();
  if (output) {
    try {
      const response = JSON.parse(output);
      console.log('✅ Response:');
      
      // Pretty print the response
      if (response.result?.content?.[0]?.text) {
        try {
          const content = JSON.parse(response.result.content[0].text);
          console.log(JSON.stringify(content, null, 2));
        } catch {
          console.log(response.result.content[0].text);
        }
      } else if (response.result?.tools) {
        console.log('📋 Available Tools:');
        response.result.tools.forEach((tool, i) => {
          console.log(`${i + 1}. ${tool.name}`);
        });
      } else {
        console.log(JSON.stringify(response, null, 2));
      }
      
      // Exit after response
      setTimeout(() => {
        server.kill();
        process.exit(0);
      }, 100);
      
    } catch (e) {
      console.log(`📝 Raw output: ${output}`);
    }
  }
});

server.stderr.on('data', (data) => {
  const error = data.toString().trim();
  if (error.includes('Spotify MCP Server running') && !requestSent) {
    console.log('🚀 Server ready, sending request...\n');
    sendCommand();
    requestSent = true;
  }
});

function sendCommand() {
  // Validate command exists in registry
  if (!COMMANDS[command]) {
    console.log(`❌ Unknown command: ${command}`);
    console.log('\n💡 Use "help" to see all available commands');
    server.kill();
    process.exit(1);
  }
  
  let request;
  
  switch (command) {
    case 'status':
      request = {
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/call',
        params: {
          name: 'getAuthStatus',
          arguments: {}
        }
      };
      break;
      
    case 'generate':
      request = {
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/call',
        params: {
          name: 'generateAuthUrl',
          arguments: { state: 'simple-test' }
        }
      };
      break;
      
    case 'auth':
      if (!arg1 || !arg2) {
        console.log('❌ Missing arguments for auth command');
        console.log('Usage: node spotify-cli.js auth "CODE" "CODE_VERIFIER"');
        server.kill();
        process.exit(1);
      }
      request = {
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/call',
        params: {
          name: 'authenticate',
          arguments: {
            code: arg1,
            codeVerifier: arg2
          }
        }
      };
      break;
      
    case 'profile':
      request = {
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/call',
        params: {
          name: 'getCurrentUserProfile',
          arguments: {}
        }
      };
      break;
      
    case 'tools':
      request = {
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/list'
      };
      break;
      
    case 'popularity':
      if (!arg1) {
        console.log('❌ Missing track ID for popularity command');
        console.log('Usage: node spotify-cli.js popularity "TRACK_ID"');
        server.kill();
        process.exit(1);
      }
      request = {
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/call',
        params: {
          name: 'getTrackPopularity',
          arguments: {
            trackId: arg1
          }
        }
      };
      break;
      
    case 'playlists':
      if (!arg1 || !arg2) {
        console.log('❌ Missing track name or artist name for playlists command');
        console.log('Usage: node spotify-cli.js playlists "TRACK_NAME" "ARTIST_NAME"');
        server.kill();
        process.exit(1);
      }
      request = {
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/call',
        params: {
          name: 'searchPlaylistsByTrack',
          arguments: {
            trackName: arg1,
            artistName: arg2,
            limit: 10
          }
        }
      };
      break;
      
    case 'trends':
      if (!arg1) {
        console.log('❌ Missing artist ID for trends command');
        console.log('Usage: node spotify-cli.js trends "ARTIST_ID"');
        server.kill();
        process.exit(1);
      }
      request = {
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/call',
        params: {
          name: 'analyzeArtistTrends',
          arguments: {
            artistId: arg1
          }
        }
      };
      break;
      
    case 'search':
      if (!arg1 || !arg2) {
            console.log('❌ Missing track name or artist name for search command');
    console.log('Usage: node spotify-cli.js search "TRACK_NAME" "ARTIST_NAME"');
        server.kill();
        process.exit(1);
      }
      request = {
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/call',
        params: {
          name: 'searchTracks',
          arguments: {
            query: `track:"${arg1}" artist:"${arg2}"`,
            limit: 5
          }
        }
      };
      break;
      
    case 'login':
      request = {
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/call',
        params: {
          name: 'authenticateSimple',
          arguments: {}
        }
      };
      break;
      
    case 'albums':
      if (!arg1) {
        console.log('❌ Missing artist name for albums command');
        console.log('Usage: node spotify-cli.js albums "ARTIST_NAME"');
        server.kill();
        process.exit(1);
      }
      request = {
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/call',
        params: {
          name: 'searchArtistAlbums',
          arguments: {
            artistName: arg1,
            limit: 10
          }
        }
      };
      break;
      
    case 'album-tracks':
      if (!arg1) {
        console.log('❌ Missing album ID for album-tracks command');
        console.log('Usage: node spotify-cli.js album-tracks "ALBUM_ID"');
        server.kill();
        process.exit(1);
      }
      request = {
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/call',
        params: {
          name: 'getAlbumTracks',
          arguments: {
            albumId: arg1,
            limit: 50
          }
        }
      };
      break;
      
    case 'album-popularity':
      if (!arg1) {
        console.log('❌ Missing album ID for album-popularity command');
        console.log('Usage: node spotify-cli.js album-popularity "ALBUM_ID"');
        server.kill();
        process.exit(1);
      }
      request = {
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/call',
        params: {
          name: 'getAlbumPopularity',
          arguments: {
            albumId: arg1
          }
        }
      };
      break;
      
    case 'artist-popularity':
      if (!arg1) {
        console.log('❌ Missing artist ID for artist-popularity command');
        console.log('Usage: node spotify-cli.js artist-popularity "ARTIST_ID"');
        server.kill();
        process.exit(1);
      }
      request = {
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/call',
        params: {
          name: 'getArtistPopularity',
          arguments: {
            artistId: arg1
          }
        }
      };
      break;
      
    case 'analyze-single':
      if (!arg1) {
        console.log('❌ Missing track ID for analyze-single command');
        console.log('Usage: node spotify-cli.js analyze-single "TRACK_ID" [includeAlbumTracks]');
        server.kill();
        process.exit(1);
      }
      request = {
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/call',
        params: {
          name: 'analyzeSingle',
          arguments: {
            trackId: arg1,
            includeAlbumTracks: arg2 === 'true' || arg2 === '1'
          }
        }
      };
      break;
      
    case 'explore-metrics':
      if (!arg1) {
        console.log('❌ Missing artist ID for explore-metrics command');
        console.log('Usage: node spotify-cli.js explore-metrics "ARTIST_ID" [countries]');
        console.log('Countries example: "US,GB,DE,FR" (optional, defaults to major markets)');
        server.kill();
        process.exit(1);
      }
      const countries = arg2 ? arg2.split(',').map(c => c.trim()) : undefined;
      request = {
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/call',
        params: {
          name: 'exploreArtistMetrics',
          arguments: {
            artistId: arg1,
            countries: countries,
            includeRelated: true
          }
        }
      };
      break;
      
    case 'analyze-genre':
      if (!arg1) {
        console.log('❌ Missing artist ID for analyze-genre command');
        console.log('Usage: node spotify-cli.js analyze-genre "ARTIST_ID" [options]');
        console.log('Options: "playlists,related" (optional, defaults to all)');
        server.kill();
        process.exit(1);
      }
      const options = arg2 ? arg2.split(',').map(o => o.trim()) : ['playlists', 'related'];
      request = {
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/call',
        params: {
          name: 'analyzeGenre',
          arguments: {
            artistId: arg1,
            includePlaylistAnalysis: options.includes('playlists'),
            includeRelatedArtists: options.includes('related')
          }
        }
      };
      break;
  }
  
  console.log(`📤 Calling: ${command}`);
  server.stdin.write(JSON.stringify(request) + '\n');
}

// Cleanup
process.on('SIGINT', () => {
  server.kill();
  process.exit(0);
});

server.on('error', (error) => {
  console.error('❌ Server error:', error);
});
