# Spotify MCP Server

A Model Context Protocol (MCP) server for Spotify analytics and playlist analysis. This server provides tools to authenticate with Spotify and analyze playlist data to discover trends among related artists.

## Features

- **Dual Authentication Methods**: OAuth 2.0 with PKCE flow + simplified Client Credentials flow
- **Playlist Analytics**: Search playlists by track, analyze artist relationships
- **Track Analysis**: Get track popularity and detailed information
- **Artist Trend Analysis**: Discover related artists and genre patterns
- **Modular Architecture**: Clean separation between MCP tools and utility functions
- **Rate Limiting & Error Handling** built-in
- **TypeScript** for type safety
- **Persistent Token Storage** for seamless CLI usage

## Quick Start

### 1. Setup Spotify App

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Create a new app
3. Note down your **Client ID** and **Client Secret**
4. Add `https://example.com/callback` as a Redirect URI (for OAuth flow)

### 2. Install Dependencies

```bash
cd spotify-mcp-server
npm install
```

### 3. Configure Environment

```bash
cp env.example .env
```

Edit `.env` with your Spotify app credentials:

```env
SPOTIFY_CLIENT_ID=your_client_id_here
SPOTIFY_CLIENT_SECRET=your_client_secret_here
SPOTIFY_REDIRECT_URI=https://example.com/callback
```

### 4. Test Setup

Test with the Spotify CLI client:

```bash
# Quick authentication (no browser needed)
node spotify-cli.js login

# Check authentication status
node spotify-cli.js status

# Test API connection
node spotify-cli.js test
```

### 5. Run the MCP Server

```bash
npm run dev
```

## Authentication Methods

### Method 1: Simple CLI Authentication (Recommended for Testing)

Uses Client Credentials flow - no browser interaction needed:

```bash
node spotify-cli.js login
```

This method works for public data access (tracks, albums, playlists, artist information).

### Method 2: Full OAuth 2.0 Flow (For User-Specific Data)

For accessing user's private playlists and personal data:

1. **Generate Auth URL**: `node spotify-cli.js generate`
2. **User Authorization**: Visit the URL, log in to Spotify
3. **Complete Authentication**: `node spotify-cli.js auth "CODE" "CODE_VERIFIER"`

## Available MCP Tools

### Authentication Tools

- **`authenticateSimple`**: Simple CLI authentication using Client Credentials
  - No parameters required
  - Returns: Authentication status
  - Works for public data access

- **`generateAuthUrl`**: Generate Spotify authorization URL for full OAuth
  - Optional: `state` parameter for security
  - Returns: Auth URL and code verifier

- **`authenticate`**: Complete OAuth flow
  - Required: `code` (from callback), `codeVerifier` (from generateAuthUrl)
  - Returns: Authentication status

- **`getAuthStatus`**: Check current authentication status

### API Tools

- **`getCurrentUserProfile`**: Get current user's Spotify profile
  - Returns: User ID, display name, email, country, followers, etc.

- **`testConnection`**: Test API connectivity and authentication

### Analytics Tools

- **`getTrackPopularity`**: Get popularity score for a track
  - Required: `trackId` (Spotify track ID)
  - Returns: Popularity score (0-100), track details

- **`searchPlaylistsByTrack`**: Find playlists containing a specific track
  - Required: `trackName`, `artistName`
  - Optional: `limit` (default: 20)
  - Returns: List of playlists with track counts, owners, descriptions

- **`analyzeArtistTrends`**: Analyze artist relationships and trends
  - Required: `artistId` (Spotify artist ID)
  - Returns: Artist info, related artists, genre analysis, popularity trends

- **`searchTracks`**: Search for tracks by name and artist
  - Required: `query` (search query, e.g., 'track:"song name" artist:"artist name"')
  - Optional: `limit` (default: 20)
  - Returns: Track details including ID, popularity, album info

- **`searchArtistAlbums`**: Find an artist's albums and singles
  - Required: `artistName` (artist name to search for)
  - Optional: `limit` (default: 10)
  - Returns: Artist info, complete discography sorted by release date, latest album

- **`getAlbumTracks`**: Get all tracks from an album with popularity scores
  - Required: `albumId` (Spotify album ID)
  - Optional: `limit` (default: 50)
  - Returns: Album info, all tracks with popularity scores, analytics (average, most/least popular tracks)

