"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MessageSquare, X } from "lucide-react"

interface AddCommentDialogProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (content: string) => void
  selectedText: string
}

export function AddCommentDialog({ isOpen, onClose, onSubmit, selectedText }: AddCommentDialogProps) {
  const [content, setContent] = useState("")

  if (!isOpen) return null

  const handleSubmit = () => {
    if (content.trim()) {
      onSubmit(content.trim())
      setContent("")
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Add Comment
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-2">Selected text:</p>
            <div className="bg-muted p-2 rounded text-sm italic">"{selectedText}"</div>
          </div>
          <div>
            <Textarea
              placeholder="Write your comment..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[100px]"
              autoFocus
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={!content.trim()}>
              Add Comment
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
