# Spotify MCP Server

A Model Context Protocol (MCP) server for Spotify analytics and playlist analysis. This server provides tools to authenticate with Spotify and analyze playlist data to discover trends among related artists.

## Features
- **Playlist Analytics**: Search playlists by track, analyze artist relationships
- **Track Analysis**: Get track popularity and detailed information
- **Artist Trend Analysis**: Discover related artists and genre patterns

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

### 4. Run the MCP Server

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

### Authentication Persistence
- Tokens are saved to `.spotify-tokens.json` (gitignored)
- Automatic token refresh for expired tokens
- Separate storage for OAuth vs Client Credentials tokens

## Available CLI Commands

### Quick Command Reference
```bash

# Help
help                              # Show all commands grouped by category
help CATEGORY                     # Show detailed help for a given category

# Authentication
login                             # Simple CLI auth
status                            # Check auth status
generate                          # Generate OAuth URL
auth "CODE" "VERIFIER"            # Complete OAuth

# User & System
profile                           # Get user profile
tools                             # List available MCP tools

# Search
search "TRACK_NAME" "ARTIST"      # Search for tracks
albums "ARTIST_NAME"              # Find artist's albums
playlists "TRACK_NAME" "ARTIST"   # Find playlists containing track

# Analytics
popularity "TRACK_ID"             # Get track popularity
album-popularity "ALBUM_ID"       # Get album popularity score
artist-popularity "ARTIST_ID"     # Get artist popularity score
analyze-single "TRACK_ID"         # Comprehensive single analysis
analyze-genre "ARTIST_ID"         # Analyze artist genre information
trends "ARTIST_ID"                # Analyze artist trends
explore-metrics "ARTIST_ID"       # Explore comprehensive artist metrics

# Utility
album-tracks "ALBUM_ID"           # Get album tracks with popularity
```

### Getting Spotify IDs

- **Track ID**: From Spotify URL `https://open.spotify.com/track/TRACK_ID`
- **Artist ID**: From Spotify URL `https://open.spotify.com/artist/ARTIST_ID`
- **Playlist ID**: From Spotify URL `https://open.spotify.com/playlist/PLAYLIST_ID`

## Available MCP Tools

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

- **`getCurrentUserProfile`**: Get current user's Spotify profile
  - Returns: User ID, display name, email, country, followers, etc.

- **`testConnection`**: Test API connectivity and authentication

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

## Troubleshooting

### Debug Mode

Set `NODE_ENV=development` for verbose logging:

```bash
NODE_ENV=development npm run dev
```

## License

MIT