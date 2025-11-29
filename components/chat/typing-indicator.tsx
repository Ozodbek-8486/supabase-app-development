"use client"

import { useTypingIndicator } from "@/hooks/use-chat"

interface TypingIndicatorProps {
  roomId: string
  currentUsername: string
}

export function TypingIndicator({
  roomId,
  currentUsername,
}: TypingIndicatorProps) {
  const { typingUsers } = useTypingIndicator(roomId)

  const filteredUsers = typingUsers.filter((u) => u !== currentUsername)

  if (filteredUsers.length === 0) return null

  let text = ""
  if (filteredUsers.length === 1) {
    text = `${filteredUsers[0]} yozmoqda...`
  } else if (filteredUsers.length === 2) {
    text = `${filteredUsers[0]} va ${filteredUsers[1]} yozmoqda...`
  } else {
    text = `${filteredUsers.length} kishi yozmoqda...`
  }

  return (
    <div className="px-4 py-2 text-sm text-gray-500 flex items-center gap-2">
      <div className="flex gap-1">
        <span className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
        <span className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
        <span className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
      </div>
      <span>{text}</span>
    </div>
  )
}
