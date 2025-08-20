# Collaborative Editor Server

This is the Hocuspocus WebSocket server for real-time collaboration.

## Installation

\`\`\`bash
cd server
npm install
\`\`\`

## Running the Server

\`\`\`bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
\`\`\`

The server will run on `ws://localhost:1234`

## Features

- Real-time document synchronization using Y.js
- User authentication and presence
- Document persistence with RocksDB
- Logging for debugging

## Configuration

The server is configured to:
- Listen on port 1234
- Store documents in `./database` directory
- Require authentication token for connections
- Log all connections and disconnections
