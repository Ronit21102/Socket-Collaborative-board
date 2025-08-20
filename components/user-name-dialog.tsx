"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { FileText, Users } from "lucide-react"

interface UserNameDialogProps {
  onSubmit: (name: string) => void
  documentId: string
}

export function UserNameDialog({ onSubmit, documentId }: UserNameDialogProps) {
  const [name, setName] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (name.trim()) {
      onSubmit(name.trim())
    }
  }

  const formatDocumentTitle = (id: string) => {
    return id
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <FileText className="h-6 w-6" />
            <Badge variant="secondary" className="text-xs">
              {documentId}
            </Badge>
          </div>
          <CardTitle className="flex items-center justify-center gap-2">
            <Users className="h-5 w-5" />
            Join Collaboration
          </CardTitle>
          <CardDescription>
            Enter your name to start collaborating on "{formatDocumentTitle(documentId)}"
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Your Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
                required
              />
              <p className="text-xs text-muted-foreground">This name will be visible to other collaborators</p>
            </div>
            <Button type="submit" className="w-full" disabled={!name.trim()}>
              Join Document
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
