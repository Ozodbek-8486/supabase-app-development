"use client"

import { useState } from "react"
import { useRooms, useProfile } from "@/hooks/use-chat"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Skeleton } from "@/components/ui/skeleton"
import { Hash, Lock, Plus, LogOut, Settings } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import type { ChatRoom } from "@/lib/types/database"

interface ChatSidebarProps {
  selectedRoom: string | null
  onSelectRoom: (roomId: string) => void
}

export function ChatSidebar({ selectedRoom, onSelectRoom }: ChatSidebarProps) {
  const { rooms, loading, createRoom } = useRooms()
  const { profile } = useProfile()
  const [newRoomName, setNewRoomName] = useState("")
  const [newRoomDescription, setNewRoomDescription] = useState("")
  const [isPrivate, setIsPrivate] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleCreateRoom = async () => {
    if (!newRoomName.trim()) return
    setCreating(true)
    try {
      const room = await createRoom(newRoomName, newRoomDescription, isPrivate)
      setNewRoomName("")
      setNewRoomDescription("")
      setIsPrivate(false)
      setIsDialogOpen(false)
      onSelectRoom(room.id)
    } catch (error) {
      console.error("Xona yaratishda xatolik:", error)
    } finally {
      setCreating(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/auth/login")
  }

  return (
    <div className="w-64 bg-gray-900 text-white flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <h1 className="text-xl font-bold">💬 Chat</h1>
      </div>

      {/* Rooms List */}
      <ScrollArea className="flex-1 px-2">
        <div className="py-4">
          <div className="flex items-center justify-between px-2 mb-2">
            <span className="text-xs uppercase text-gray-400 font-semibold">
              Xonalar
            </span>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-5 w-5">
                  <Plus className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Yangi xona yaratish</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="room-name">Xona nomi</Label>
                    <Input
                      id="room-name"
                      placeholder="umumiy-suhbat"
                      value={newRoomName}
                      onChange={(e) => setNewRoomName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="room-description">Tavsif (ixtiyoriy)</Label>
                    <Input
                      id="room-description"
                      placeholder="Bu xona haqida..."
                      value={newRoomDescription}
                      onChange={(e) => setNewRoomDescription(e.target.value)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="is-private">Maxfiy xona</Label>
                    <Switch
                      id="is-private"
                      checked={isPrivate}
                      onCheckedChange={setIsPrivate}
                    />
                  </div>
                  <Button
                    onClick={handleCreateRoom}
                    disabled={!newRoomName.trim() || creating}
                    className="w-full"
                  >
                    {creating ? "Yaratilmoqda..." : "Xona yaratish"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-8 w-full bg-gray-700" />
              ))}
            </div>
          ) : (
            <div className="space-y-1">
              {rooms.map((room: ChatRoom) => (
                <button
                  key={room.id}
                  onClick={() => onSelectRoom(room.id)}
                  className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors ${
                    selectedRoom === room.id
                      ? "bg-gray-700 text-white"
                      : "text-gray-400 hover:bg-gray-800 hover:text-gray-200"
                  }`}
                >
                  {room.is_private ? (
                    <Lock className="h-4 w-4 shrink-0" />
                  ) : (
                    <Hash className="h-4 w-4 shrink-0" />
                  )}
                  <span className="truncate">{room.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* User Profile */}
      <div className="p-3 border-t border-gray-700 bg-gray-800">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={profile?.avatar_url || ""} />
            <AvatarFallback className="bg-indigo-600">
              {profile?.username?.charAt(0).toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {profile?.full_name || profile?.username || "Foydalanuvchi"}
            </p>
            <p className="text-xs text-gray-400 truncate">
              @{profile?.username || "user"}
            </p>
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-gray-400 hover:text-white"
              onClick={() => router.push("/profile")}
            >
              <Settings className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-gray-400 hover:text-red-400"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
