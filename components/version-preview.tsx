"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { X, RotateCcw, Clock, User, FileText } from "lucide-react"
import type { DocumentVersion } from "@/lib/version-storage"
import { formatVersionTimestamp, formatVersionSize } from "@/lib/version-storage"
import * as Y from "yjs"

interface VersionPreviewProps {
  version: DocumentVersion | null
  isOpen: boolean
  onClose: () => void
  onRestore: (versionId: string) => void
}

export function VersionPreview({ version, isOpen, onClose, onRestore }: VersionPreviewProps) {
  const [previewContent, setPreviewContent] = useState<string>("")

  useEffect(() => {
    if (version && isOpen) {
      try {
        // Create a temporary Y.Doc to render the version content
        const tempDoc = new Y.Doc()
        Y.applyUpdate(tempDoc, version.content)

        // Get the text content from the Y.Doc
        const yText = tempDoc.getText("default")
        const content = yText.toString()

        // For now, show raw content - in a real app you'd render it properly
        setPreviewContent(content || "Empty document")
      } catch (error) {
        console.error("Error loading version preview:", error)
        setPreviewContent("Error loading version content")
      }
    }
  }, [version, isOpen])

  if (!isOpen || !version) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl h-[80vh] flex flex-col">
        <CardHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle>{version.title}</CardTitle>
              <Badge variant={version.isAutoSave ? "secondary" : "default"}>
                {version.isAutoSave ? "Auto Save" : "Manual Save"}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={() => onRestore(version.id)}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Restore This Version
              </Button>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <User className="h-3 w-3" />
              <span>{version.author}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{formatVersionTimestamp(version.timestamp)}</span>
            </div>
            <div className="flex items-center gap-1">
              <FileText className="h-3 w-3" />
              <span>{formatVersionSize(version.content.length)}</span>
            </div>
          </div>

          {version.description && <p className="text-sm text-muted-foreground mt-2">{version.description}</p>}
        </CardHeader>

        <CardContent className="flex-1 overflow-hidden p-0">
          <ScrollArea className="h-full">
            <div className="p-6">
              <div className="prose prose-sm max-w-none">
                <div className="bg-muted/30 p-4 rounded-lg border">
                  <h4 className="text-sm font-medium mb-2 text-muted-foreground">Document Content Preview:</h4>
                  <div className="whitespace-pre-wrap text-sm">{previewContent}</div>
                </div>
              </div>
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}
