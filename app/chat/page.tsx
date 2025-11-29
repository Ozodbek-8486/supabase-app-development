"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRooms, useProfile } from "@/hooks/use-chat"
import {
  ChatSidebar,
  ChatMessages,
  ChatInput,
  ChatHeader,
  TypingIndicator,
} from "@/components/chat"
import { Button } from "@/components/ui/button"
import { Menu, X } from "lucide-react"
import type { ChatRoom } from "@/lib/types/database"

export default function ChatPage() {
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const { rooms } = useRooms()
  const { profile, updateStatus } = useProfile()
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
        updateStatus("online")
      }
    }
    getUser()

    const handleBeforeUnload = () => {
      updateStatus("offline")
    }
    window.addEventListener("beforeunload", handleBeforeUnload)

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload)
      updateStatus("offline")
    }
  }, [supabase, updateStatus])

  useEffect(() => {
    if (rooms.length > 0 && !selectedRoomId) {
      setSelectedRoomId(rooms[0].id)
    }
  }, [rooms, selectedRoomId])

  const selectedRoom: ChatRoom | null =
    rooms.find((r: ChatRoom) => r.id === selectedRoomId) || null

  const handleSelectRoom = (roomId: string) => {
    setSelectedRoomId(roomId)
    setSidebarOpen(false)
  }

  if (!userId) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="h-screen flex bg-gray-100 dark:bg-gray-950">
      {/* Mobile Sidebar Toggle */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-3 left-3 z-50 md:hidden"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </Button>

      {/* Sidebar - Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed md:static inset-y-0 left-0 z-40 transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <ChatSidebar
          selectedRoom={selectedRoomId}
          onSelectRoom={handleSelectRoom}
        />
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <ChatHeader room={selectedRoom} currentUserId={userId} />

        {selectedRoomId ? (
          <>
            <ChatMessages roomId={selectedRoomId} currentUserId={userId} />
            <TypingIndicator
              roomId={selectedRoomId}
              currentUsername={profile?.username || ""}
            />
            <ChatInput
              roomId={selectedRoomId}
              username={profile?.username || ""}
            />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <p className="text-2xl mb-2">👋</p>
              <p className="text-lg font-medium">Xush kelibsiz!</p>
              <p className="text-sm">
                Suhbatni boshlash uchun chap tomondagi xonalardan birini tanlang
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
