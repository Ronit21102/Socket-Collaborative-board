"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { CollaborativeEditor } from "@/components/collaborative-editor"
import { UserNameDialog } from "@/components/user-name-dialog"
import { DocumentHeader } from "@/components/document-header"

interface DocPageProps {
  params: {
    id: string
  }
}

export default function DocPage({ params }: DocPageProps) {
  const [userName, setUserName] = useState<string>("")
  const [isNameSet, setIsNameSet] = useState(false)
  const [documentTitle, setDocumentTitle] = useState<string>("")
  const router = useRouter()

  useEffect(() => {
    // Check if user name is stored in localStorage
    const storedName = localStorage.getItem("collaborativeEditor_userName")
    if (storedName) {
      setUserName(storedName)
      setIsNameSet(true)
    }

    // Set initial document title based on ID
    const formattedTitle = params.id
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
    setDocumentTitle(formattedTitle)

    if (params.id === "new") {
      const generateDocumentId = () => {
        const adjectives = ["swift", "bright", "clever", "bold", "calm", "eager", "gentle", "happy", "kind", "lively"]
        const nouns = ["falcon", "river", "mountain", "forest", "ocean", "star", "moon", "sun", "wind", "fire"]
        const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)]
        const randomNoun = nouns[Math.floor(Math.random() * nouns.length)]
        const randomNumber = Math.floor(Math.random() * 1000)
        return `${randomAdjective}-${randomNoun}-${randomNumber}`
      }

      const newDocId = generateDocumentId()
      router.replace(`/doc/${newDocId}`)
      return
    }
  }, [params.id, router])

  const handleNameSubmit = (name: string) => {
    setUserName(name)
    setIsNameSet(true)
    localStorage.setItem("collaborativeEditor_userName", name)
  }

  const handleTitleChange = (newTitle: string) => {
    setDocumentTitle(newTitle)
  }

  if (params.id === "new") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Creating new document...</div>
      </div>
    )
  }

  if (!isNameSet) {
    return <UserNameDialog onSubmit={handleNameSubmit} documentId={params.id} />
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <DocumentHeader
        documentId={params.id}
        documentTitle={documentTitle}
        onTitleChange={handleTitleChange}
        userName={userName}
      />
      <div className="flex-1">
        <CollaborativeEditor documentId={params.id} userName={userName} />
      </div>
    </div>
  )
}
