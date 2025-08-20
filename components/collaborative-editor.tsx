"use client"

import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Collaboration from "@tiptap/extension-collaboration"
import { Table } from "@tiptap/extension-table"
import { TableRow } from "@tiptap/extension-table-row"
import { TableHeader } from "@tiptap/extension-table-header"
import { TableCell } from "@tiptap/extension-table-cell"
import * as Y from "yjs"
import { useEffect, useState, useRef } from "react"
import { EditorToolbar } from "./editor-toolbar"
import { UserPresence } from "./user-presence"
import { CommentsSidebar } from "./comments-sidebar"
import { AddCommentDialog } from "./add-comment-dialog"
import { VersionHistory } from "./version-history"
import { VersionPreview } from "./version-preview"
import { CommentExtension, type Comment } from "../extensions/comment-extension"
import { useVersionStorage } from "@/hooks/use-version-storage"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MessageSquare, Wifi, WifiOff, Save, Clock, History } from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface CollaborativeEditorProps {
  documentId: string
  userName: string
}

const generateUserColor = (name: string) => {
  const colors = [
    "#FF6B6B",
    "#4ECDC4",
    "#45B7D1",
    "#96CEB4",
    "#FFEAA7",
    "#DDA0DD",
    "#98D8C8",
    "#F7DC6F",
    "#BB8FCE",
    "#85C1E9",
  ]
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}

export interface User {
  name: string
  color: string
  clientId: number
}