- **`getAlbumPopularity`**: Get album popularity and detailed info
  - Required: `albumId` (Spotify album ID)
  - Returns: Album popularity score, release info, label, genres, total tracks

- **`getArtistPopularity`**: Get artist popularity and profile info
  - Required: `artistId` (Spotify artist ID)
  - Returns: Artist popularity score, follower count, genres, profile images

- **`analyzeSingle`**: Comprehensive single analysis with visual elements
  - Required: `trackId` (Spotify track ID)
  - Optional: `includeAlbumTracks` (analyze other tracks on album, default: false)
  - Returns: Track vs album popularity comparison, album artwork, performance insights, marketing recommendations

## Architecture

### Core Components

**`src/spotify.mcp.ts`**
- Main MCP server implementation
- Clean, focused setup and dependency injection
- Dynamic tool registration from modular architecture

**Modular Tool System:**
- **`src/tools/`** - Individual tool files plus central registry
- **`src/tools/index.ts`** - Central tool registry with organized imports
- **Authentication Tools**: `auth-status.ts`, `authenticate.ts`, `authenticate-simple.ts`, `generate-auth-url.ts`
- **Search & Discovery**: `search-tracks.ts`, `search-artist-albums.ts`, `search-playlists.ts`
- **Popularity Analysis**: `track-popularity.ts`, `album-popularity.ts`, `artist-popularity.ts`
- **Advanced Analytics**: `analyze-single.ts`, `artist-trends.ts`, `explore-artist-metrics.ts`, `simulate-market-trends.ts`
- **Specialized Tools**: `genre-analysis.ts`, `album-tracks.ts`, `user-profile.ts`

**Utility Modules:**
- **`src/utils/genre-analyzer.ts`** - Genre classification and recommendation logic
- **`src/utils/artist-analytics.ts`** - Release patterns, popularity trends, growth analysis  
- **`src/utils/playlist-analyzer.ts`** - Playlist-based related artist discovery

**CLI Client:**
- **`spotify-cli.js`** - User-friendly command-line interface for testing tools

### Benefits of Modular Architecture

✅ **Easy to Browse**: `ls src/tools/` shows all available tools  
✅ **Easy to Maintain**: Each tool is self-contained with its own logic  
✅ **Easy to Test**: Individual tools can be tested in isolation  
✅ **Easy to Collaborate**: Different developers can work on different tools  
✅ **Easy to Extend**: Adding new tools requires only creating a file + adding to registry  
✅ **Clean Separation**: Main server focuses purely on setup, tools handle their own MCP registration

## Enhanced Analysis Features

### 🖼️ Visual Elements
- **Album Artwork**: All album/track analysis now includes high-quality album art URLs
- **Multi-Resolution Images**: 640x640, 300x300, and 64x64 versions available
- **Visual Context**: Images enhance analysis presentation and provide visual context

### 📊 Dual Popularity Analysis
- **Track vs Album Comparison**: Compare individual track performance against album performance
- **Variance Calculation**: Percentage difference analysis to identify outperforming tracks
- **Performance Insights**: Automated insights based on popularity gaps
- **Strategic Recommendations**: Marketing and promotion suggestions based on data

### 🎯 Smart Recommendations
- **Playlist Strategy**: Recommendations for tracks showing individual appeal
- **Marketing Focus**: Data-driven suggestions for promotion priorities
- **Mainstream Potential**: Identification of tracks with broader appeal potential

## CLI Testing Commands

The `spotify-cli.js` client provides easy testing:

```bash
# Authentication
node spotify-cli.js login              # Simple CLI auth
node spotify-cli.js status             # Check auth status
node spotify-cli.js generate           # Generate OAuth URL
node spotify-cli.js auth "CODE" "VERIFIER"  # Complete OAuth

# Basic API
node spotify-cli.js profile           # Get user profile
node spotify-cli.js test              # Test connection
node spotify-cli.js tools             # List available tools

# Analytics
node spotify-cli.js search "TRACK_NAME" "ARTIST"    # Search for tracks
node spotify-cli.js albums "ARTIST_NAME"            # Find artist's albums
node spotify-cli.js album-tracks "ALBUM_ID"         # Get album tracks with popularity
node spotify-cli.js album-popularity "ALBUM_ID"     # Get album popularity score
node spotify-cli.js artist-popularity "ARTIST_ID"   # Get artist popularity score
node spotify-cli.js analyze-single "TRACK_ID" [true] # Comprehensive single analysis with images
node spotify-cli.js popularity "TRACK_ID"           # Get track popularity
node spotify-cli.js playlists "TRACK_NAME" "ARTIST" # Find playlists
node spotify-cli.js trends "ARTIST_ID"              # Analyze artist trends
```

