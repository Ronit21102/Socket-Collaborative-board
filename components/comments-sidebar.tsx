"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { MessageSquare, Reply, Check, X } from "lucide-react"
import type { Comment } from "../extensions/comment-extension"
import type * as Y from "yjs"

interface CommentsSidebarProps {
  ydoc: Y.Doc
  userName: string
  selectedCommentId?: string
  onCommentSelect: (commentId: string | undefined) => void
}

export function CommentsSidebar({ ydoc, userName, selectedCommentId, onCommentSelect }: CommentsSidebarProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [replyContent, setReplyContent] = useState<{ [commentId: string]: string }>({})
  const [showReplyForm, setShowReplyForm] = useState<{ [commentId: string]: boolean }>({})

  useEffect(() => {
    const yComments = ydoc.getMap("comments")

    const updateComments = () => {
      const commentsArray: Comment[] = []
      yComments.forEach((comment) => {
        commentsArray.push(comment as Comment)
      })
      // Sort by timestamp, newest first
      commentsArray.sort((a, b) => b.timestamp - a.timestamp)
      setComments(commentsArray)
    }

    updateComments()
    yComments.observe(updateComments)

    return () => {
      yComments.unobserve(updateComments)
    }
  }, [ydoc])

  const addReply = (commentId: string) => {
    const content = replyContent[commentId]?.trim()
    if (!content) return

    const yComments = ydoc.getMap("comments")
    const comment = yComments.get(commentId) as Comment

    if (comment) {
      const newReply: Comment = {
        id: `reply-${Date.now()}-${Math.random()}`,
        author: userName,
        content,
        timestamp: Date.now(),
        replies: [],
        resolved: false,
        range: comment.range,
      }

      const updatedComment = {
        ...comment,
        replies: [...comment.replies, newReply],
      }

      yComments.set(commentId, updatedComment)
    }

    setReplyContent({ ...replyContent, [commentId]: "" })
    setShowReplyForm({ ...showReplyForm, [commentId]: false })
  }

  const resolveComment = (commentId: string) => {
    const yComments = ydoc.getMap("comments")
    const comment = yComments.get(commentId) as Comment

    if (comment) {
      yComments.set(commentId, { ...comment, resolved: true })
    }
  }

  const deleteComment = (commentId: string) => {
    const yComments = ydoc.getMap("comments")
    yComments.delete(commentId)
    if (selectedCommentId === commentId) {
      onCommentSelect(undefined)
    }
  }

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInHours * 60)
      return `${diffInMinutes}m ago`
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`
    } else {
      return date.toLocaleDateString()
    }
  }

  const handleCommentHover = (commentId: string, isHovering: boolean) => {
    const commentElements = document.querySelectorAll(`[data-comment-id="${commentId}"]`)
    commentElements.forEach((element) => {
      if (isHovering) {
        element.classList.add("comment-hover-highlight")
      } else {
        element.classList.remove("comment-hover-highlight")
      }
    })
  }

  const handleCommentClick = (commentId: string) => {
    onCommentSelect(commentId)
    // Scroll the highlighted text into view
    const commentElement = document.querySelector(`[data-comment-id="${commentId}"]`)
    if (commentElement) {
      commentElement.scrollIntoView({ behavior: "smooth", block: "center" })
    }
  }

  const activeComments = comments.filter((comment) => !comment.resolved)
  const resolvedComments = comments.filter((comment) => comment.resolved)

  return (
    <div className="w-80 border-l bg-background flex flex-col h-full">
      <div className="p-4 border-b">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          <h3 className="font-semibold">Comments</h3>
          <Badge variant="secondary" className="ml-auto">
            {activeComments.length}
          </Badge>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {activeComments.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No comments yet</p>
              <p className="text-sm">Select text and add a comment to get started</p>
            </div>
          ) : (
            activeComments.map((comment) => (
              <Card
                key={comment.id}
                className={`cursor-pointer transition-all duration-200 ${
                  selectedCommentId === comment.id ? "ring-2 ring-primary" : ""
                }`}
                onClick={() => handleCommentClick(comment.id)}
                onMouseEnter={() => handleCommentHover(comment.id, true)}
                onMouseLeave={() => handleCommentHover(comment.id, false)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-xs">{comment.author.charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{comment.author}</p>
                        <p className="text-xs text-muted-foreground">{formatTimestamp(comment.timestamp)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {comment.replies.length > 0 && (
                        <Badge variant="outline" className="text-xs px-1">
                          {comment.replies.length + 1}
                        </Badge>
                      )}
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation()
                            resolveComment(comment.id)
                          }}
                        >
                          <Check className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation()
                            deleteComment(comment.id)
                          }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-sm mb-3">{comment.content}</p>

                  {comment.replies.length > 0 && (
                    <div className="space-y-2 mb-3">
                      <Separator />
                      {comment.replies.map((reply) => (
                        <div key={reply.id} className="flex gap-2 text-sm">
                          <Avatar className="h-5 w-5">
                            <AvatarFallback className="text-xs">{reply.author.charAt(0).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium">{reply.author}</span>
                              <span className="text-xs text-muted-foreground">{formatTimestamp(reply.timestamp)}</span>
                            </div>
                            <p>{reply.content}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {showReplyForm[comment.id] ? (
                    <div className="space-y-2">
                      <Textarea
                        placeholder="Write a reply..."
                        value={replyContent[comment.id] || ""}
                        onChange={(e) => setReplyContent({ ...replyContent, [comment.id]: e.target.value })}
                        className="min-h-[60px]"
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            addReply(comment.id)
                          }}
                        >
                          Reply
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation()
                            setShowReplyForm({ ...showReplyForm, [comment.id]: false })
                            setReplyContent({ ...replyContent, [comment.id]: "" })
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation()
                        setShowReplyForm({ ...showReplyForm, [comment.id]: true })
                      }}
                    >
                      <Reply className="h-3 w-3 mr-1" />
                      Reply
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))
          )}

          {resolvedComments.length > 0 && (
            <div className="mt-8">
              <Separator className="mb-4" />
              <h4 className="text-sm font-medium text-muted-foreground mb-4">
                Resolved Comments ({resolvedComments.length})
              </h4>
              {resolvedComments.map((comment) => (
                <Card key={comment.id} className="opacity-60">
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-xs">{comment.author.charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{comment.author}</p>
                        <p className="text-xs text-muted-foreground">{formatTimestamp(comment.timestamp)}</p>
                      </div>
                      <Badge variant="secondary" className="ml-auto text-xs">
                        Resolved
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-sm">{comment.content}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