export function CollaborativeEditor({ documentId, userName }: CollaborativeEditorProps) {
  const [ydoc] = useState(() => new Y.Doc())
  const [connectedUsers, setConnectedUsers] = useState<User[]>([])
  const [connectionStatus, setConnectionStatus] = useState<"connecting" | "connected" | "disconnected">("connecting")
  const [showCommentsSidebar, setShowCommentsSidebar] = useState(true)
  const [selectedCommentId, setSelectedCommentId] = useState<string | undefined>()
  const [showAddCommentDialog, setShowAddCommentDialog] = useState(false)
  const [selectedRange, setSelectedRange] = useState<{ from: number; to: number; text: string } | null>(null)
  const [isReady, setIsReady] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [lastSaveTime, setLastSaveTime] = useState<number>(0)
  const [showVersionHistory, setShowVersionHistory] = useState(false)
  const [showVersionPreview, setShowVersionPreview] = useState(false)
  const [previewVersion, setPreviewVersion] = useState<any>(null)

  const wsRef = useRef<WebSocket | null>(null)
  const clientIdRef = useRef<number>(Math.floor(Math.random() * 1000000))
  const awarenessRef = useRef<Map<number, User>>(new Map())
  const changeCountRef = useRef<number>(0)
  const lastChangeTimeRef = useRef<number>(0)

  const { versions, saveVersion, restoreVersion, deleteVersion, getVersion, compareVersions, lastAutoSave } =
    useVersionStorage(documentId, ydoc, userName)

  useEffect(() => {
    console.log("[v0] Connecting to WebSocket server...")

    const connectWebSocket = () => {
      try {
        const ws = new WebSocket("ws://localhost:1234")
        wsRef.current = ws

        ws.onopen = () => {
          console.log("[v0] WebSocket connected")
          setConnectionStatus("connected")

          ws.send(
            JSON.stringify({
              type: "join",
              docName: documentId,
              clientId: clientIdRef.current,
            }),
          )

          const userState: User = {
            name: userName,
            color: generateUserColor(userName),
            clientId: clientIdRef.current,
          }

          ws.send(
            JSON.stringify({
              type: "awareness",
              state: userState,
            }),
          )

          setIsReady(true)
        }

        ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data)
            console.log("[v0] Received message:", message.type)

            switch (message.type) {
              case "sync":
                const update = new Uint8Array(message.update)
                Y.applyUpdate(ydoc, update)
                break

              case "update":
                const docUpdate = new Uint8Array(message.update)
                Y.applyUpdate(ydoc, docUpdate)
                break

              case "awareness":
                if (message.states) {
                  const users: User[] = message.states.map(([clientId, state]: [number, User]) => state)
                  setConnectedUsers(users)
                } else if (message.clientId && message.state) {
                  awarenessRef.current.set(message.clientId, message.state)
                  setConnectedUsers(Array.from(awarenessRef.current.values()))
                } else if (message.clientId && message.state === null) {
                  awarenessRef.current.delete(message.clientId)
                  setConnectedUsers(Array.from(awarenessRef.current.values()))
                }
                break

              case "version-notification":
                handleVersionNotification(message)
                break

              case "version-sync":
                console.log("[v0] Received version sync:", message.versions.length, "versions")
                break
            }
          } catch (error) {
            console.error("[v0] Error processing WebSocket message:", error)
          }
        }

        ws.onclose = () => {
          console.log("[v0] WebSocket disconnected")
          setConnectionStatus("disconnected")
          setIsReady(false)

          setTimeout(() => {
            if (wsRef.current?.readyState === WebSocket.CLOSED) {
              console.log("[v0] Attempting to reconnect...")
              setConnectionStatus("connecting")
              connectWebSocket()
            }
          }, 3000)
        }

        ws.onerror = (error) => {
          console.error("[v0] WebSocket error:", error)
          setConnectionStatus("disconnected")
        }
      } catch (error) {
        console.error("[v0] Failed to create WebSocket connection:", error)
        setConnectionStatus("disconnected")
      }
    }

    const updateHandler = (update: Uint8Array) => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: "update",
            update: Array.from(update),
          }),
        )
      }

      changeCountRef.current += 1
      lastChangeTimeRef.current = Date.now()
      setHasUnsavedChanges(true)

      if (changeCountRef.current >= 50 || Date.now() - lastChangeTimeRef.current > 10 * 60 * 1000) {
        handleAutoSave()
      }
    }

    ydoc.on("update", updateHandler)
    connectWebSocket()

    return () => {
      ydoc.off("update", updateHandler)
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [documentId, userName, ydoc])

  const handleAutoSave = () => {
    if (hasUnsavedChanges) {
      saveVersion(undefined, "Auto-saved changes", true)
      setHasUnsavedChanges(false)
      changeCountRef.current = 0
      setLastSaveTime(Date.now())
    }
  }

  const handleManualSave = () => {
    const title = prompt("Enter a title for this version (optional):")
    const description = prompt("Enter a description for this version (optional):")

    const version = saveVersion(
      title || `Manual save - ${new Date().toLocaleString()}`,
      description || undefined,
      false,
    )

    if (version) {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: "version-created",
            version: {
              id: version.id,
              title: version.title,
              author: version.author,
              timestamp: version.timestamp,
              description: version.description,
              isAutoSave: version.isAutoSave,
            },
          }),
        )
      }

      setHasUnsavedChanges(false)
      changeCountRef.current = 0
      setLastSaveTime(Date.now())
    }
  }

  const handleAddComment = (content: string) => {
    if (!selectedRange) return

    const yComments = ydoc.getMap("comments")
    const commentId = `comment-${Date.now()}-${Math.random()}`

    const newComment: Comment = {
      id: commentId,
      author: userName,
      content,
      timestamp: Date.now(),
      replies: [],
      resolved: false,
      range: {
        from: selectedRange.from,
        to: selectedRange.to,
      },
    }

    yComments.set(commentId, newComment)
    setSelectedRange(null)
  }

  const handleCommentClick = (commentId: string) => {
    setSelectedCommentId(commentId)
  }

  const handleRestoreVersion = async (versionId: string) => {
    try {
      const success = restoreVersion(versionId)
      if (success) {
        const restoredVersion = getVersion(versionId)
        if (restoredVersion) {
          saveVersion(
            `Restored to: ${restoredVersion.title}`,
            `Restored from version ${restoredVersion.version} created by ${restoredVersion.author}`,
            false,
          )

          if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(
              JSON.stringify({
                type: "version-restored",
                version: restoredVersion,
                author: userName,
              }),
            )
          }
        }

        setHasUnsavedChanges(false)
        changeCountRef.current = 0
        setLastSaveTime(Date.now())
        setShowVersionHistory(false)
        setShowVersionPreview(false)

        toast({
          title: "Version Restored",
          description: "Document has been restored to the selected version.",
        })
      } else {
        toast({
          title: "Restoration Failed",
          description: "Failed to restore the document version.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error restoring version:", error)
      toast({
        title: "Restoration Error",
        description: "An error occurred while restoring the version.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteVersion = (versionId: string) => {
    try {
      const success = deleteVersion(versionId)
      if (success) {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(
            JSON.stringify({
              type: "version-deleted",
              versionId,
              author: userName,
            }),
          )
        }

        toast({
          title: "Version Deleted",
          description: "The version has been successfully deleted.",
        })
      } else {
        toast({
          title: "Deletion Failed",
          description: "Failed to delete the version.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error deleting version:", error)
      toast({
        title: "Deletion Error",
        description: "An error occurred while deleting the version.",
        variant: "destructive",
      })
    }
  }

  const handlePreviewVersion = (versionId: string) => {
    const version = getVersion(versionId)
    if (version) {
      setPreviewVersion(version)
      setShowVersionPreview(true)
    }
  }

  const handleCompareVersions = (versionId1: string, versionId2: string) => {
    const comparison = compareVersions(versionId1, versionId2)
    if (comparison) {
      toast({
        title: "Version Comparison",
        description: `Comparing "${comparison.version1.title}" with "${comparison.version2.title}". Size difference: ${comparison.sizeDiff} bytes.`,
      })
    }
  }

  const handleVersionNotification = (message: any) => {
    switch (message.action) {
      case "created":
        if (message.author !== userName) {
          toast({
            title: "New Version Created",
            description: `${message.author} created "${message.version.title}"`,
          })
        }
        break

      case "restored":
        if (message.author !== userName) {
          toast({
            title: "Version Restored",
            description: `${message.author} restored "${message.version.title}"`,
          })
          setTimeout(() => {
            if (editor) {
              editor.commands.focus()
            }
          }, 100)
        }
        break

      case "deleted":
        if (message.author !== userName) {
          toast({
            title: "Version Deleted",
            description: `${message.author} deleted "${message.versionTitle}"`,
          })
        }
        break
    }
  }

  const editor = useEditor(
    {
      extensions: [
        StarterKit.configure({
          history: false,
        }),
        Collaboration.configure({
          document: ydoc,
        }),
        Table.configure({
          resizable: true,
        }),
        TableRow,
        TableHeader,
        TableCell,
        CommentExtension.configure({
          ydoc,
          onCommentClick: handleCommentClick,
          onAddComment: handleAddComment,
        }),
      ],
      content: "<p>Start typing to begin collaborating...</p>",
      editorProps: {
        attributes: {
          class: "prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[500px] p-6",
        },
      },
    },
    [ydoc, isReady],
  )

  const handleAddCommentClick = () => {
    if (!editor) return

    const { from, to } = editor.state.selection
    if (from === to) return

    const selectedText = editor.state.doc.textBetween(from, to)
    setSelectedRange({ from, to, text: selectedText })
    setShowAddCommentDialog(true)
  }

  const formatLastSaveTime = (timestamp: number) => {
    if (timestamp === 0) return "Never"
    const now = Date.now()
    const diff = now - timestamp
    const minutes = Math.floor(diff / (1000 * 60))

    if (minutes < 1) return "Just now"
    if (minutes < 60) return `${minutes}m ago`

    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`

    return new Date(timestamp).toLocaleDateString()
  }

  if (!editor || !isReady) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-muted-foreground mb-2">
            {connectionStatus === "connecting" ? "Connecting to collaboration server..." : "Connection failed"}
          </div>
          <div className="text-sm text-muted-foreground mb-4">Status: {connectionStatus}</div>
          {connectionStatus === "connecting" && (
            <div className="text-xs text-muted-foreground max-w-md">
              <p className="mb-2">Connecting to WebSocket server at ws://localhost:1234</p>
              <p>Make sure the collaboration server is running.</p>
            </div>
          )}
          {connectionStatus === "disconnected" && (
            <div className="text-xs text-muted-foreground max-w-md">
              <p className="mb-2">Failed to connect to collaboration server.</p>
              <p>Please start the WebSocket server and refresh the page.</p>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen">
      <div className="flex-1 flex flex-col">
        <div className="p-4 border-b flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Document: {documentId}</h1>
            <p className="text-sm text-muted-foreground">
              Editing as: <span className="font-medium">{userName}</span>
              {hasUnsavedChanges && <span className="ml-2 text-orange-600">• Unsaved changes</span>}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              <Clock className="h-3 w-3 inline mr-1" />
              Last saved: {formatLastSaveTime(Math.max(lastSaveTime, lastAutoSave))}
              {versions.length > 0 && <span className="ml-2">• {versions.length} versions</span>}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <UserPresence users={connectedUsers} currentUser={userName} />
            <Button
              variant="outline"
              size="sm"
              onClick={handleManualSave}
              className={hasUnsavedChanges ? "border-orange-500 text-orange-600" : ""}
            >
              <Save className="h-4 w-4 mr-2" />
              Save Version
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleAddCommentClick}
              disabled={editor.state.selection.from === editor.state.selection.to}
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Add Comment
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowCommentsSidebar(!showCommentsSidebar)}>
              {showCommentsSidebar ? "Hide" : "Show"} Comments
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowVersionHistory(true)}
              disabled={versions.length === 0}
            >
              <History className="h-4 w-4 mr-2" />
              Version History
            </Button>
            <div className="text-sm text-muted-foreground flex items-center gap-1">
              {connectionStatus === "connected" ? (
                <>
                  <Wifi className="h-4 w-4 text-green-600" />
                  <span className="text-green-600">Connected</span>
                </>
              ) : connectionStatus === "connecting" ? (
                <>
                  <Wifi className="h-4 w-4 text-yellow-600" />
                  <span className="text-yellow-600">Connecting...</span>
                </>
              ) : (
                <>
                  <WifiOff className="h-4 w-4 text-red-600" />
                  <span className="text-red-600">Disconnected</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          <Card className="h-full rounded-none border-0 border-r">
            <EditorToolbar editor={editor} />
            <div className="border-t h-full overflow-auto">
              <EditorContent editor={editor} />
            </div>
          </Card>
        </div>
      </div>

      {showCommentsSidebar && (
        <CommentsSidebar
          ydoc={ydoc}
          userName={userName}
          selectedCommentId={selectedCommentId}
          onCommentSelect={setSelectedCommentId}
        />
      )}

      <AddCommentDialog
        isOpen={showAddCommentDialog}
        onClose={() => setShowAddCommentDialog(false)}
        onSubmit={handleAddComment}
        selectedText={selectedRange?.text || ""}
      />

      <VersionHistory
        versions={versions}
        onRestore={handleRestoreVersion}
        onDelete={handleDeleteVersion}
        onCompare={handleCompareVersions}
        onPreview={handlePreviewVersion}
        isOpen={showVersionHistory}
        onClose={() => setShowVersionHistory(false)}
        currentUser={userName}
      />

      <VersionPreview
        version={previewVersion}
        isOpen={showVersionPreview}
        onClose={() => setShowVersionPreview(false)}
        onRestore={handleRestoreVersion}
      />
    </div>
  )
}
