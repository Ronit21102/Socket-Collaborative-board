import { WebSocketServer } from "ws"
import * as Y from "yjs"

const wss = new WebSocketServer({ port: 1234 })
const docs = new Map()

console.log("[v0] WebSocket server starting on port 1234...")

function getYDoc(docName) {
  if (!docs.has(docName)) {
    const doc = new Y.Doc()
    docs.set(docName, {
      doc,
      connections: new Set(),
      awareness: new Map(),
      versions: new Map(), // Store version metadata for collaborative notifications
      lastVersionTime: 0,
    })
    console.log(`[v0] Created new document: ${docName}`)
  }
  return docs.get(docName)
}

wss.on("connection", (ws, req) => {
  console.log("[v0] New WebSocket connection")

  let docName = null
  let clientId = null

  ws.on("message", (data) => {
    try {
      const message = JSON.parse(data.toString())
      console.log(`[v0] Received message type: ${message.type}`)

      switch (message.type) {
        case "join":
          docName = message.docName
          clientId = message.clientId

          const docData = getYDoc(docName)
          docData.connections.add(ws)

          // Send current document state
          const state = Y.encodeStateAsUpdate(docData.doc)
          ws.send(
            JSON.stringify({
              type: "sync",
              update: Array.from(state),
            }),
          )

          // Send current awareness states
          const awarenessStates = Array.from(docData.awareness.entries())
          ws.send(
            JSON.stringify({
              type: "awareness",
              states: awarenessStates,
            }),
          )

          const versionMetadata = Array.from(docData.versions.values())
          if (versionMetadata.length > 0) {
            ws.send(
              JSON.stringify({
                type: "version-sync",
                versions: versionMetadata,
              }),
            )
          }

          console.log(`[v0] Client ${clientId} joined document ${docName}`)
          break

        case "update":
          if (docName) {
            const docData = getYDoc(docName)
            const update = new Uint8Array(message.update)
            Y.applyUpdate(docData.doc, update)

            // Broadcast to other clients
            const broadcastMessage = JSON.stringify({
              type: "update",
              update: message.update,
            })

            docData.connections.forEach((client) => {
              if (client !== ws && client.readyState === 1) {
                client.send(broadcastMessage)
              }
            })
          }
          break

        case "awareness":
          if (docName && clientId) {
            const docData = getYDoc(docName)
            docData.awareness.set(clientId, message.state)

            // Broadcast awareness to other clients
            const awarenessMessage = JSON.stringify({
              type: "awareness",
              clientId,
              state: message.state,
            })

            docData.connections.forEach((client) => {
              if (client !== ws && client.readyState === 1) {
                client.send(awarenessMessage)
              }
            })
          }
          break

        case "version-created":
          if (docName && message.version) {
            const docData = getYDoc(docName)
            docData.versions.set(message.version.id, message.version)
            docData.lastVersionTime = Date.now()

            // Broadcast version creation to other clients
            const versionMessage = JSON.stringify({
              type: "version-notification",
              action: "created",
              version: message.version,
              author: message.version.author,
            })

            docData.connections.forEach((client) => {
              if (client !== ws && client.readyState === 1) {
                client.send(versionMessage)
              }
            })

            console.log(`[v0] Version created: ${message.version.title} by ${message.version.author}`)
          }
          break

        case "version-restored":
          if (docName && message.version) {
            const docData = getYDoc(docName)

            // Broadcast version restoration to other clients
            const restoreMessage = JSON.stringify({
              type: "version-notification",
              action: "restored",
              version: message.version,
              author: message.author,
            })

            docData.connections.forEach((client) => {
              if (client !== ws && client.readyState === 1) {
                client.send(restoreMessage)
              }
            })

            console.log(`[v0] Version restored: ${message.version.title} by ${message.author}`)
          }
          break

        case "version-deleted":
          if (docName && message.versionId) {
            const docData = getYDoc(docName)
            const deletedVersion = docData.versions.get(message.versionId)
            docData.versions.delete(message.versionId)

            // Broadcast version deletion to other clients
            const deleteMessage = JSON.stringify({
              type: "version-notification",
              action: "deleted",
              versionId: message.versionId,
              versionTitle: deletedVersion?.title || "Unknown Version",
              author: message.author,
            })

            docData.connections.forEach((client) => {
              if (client !== ws && client.readyState === 1) {
                client.send(deleteMessage)
              }
            })

            console.log(`[v0] Version deleted: ${message.versionId} by ${message.author}`)
          }
          break
      }
    } catch (error) {
      console.error("[v0] Error processing message:", error)
    }
  })

  ws.on("close", () => {
    console.log("[v0] WebSocket connection closed")
    if (docName) {
      const docData = docs.get(docName)
      if (docData) {
        docData.connections.delete(ws)
        if (clientId) {
          docData.awareness.delete(clientId)

          // Broadcast awareness removal
          const awarenessMessage = JSON.stringify({
            type: "awareness",
            clientId,
            state: null,
          })

          docData.connections.forEach((client) => {
            if (client.readyState === 1) {
              client.send(awarenessMessage)
            }
          })
        }
      }
    }
  })

  ws.on("error", (error) => {
    console.error("[v0] WebSocket error:", error)
  })
})

console.log("[v0] WebSocket server ready on ws://localhost:1234")