## Example Analytics Workflow

```bash
# 1. Authenticate
node spotify-cli.js login

# 2. Find playlists containing "Blinding Lights" by The Weeknd
node spotify-cli.js playlists "Blinding Lights" "The Weeknd"

# 3. Analyze The Weeknd's artist trends and related artists
node spotify-cli.js trends "1Xyo4u8uXC1ZmMpatF05PJ"

# 4. Check popularity of a specific track
node spotify-cli.js popularity "0VjIjW4GlULA4LGcGjVjyb"
```

## Analytics Capabilities

### Track Analysis
- **Popularity Scoring**: Get popularity metrics (0-100)
- **Track Details**: Duration, explicit content, preview URLs
- **Market Availability**: Which countries the track is available in

### Playlist Discovery
- **Search by Track**: Find playlists containing specific songs
- **Playlist Metadata**: Owner info, track counts, descriptions
- **Public vs Private**: Filter by playlist visibility

### Artist Relationship Analysis
- **Related Artists**: Discover artists similar to a given artist
- **Genre Analysis**: Common genres among related artists
- **Popularity Trends**: Compare popularity scores across related artists
- **Follower Metrics**: Analyze follower counts and ranges

## API Limitations & Notes


### Rate Limiting
- The server handles rate limiting automatically
- Built-in retry logic with exponential backoff
- Respects Spotify's rate limit headers

### Authentication Persistence
- Tokens are saved to `.spotify-tokens.json` (gitignored)
- Automatic token refresh for expired tokens
- Separate storage for OAuth vs Client Credentials tokens

## Error Handling

The server includes comprehensive error handling for:

- **Authentication errors** (401, 403) with clear messages
- **Rate limiting** (429) with retry guidance
- **Network errors** with detailed context
- **Invalid requests** (400, 404) with helpful suggestions
- **Deprecated endpoints** with alternative recommendations

## Development

### Build

```bash
npm run build
```

### Development Mode

```bash
npm run dev
```

### Test Configuration

```bash
npm run test
```

## Security Notes

- Uses OAuth 2.0 with PKCE (Proof Key for Code Exchange) for user data
- Client Credentials flow for public data access
- Tokens stored locally in `.spotify-tokens.json` (gitignored)
- Automatic token refresh handling
- No sensitive data logged in production

## Troubleshooting

### Common Issues

1. **"SPOTIFY_CLIENT_ID environment variable is required"**
   - Copy `env.example` to `.env` and fill in your credentials

2. **"Invalid Client: Invalid Redirect URI"**
   - Ensure `https://example.com/callback` is added to your Spotify app settings
   - Verify the redirect URI in `.env` matches exactly

3. **"Token exchange failed"**
   - Verify your Client ID and Client Secret are correct
   - Check that your Spotify app is not in development mode restrictions

   - This is expected for new Spotify apps (deprecated endpoint)
   - Use alternative analytics tools provided in this server

5. **"Rate limited"**
   - The server handles rate limiting automatically
   - Wait for the specified retry period

### Debug Mode

Set `NODE_ENV=development` for verbose logging:

```bash
NODE_ENV=development npm run dev
```

### Getting Spotify IDs

- **Track ID**: From Spotify URL `https://open.spotify.com/track/TRACK_ID`
- **Artist ID**: From Spotify URL `https://open.spotify.com/artist/ARTIST_ID`
- **Playlist ID**: From Spotify URL `https://open.spotify.com/playlist/PLAYLIST_ID`

## Future Enhancements

Potential additions to the analytics capabilities:

- Cross-playlist trend analysis
- Genre evolution tracking
- Collaborative filtering recommendations
- Playlist similarity scoring
- Artist collaboration networks

## License

MIT