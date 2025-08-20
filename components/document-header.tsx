"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ArrowLeft, Share2, Check, Edit2 } from "lucide-react"

interface DocumentHeaderProps {
  documentId: string
  documentTitle: string
  onTitleChange: (title: string) => void
  userName: string
}

export function DocumentHeader({ documentId, documentTitle, onTitleChange, userName }: DocumentHeaderProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [tempTitle, setTempTitle] = useState(documentTitle)
  const [copied, setCopied] = useState(false)
  const router = useRouter()

  const handleTitleSubmit = () => {
    if (tempTitle.trim()) {
      onTitleChange(tempTitle.trim())
    } else {
      setTempTitle(documentTitle)
    }
    setIsEditingTitle(false)
  }

  const handleShareDocument = async () => {
    const url = window.location.href
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      // Fallback for browsers that don't support clipboard API
      console.error("Failed to copy URL:", err)
    }
  }

  return (
    <TooltipProvider>
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => router.push("/")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Home
            </Button>

            <div className="flex items-center gap-2">
              {isEditingTitle ? (
                <Input
                  value={tempTitle}
                  onChange={(e) => setTempTitle(e.target.value)}
                  onBlur={handleTitleSubmit}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleTitleSubmit()
                    if (e.key === "Escape") {
                      setTempTitle(documentTitle)
                      setIsEditingTitle(false)
                    }
                  }}
                  className="text-lg font-semibold border-none p-0 h-auto focus-visible:ring-0"
                  autoFocus
                />
              ) : (
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-semibold">{documentTitle}</h1>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setTempTitle(documentTitle)
                      setIsEditingTitle(true)
                    }}
                  >
                    <Edit2 className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>

            <Badge variant="secondary" className="text-xs font-mono">
              {documentId}
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            <div className="text-sm text-muted-foreground">
              Editing as: <span className="font-medium">{userName}</span>
            </div>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm" onClick={handleShareDocument}>
                  {copied ? <Check className="h-4 w-4 mr-2" /> : <Share2 className="h-4 w-4 mr-2" />}
                  {copied ? "Copied!" : "Share"}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Copy document URL to share with others</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}
