"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { History, MoreVertical, Eye, RotateCcw, Trash2, GitCompare, Clock, User, FileText, X } from "lucide-react"
import type { VersionMetadata } from "@/lib/version-storage"
import { formatVersionTimestamp, formatVersionSize } from "@/lib/version-storage"

interface VersionHistoryProps {
  versions: VersionMetadata[]
  onRestore: (versionId: string) => void
  onDelete: (versionId: string) => void
  onCompare: (versionId1: string, versionId2: string) => void
  onPreview: (versionId: string) => void
  isOpen: boolean
  onClose: () => void
  currentUser: string
}

export function VersionHistory({
  versions,
  onRestore,
  onDelete,
  onCompare,
  onPreview,
  isOpen,
  onClose,
  currentUser,
}: VersionHistoryProps) {
  const [selectedVersions, setSelectedVersions] = useState<string[]>([])
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [versionToDelete, setVersionToDelete] = useState<string | null>(null)
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false)
  const [versionToRestore, setVersionToRestore] = useState<VersionMetadata | null>(null)

  const handleVersionSelect = (versionId: string) => {
    setSelectedVersions((prev) => {
      if (prev.includes(versionId)) {
        return prev.filter((id) => id !== versionId)
      } else if (prev.length < 2) {
        return [...prev, versionId]
      } else {
        return [prev[1], versionId]
      }
    })
  }

  const handleDeleteClick = (version: VersionMetadata) => {
    setVersionToDelete(version.id)
    setDeleteDialogOpen(true)
  }

  const handleRestoreClick = (version: VersionMetadata) => {
    setVersionToRestore(version)
    setRestoreDialogOpen(true)
  }

  const confirmDelete = () => {
    if (versionToDelete) {
      onDelete(versionToDelete)
      setVersionToDelete(null)
    }
    setDeleteDialogOpen(false)
  }

  const confirmRestore = () => {
    if (versionToRestore) {
      onRestore(versionToRestore.id)
      setVersionToRestore(null)
    }
    setRestoreDialogOpen(false)
  }

  const handleCompareSelected = () => {
    if (selectedVersions.length === 2) {
      onCompare(selectedVersions[0], selectedVersions[1])
      setSelectedVersions([])
    }
  }

  const clearSelection = () => {
    setSelectedVersions([])
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl h-[80vh] flex flex-col">
        <CardHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="h-5 w-5" />
              <CardTitle>Version History</CardTitle>
              <Badge variant="secondary">{versions.length} versions</Badge>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <CardDescription>
            View, restore, and manage document versions. Select up to 2 versions to compare.
          </CardDescription>

          {selectedVersions.length > 0 && (
            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
              <div className="flex-1">
                <span className="text-sm font-medium">
                  {selectedVersions.length} version{selectedVersions.length > 1 ? "s" : ""} selected
                </span>
              </div>
              <div className="flex gap-2">
                {selectedVersions.length === 2 && (
                  <Button size="sm" onClick={handleCompareSelected}>
                    <GitCompare className="h-4 w-4 mr-2" />
                    Compare
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={clearSelection}>
                  Clear
                </Button>
              </div>
            </div>
          )}
        </CardHeader>

        <CardContent className="flex-1 overflow-hidden p-0">
          <ScrollArea className="h-full px-6">
            <div className="space-y-4 py-4">
              {versions.length === 0 ? (
                <div className="text-center py-12">
                  <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No versions yet</h3>
                  <p className="text-muted-foreground">Save your first version to start tracking document history.</p>
                </div>
              ) : (
                versions.map((version, index) => (
                  <div key={version.id}>
                    <div
                      className={`p-4 rounded-lg border transition-colors cursor-pointer ${
                        selectedVersions.includes(version.id)
                          ? "border-primary bg-primary/5"
                          : "border-border hover:bg-muted/50"
                      }`}
                      onClick={() => handleVersionSelect(version.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-medium truncate">{version.title}</h4>
                            <Badge variant={version.isAutoSave ? "secondary" : "default"} className="text-xs">
                              {version.isAutoSave ? "Auto" : "Manual"}
                            </Badge>
                            {index === 0 && (
                              <Badge variant="outline" className="text-xs">
                                Latest
                              </Badge>
                            )}
                          </div>

                          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
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
                              <span>{formatVersionSize(version.size)}</span>
                            </div>
                          </div>

                          {version.description && (
                            <p className="text-sm text-muted-foreground truncate">{version.description}</p>
                          )}
                        </div>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation()
                                onPreview(version.id)
                              }}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Preview
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation()
                                handleRestoreClick(version)
                              }}
                            >
                              <RotateCcw className="h-4 w-4 mr-2" />
                              Restore
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDeleteClick(version)
                              }}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                    {index < versions.length - 1 && <Separator className="my-2" />}
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Version</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this version? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Restore Confirmation Dialog */}
      <AlertDialog open={restoreDialogOpen} onOpenChange={setRestoreDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restore Version</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to restore to "{versionToRestore?.title}"? This will replace the current document
              content and create a new version with the restored content.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRestore}>Restore</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
