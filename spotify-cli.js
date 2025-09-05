#!/usr/bin/env node
import { spawn } from 'child_process';

console.log('🎵 Spotify MCP Analytics CLI\n');

// Check command line arguments
const command = process.argv[2];
const arg1 = process.argv[3];
const arg2 = process.argv[4];

if (!command) {
  console.log('📋 Usage Examples:');
  console.log('');
  console.log('1. Check auth status:');
  console.log('   node spotify-cli.js status');
  console.log('');
  console.log('2. Generate auth URL:');
  console.log('   node spotify-cli.js generate');
  console.log('');
  console.log('3. Authenticate (after getting code from browser):');
  console.log('   node spotify-cli.js auth "YOUR_CODE" "YOUR_CODE_VERIFIER"');
  console.log('');
  console.log('4. Get user profile:');
  console.log('   node spotify-cli.js profile');
  console.log('');
  console.log('5. List all tools:');
  console.log('   node spotify-cli.js tools');
  console.log('');
  console.log('6. Get track popularity:');
  console.log('   node spotify-cli.js popularity "TRACK_ID"');
  console.log('');
  console.log('7. Search playlists by track:');
  console.log('   node spotify-cli.js playlists "TRACK_NAME" "ARTIST_NAME"');
  console.log('');
  console.log('8. Analyze artist trends:');
  console.log('   node spotify-cli.js trends "ARTIST_ID"');
  console.log('');
  console.log('9. Search for tracks:');
  console.log('   node spotify-cli.js search "TRACK_NAME" "ARTIST_NAME"');
  console.log('');
  console.log('10. Search artist albums:');
  console.log('   node spotify-cli.js albums "ARTIST_NAME"');
  console.log('');
  console.log('11. Analyze single (comprehensive):');
  console.log('   node spotify-cli.js analyze-single "TRACK_ID"');
  console.log('');
  console.log('12. Analyze genre:');
  console.log('   node spotify-cli.js analyze-genre "ARTIST_ID"');
  console.log('');
  console.log('13. Simple CLI authentication (no browser needed):');
  console.log('   node spotify-cli.js login');
  process.exit(0);
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
      
    default:
      console.log('❌ Unknown command:', command);
      server.kill();
      process.exit(1);
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
