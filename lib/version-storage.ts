import * as Y from "yjs"

export interface DocumentVersion {
  id: string
  documentId: string
  version: number
  title: string
  content: Uint8Array // Y.js document state
  author: string
  timestamp: number
  description?: string
  isAutoSave: boolean
}

export interface VersionMetadata {
  id: string
  version: number
  title: string
  author: string
  timestamp: number
  description?: string
  isAutoSave: boolean
  size: number
}

export class VersionStorage {
  private storageKey: string

  constructor(documentId: string) {
    this.storageKey = `doc-versions-${documentId}`
  }

  // Save a new version of the document
  saveVersion(ydoc: Y.Doc, author: string, title?: string, description?: string, isAutoSave = false): DocumentVersion {
    const versions = this.getVersions()
    const nextVersion = versions.length > 0 ? Math.max(...versions.map((v) => v.version)) + 1 : 1

    const content = Y.encodeStateAsUpdate(ydoc)
    const versionId = `v${nextVersion}-${Date.now()}`

    const newVersion: DocumentVersion = {
      id: versionId,
      documentId: this.getDocumentId(),
      version: nextVersion,
      title: title || `Version ${nextVersion}`,
      content,
      author,
      timestamp: Date.now(),
      description,
      isAutoSave,
    }

    versions.push(newVersion)

    // Keep only the last 50 versions to prevent storage overflow
    if (versions.length > 50) {
      versions.splice(0, versions.length - 50)
    }

    this.saveVersions(versions)
    return newVersion
  }

  // Get all versions metadata (without content for performance)
  getVersionsMetadata(): VersionMetadata[] {
    const versions = this.getVersions()
    return versions
      .map((v) => ({
        id: v.id,
        version: v.version,
        title: v.title,
        author: v.author,
        timestamp: v.timestamp,
        description: v.description,
        isAutoSave: v.isAutoSave,
        size: v.content.length,
      }))
      .sort((a, b) => b.version - a.version)
  }

  // Get a specific version by ID
  getVersion(versionId: string): DocumentVersion | null {
    const versions = this.getVersions()
    return versions.find((v) => v.id === versionId) || null
  }

  // Get the latest version
  getLatestVersion(): DocumentVersion | null {
    const versions = this.getVersions()
    if (versions.length === 0) return null

    return versions.reduce((latest, current) => (current.version > latest.version ? current : latest))
  }

  // Restore a document to a specific version
  restoreVersion(versionId: string): Y.Doc | null {
    const version = this.getVersion(versionId)
    if (!version) return null

    const ydoc = new Y.Doc()
    Y.applyUpdate(ydoc, version.content)
    return ydoc
  }

  // Delete a specific version
  deleteVersion(versionId: string): boolean {
    const versions = this.getVersions()
    const index = versions.findIndex((v) => v.id === versionId)

    if (index === -1) return false

    versions.splice(index, 1)
    this.saveVersions(versions)
    return true
  }

  // Compare two versions and return diff information
  compareVersions(
    versionId1: string,
    versionId2: string,
  ): {
    version1: VersionMetadata
    version2: VersionMetadata
    sizeDiff: number
  } | null {
    const v1 = this.getVersion(versionId1)
    const v2 = this.getVersion(versionId2)

    if (!v1 || !v2) return null

    return {
      version1: {
        id: v1.id,
        version: v1.version,
        title: v1.title,
        author: v1.author,
        timestamp: v1.timestamp,
        description: v1.description,
        isAutoSave: v1.isAutoSave,
        size: v1.content.length,
      },
      version2: {
        id: v2.id,
        version: v2.version,
        title: v2.title,
        author: v2.author,
        timestamp: v2.timestamp,
        description: v2.description,
        isAutoSave: v2.isAutoSave,
        size: v2.content.length,
      },
      sizeDiff: v2.content.length - v1.content.length,
    }
  }

  private getDocumentId(): string {
    return this.storageKey.replace("doc-versions-", "")
  }

  private getVersions(): DocumentVersion[] {
    try {
      const stored = localStorage.getItem(this.storageKey)
      if (!stored) return []

      const parsed = JSON.parse(stored)
      return parsed.map((v: any) => ({
        ...v,
        content: new Uint8Array(v.content),
      }))
    } catch (error) {
      console.error("Error loading versions:", error)
      return []
    }
  }

  private saveVersions(versions: DocumentVersion[]): void {
    try {
      const serializable = versions.map((v) => ({
        ...v,
        content: Array.from(v.content),
      }))
      localStorage.setItem(this.storageKey, JSON.stringify(serializable))
    } catch (error) {
      console.error("Error saving versions:", error)
    }
  }
}

// Utility functions for version management
export const formatVersionTimestamp = (timestamp: number): string => {
  const date = new Date(timestamp)
  const now = new Date()
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

  if (diffInMinutes < 1) return "Just now"
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`

  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) return `${diffInHours}h ago`

  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 7) return `${diffInDays}d ago`

  return date.toLocaleDateString()
}

export const formatVersionSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
