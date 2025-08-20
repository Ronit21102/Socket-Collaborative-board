import { Server } from "@hocuspocus/server"
import { Database } from "@hocuspocus/extension-database"
import { Logger } from "@hocuspocus/extension-logger"
import { RocksDB } from "@hocuspocus/extension-rocksdb"

const server = Server.configure({
  port: 1234,
  extensions: [
    new Logger(),
    new RocksDB({
      path: "./database",
    }),
    new Database({
      fetch: async ({ documentName }) => {
        // Return null for new documents, or fetch from your database
        return null
      },
      store: async ({ documentName, state }) => {
        // Store the document state in your database
        console.log(`Storing document: ${documentName}`)
      },
    }),
  ],

  async onAuthenticate(data) {
    const { token } = data

    // Simple authentication - in production, validate JWT or session
    if (!token) {
      throw new Error("Authentication required")
    }

    return {
      user: {
        id: token,
        name: token, // Use token as name for simplicity
      },
    }
  },

  async onConnect(data) {
    console.log(`User ${data.context.user?.name} connected to ${data.documentName}`)
  },

  async onDisconnect(data) {
    console.log(`User ${data.context.user?.name} disconnected from ${data.documentName}`)
  },
})

server.listen()
console.log("Hocuspocus server running on port 1234")
