"use client"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"
import type { User } from "./collaborative-editor"

interface UserPresenceProps {
  users: User[]
  currentUser: string
}

export function UserPresence({ users, currentUser }: UserPresenceProps) {
  // Filter out current user and get unique users
  const otherUsers = users.filter((user) => user.name !== currentUser)
  const uniqueUsers = otherUsers.reduce((acc, user) => {
    if (!acc.find((u) => u.name === user.name)) {
      acc.push(user)
    }
    return acc
  }, [] as User[])

  const totalUsers = uniqueUsers.length + 1 // +1 for current user

  if (uniqueUsers.length === 0) {
    return (
      <div className="flex items-center gap-2">
        <Badge variant="secondary" className="text-xs">
          1 user online
        </Badge>
      </div>
    )
  }

  return (
    <TooltipProvider>
      <div className="flex items-center gap-2">
        <div className="flex -space-x-2">
          {/* Current user avatar */}
          <Tooltip>
            <TooltipTrigger>
              <Avatar className="h-8 w-8 border-2 border-background">
                <AvatarFallback className="text-xs font-medium text-white" style={{ backgroundColor: "#6B7280" }}>
                  {currentUser.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </TooltipTrigger>
            <TooltipContent>
              <p>{currentUser} (You)</p>
            </TooltipContent>
          </Tooltip>

          {/* Other users avatars */}
          {uniqueUsers.slice(0, 3).map((user) => (
            <Tooltip key={user.name}>
              <TooltipTrigger>
                <Avatar className="h-8 w-8 border-2 border-background">
                  <AvatarFallback className="text-xs font-medium text-white" style={{ backgroundColor: user.color }}>
                    {user.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </TooltipTrigger>
              <TooltipContent>
                <p>{user.name}</p>
              </TooltipContent>
            </Tooltip>
          ))}

          {/* Show +N more if there are more than 3 other users */}
          {uniqueUsers.length > 3 && (
            <Tooltip>
              <TooltipTrigger>
                <Avatar className="h-8 w-8 border-2 border-background">
                  <AvatarFallback className="text-xs font-medium bg-muted-foreground text-white">
                    +{uniqueUsers.length - 3}
                  </AvatarFallback>
                </Avatar>
              </TooltipTrigger>
              <TooltipContent>
                <div className="space-y-1">
                  {uniqueUsers.slice(3).map((user) => (
                    <p key={user.name}>{user.name}</p>
                  ))}
                </div>
              </TooltipContent>
            </Tooltip>
          )}
        </div>

        <Badge variant="secondary" className="text-xs">
          {totalUsers} user{totalUsers !== 1 ? "s" : ""} online
        </Badge>
      </div>
    </TooltipProvider>
  )
}
