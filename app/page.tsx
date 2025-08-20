"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { FileText, Plus, ExternalLink } from "lucide-react"

export default function HomePage() {
  const [customDocId, setCustomDocId] = useState("")
  const [recentDocs] = useState([
    { id: "demo", title: "Demo Document", lastAccessed: new Date().toISOString() },
    { id: "project-notes", title: "Project Notes", lastAccessed: new Date(Date.now() - 86400000).toISOString() },
    { id: "meeting-minutes", title: "Meeting Minutes", lastAccessed: new Date(Date.now() - 172800000).toISOString() },
  ])
  const router = useRouter()

  const generateDocumentId = () => {
    const adjectives = ["swift", "bright", "clever", "bold", "calm", "eager", "gentle", "happy", "kind", "lively"]
    const nouns = ["falcon", "river", "mountain", "forest", "ocean", "star", "moon", "sun", "wind", "fire"]
    const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)]
    const randomNoun = nouns[Math.floor(Math.random() * nouns.length)]
    const randomNumber = Math.floor(Math.random() * 1000)
    return `${randomAdjective}-${randomNoun}-${randomNumber}`
  }

  const handleCreateNewDocument = () => {
    const newDocId = generateDocumentId()
    router.push(`/doc/${newDocId}`)
  }

  const handleJoinDocument = () => {
    if (customDocId.trim()) {
      router.push(`/doc/${customDocId.trim()}`)
    }
  }

  const formatLastAccessed = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 1) {
      return "Just now"
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)} hours ago`
    } else {
      const diffInDays = Math.floor(diffInHours / 24)
      return `${diffInDays} day${diffInDays > 1 ? "s" : ""} ago`
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-6">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-2">Collaborative Editor</h1>
          <p className="text-muted-foreground">Real-time collaborative document editing with TipTap and Y.js</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Create New Document */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Create New Document
              </CardTitle>
              <CardDescription>Start a new collaborative document with a unique ID</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={handleCreateNewDocument} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Create Document
              </Button>
              <div className="text-xs text-muted-foreground text-center">
                A unique document ID will be generated automatically
              </div>
            </CardContent>
          </Card>

          {/* Join Existing Document */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ExternalLink className="h-5 w-5" />
                Join Document
              </CardTitle>
              <CardDescription>Enter a document ID to join an existing collaboration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="docId">Document ID</Label>
                <Input
                  id="docId"
                  placeholder="Enter document ID"
                  value={customDocId}
                  onChange={(e) => setCustomDocId(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleJoinDocument()}
                />
              </div>
              <Button onClick={handleJoinDocument} disabled={!customDocId.trim()} className="w-full">
                Join Document
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Recent Documents */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Recent Documents
            </CardTitle>
            <CardDescription>Quick access to recently viewed documents</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentDocs.map((doc, index) => (
                <div key={doc.id}>
                  <Link
                    href={`/doc/${doc.id}`}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{doc.title}</p>
                        <p className="text-sm text-muted-foreground">ID: {doc.id}</p>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">{formatLastAccessed(doc.lastAccessed)}</div>
                  </Link>
                  {index < recentDocs.length - 1 && <Separator className="mt-2" />}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Access */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Access</CardTitle>
            <CardDescription>Try these sample documents</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button asChild variant="outline" className="w-full justify-start bg-transparent">
              <Link href="/doc/demo">
                <FileText className="h-4 w-4 mr-2" />
                Demo Document
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start bg-transparent">
              <Link href="/doc/getting-started">
                <FileText className="h-4 w-4 mr-2" />
                Getting Started Guide
              </Link>
            </Button>
          </CardContent>
        </Card>

        <div className="text-center text-sm text-muted-foreground">
          <p>Share document URLs with others to collaborate in real-time</p>
          <code className="bg-muted px-2 py-1 rounded text-xs mt-1 inline-block">/doc/your-document-id</code>
        </div>
      </div>
    </div>
  )
}
