import { SpotifyMcpServer } from './spotify.mcp.ts';

async function main() {
  try {
    const server = new SpotifyMcpServer();
    await server.run();
  } catch (error) {
    console.error("Fatal error in main():", error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("Unhandled error:", error);
  process.exit(1);
});
