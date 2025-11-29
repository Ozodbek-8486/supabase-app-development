"use client"

import { useRoomMembers, useRooms } from "@/hooks/use-chat"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Hash, Lock, Users, LogOut, Info } from "lucide-react"
import type { ChatRoom, RoomMember } from "@/lib/types/database"

interface ChatHeaderProps {
  room: ChatRoom | null
  currentUserId: string
}

export function ChatHeader({ room, currentUserId }: ChatHeaderProps) {
  const { members, loading } = useRoomMembers(room?.id || "")
  const { leaveRoom } = useRooms()

  if (!room) {
    return (
      <div className="h-14 border-b bg-white dark:bg-gray-900 flex items-center px-4">
        <p className="text-gray-500">Xona tanlang</p>
      </div>
    )
  }

  const onlineCount = members.filter(
    (m) => m.profiles?.status === "online"
  ).length

  const handleLeaveRoom = async () => {
    if (confirm("Rostdan ham bu xonadan chiqmoqchimisiz?")) {
      await leaveRoom(room.id)
    }
  }

  return (
    <div className="h-14 border-b bg-white dark:bg-gray-900 flex items-center justify-between px-4">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          {room.is_private ? (
            <Lock className="h-5 w-5 text-gray-500" />
          ) : (
            <Hash className="h-5 w-5 text-gray-500" />
          )}
          <h2 className="font-semibold text-lg">{room.name}</h2>
        </div>
        {room.description && (
          <span className="text-sm text-gray-500 hidden md:block">
            — {room.description}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Badge variant="secondary" className="gap-1">
          <div className="h-2 w-2 rounded-full bg-green-500" />
          {onlineCount} onlayn
        </Badge>

        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Users className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                A&apos;zolar ({members.length})
              </SheetTitle>
            </SheetHeader>
            <ScrollArea className="h-[calc(100vh-120px)] mt-4">
              <div className="space-y-3">
                {members.map((member: RoomMember) => (
                  <div
                    key={member.id}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    <div className="relative">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={member.profiles?.avatar_url || ""} />
                        <AvatarFallback>
                          {member.profiles?.username?.charAt(0).toUpperCase() ||
                            "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div
                        className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white dark:border-gray-900 ${
                          member.profiles?.status === "online"
                            ? "bg-green-500"
                            : member.profiles?.status === "away"
                            ? "bg-yellow-500"
                            : "bg-gray-400"
                        }`}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {member.profiles?.full_name ||
                          member.profiles?.username ||
                          "Foydalanuvchi"}
                        {member.user_id === currentUserId && (
                          <span className="text-xs text-gray-500 ml-1">
                            (siz)
                          </span>
                        )}
                      </p>
                      <p className="text-sm text-gray-500 truncate">
                        @{member.profiles?.username || "user"}
                      </p>
                    </div>
                    {member.role !== "member" && (
                      <Badge variant="outline" className="text-xs">
                        {member.role === "admin" ? "Admin" : "Moderator"}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="absolute bottom-4 left-4 right-4">
              <Button
                variant="destructive"
                className="w-full"
                onClick={handleLeaveRoom}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Xonadan chiqish
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  )
}
