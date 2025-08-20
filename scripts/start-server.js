import { Server } from "@hocuspocus/server"
import { Database } from "@hocuspocus/extension-database"
import { Logger } from "@hocuspocus/extension-logger"
import { RocksDB } from "@hocuspocus/extension-rocksdb"

console.log("[v0] Starting Hocuspocus collaboration server...")

const server = Server.configure({
  port: 1234,
  extensions: [
    new Logger(),
    new RocksDB({
      path: "./database",
    }),
    new Database({
      fetch: async ({ documentName }) => {
        console.log(`[v0] Fetching document: ${documentName}`)
        return null
      },
      store: async ({ documentName, state }) => {
        console.log(`[v0] Storing document: ${documentName}`)
      },
    }),
  ],

  async onAuthenticate(data) {
    const { token } = data
    console.log(`[v0] Authentication attempt with token: ${token}`)

    if (!token) {
      console.log("[v0] Authentication failed: No token provided")
      throw new Error("Authentication required")
    }

    console.log(`[v0] Authentication successful for user: ${token}`)
    return {
      user: {
        id: token,
        name: token,
      },
    }
  },

  async onConnect(data) {
    console.log(`[v0] User ${data.context.user?.name} connected to ${data.documentName}`)
  },

  async onDisconnect(data) {
    console.log(`[v0] User ${data.context.user?.name} disconnected from ${data.documentName}`)
  },

  onDestroy() {
    console.log("[v0] Server shutting down...")
  },
})

try {
  await server.listen()
  console.log("[v0] ✅ Hocuspocus server running successfully on port 1234")
  console.log("[v0] WebSocket URL: ws://localhost:1234")
} catch (error) {
  console.error("[v0] ❌ Failed to start server:", error)
  process.exit(1)
}

// Handle graceful shutdown
process.on("SIGINT", () => {
  console.log("[v0] Received SIGINT, shutting down gracefully...")
  server.destroy()
  process.exit(0)
})

process.on("SIGTERM", () => {
  console.log("[v0] Received SIGTERM, shutting down gracefully...")
  server.destroy()
  process.exit(0)
})
