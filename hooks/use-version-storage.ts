"use client"

import { useState, useEffect, useCallback } from "react"
import { VersionStorage, type VersionMetadata } from "@/lib/version-storage"
import type * as Y from "yjs"

export function useVersionStorage(documentId: string, ydoc: Y.Doc, userName: string) {
  const [versionStorage] = useState(() => new VersionStorage(documentId))
  const [versions, setVersions] = useState<VersionMetadata[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [lastAutoSave, setLastAutoSave] = useState<number>(0)

  // Load versions metadata
  const loadVersions = useCallback(() => {
    setIsLoading(true)
    try {
      const metadata = versionStorage.getVersionsMetadata()
      setVersions(metadata)
    } catch (error) {
      console.error("Error loading versions:", error)
    } finally {
      setIsLoading(false)
    }
  }, [versionStorage])

  // Save a new version
  const saveVersion = useCallback(
    (title?: string, description?: string, isAutoSave = false) => {
      try {
        const fragment = ydoc.getXmlFragment("default")
        const textContent = fragment.toString()
        console.log("[v0] Saving version - Document content length:", textContent.length)
        console.log("[v0] Document fragment length:", fragment.length)

        // Only save if there's actual content
        if (fragment.length === 0 && textContent.trim().length === 0) {
          console.log("[v0] Skipping version save - document is empty")
          return null
        }

        const newVersion = versionStorage.saveVersion(ydoc, userName, title, description, isAutoSave)
        loadVersions()

        if (isAutoSave) {
          setLastAutoSave(Date.now())
        }

        console.log("[v0] Version saved successfully:", newVersion.id, "Size:", newVersion.content.length)
        return newVersion
      } catch (error) {
        console.error("Error saving version:", error)
        return null
      }
    },
    [versionStorage, ydoc, userName, loadVersions],
  )

  // Auto-save functionality
  const autoSave = useCallback(() => {
    const now = Date.now()
    // Auto-save every 5 minutes if there are changes
    if (now - lastAutoSave > 5 * 60 * 1000) {
      saveVersion(undefined, "Auto-saved version", true)
    }
  }, [saveVersion, lastAutoSave])

  // Restore a version
  const restoreVersion = useCallback(
    (versionId: string) => {
      try {
        const restoredDoc = versionStorage.restoreVersion(versionId)
        if (!restoredDoc) return false

        console.log("[v0] Restoring version:", versionId)

        ydoc.transact(() => {
          // Get the current and restored fragments
          const currentFragment = ydoc.getXmlFragment("default")
          const restoredFragment = restoredDoc.getXmlFragment("default")

          console.log("[v0] Current fragment length:", currentFragment.length)
          console.log("[v0] Restored fragment length:", restoredFragment.length)

          // Clear current content
          if (currentFragment.length > 0) {
            currentFragment.delete(0, currentFragment.length)
          }

          // Insert restored content
          if (restoredFragment.length > 0) {
            // Clone the content from restored document
            const restoredContent = restoredFragment.toArray()
            restoredContent.forEach((item, index) => {
              currentFragment.insert(index, [item.clone()])
            })
          }
        })

        console.log("[v0] Version restored successfully")
        return true
      } catch (error) {
        console.error("Error restoring version:", error)
        return false
      }
    },
    [versionStorage, ydoc],
  )

  // Delete a version
  const deleteVersion = useCallback(
    (versionId: string) => {
      try {
        const success = versionStorage.deleteVersion(versionId)
        if (success) {
          loadVersions()
        }
        return success
      } catch (error) {
        console.error("Error deleting version:", error)
        return false
      }
    },
    [versionStorage, loadVersions],
  )

  // Get version details
  const getVersion = useCallback(
    (versionId: string) => {
      return versionStorage.getVersion(versionId)
    },
    [versionStorage],
  )

  // Compare versions
  const compareVersions = useCallback(
    (versionId1: string, versionId2: string) => {
      return versionStorage.compareVersions(versionId1, versionId2)
    },
    [versionStorage],
  )

  // Load versions on mount
  useEffect(() => {
    loadVersions()
  }, [loadVersions])

  // Set up auto-save interval
  useEffect(() => {
    const interval = setInterval(autoSave, 60 * 1000) // Check every minute
    return () => clearInterval(interval)
  }, [autoSave])

  return {
    versions,
    isLoading,
    saveVersion,
    restoreVersion,
    deleteVersion,
    getVersion,
    compareVersions,
    loadVersions,
    lastAutoSave,
  }
}
