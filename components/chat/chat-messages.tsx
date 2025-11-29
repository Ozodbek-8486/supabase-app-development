"use client"

import { useEffect, useRef } from "react"
import { useMessages } from "@/hooks/use-chat"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import { format, isToday, isYesterday } from "date-fns"
import { uz } from "date-fns/locale"
import { FileIcon, ImageIcon } from "lucide-react"
import type { Message } from "@/lib/types/database"

interface ChatMessagesProps {
  roomId: string
  currentUserId: string
}

function formatMessageDate(dateString: string): string {
  const date = new Date(dateString)
  if (isToday(date)) {
    return `Bugun, ${format(date, "HH:mm")}`
  }
  if (isYesterday(date)) {
    return `Kecha, ${format(date, "HH:mm")}`
  }
  return format(date, "d MMMM yyyy, HH:mm", { locale: uz })
}

function formatTime(dateString: string): string {
  return format(new Date(dateString), "HH:mm")
}

function MessageBubble({
  message,
  isOwn,
  showAvatar,
}: {
  message: Message
  isOwn: boolean
  showAvatar: boolean
}) {
  const profile = message.profiles

  const renderContent = () => {
    if (message.message_type === "image" && message.file_url) {
      return (
        <div className="max-w-sm">
          <img
            src={message.file_url}
            alt={message.file_name || "Rasm"}
            className="rounded-lg max-w-full h-auto"
            loading="lazy"
          />
          {message.content && (
            <p className="mt-2 text-sm">{message.content}</p>
          )}
        </div>
      )
    }

    if (message.message_type === "file" && message.file_url) {
      return (
        <a
          href={message.file_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          <FileIcon className="h-8 w-8 text-blue-500" />
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">
              {message.file_name || "Fayl"}
            </p>
            {message.file_size && (
              <p className="text-xs text-gray-500">
                {(message.file_size / 1024).toFixed(1)} KB
              </p>
            )}
          </div>
        </a>
      )
    }

    if (message.message_type === "system") {
      return (
        <div className="text-center text-sm text-gray-500 italic py-2">
          {message.content}
        </div>
      )
    }

    return <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
  }

  if (message.message_type === "system") {
    return renderContent()
  }

  return (
    <div
      className={`flex gap-3 ${isOwn ? "flex-row-reverse" : ""} ${
        showAvatar ? "mt-4" : "mt-1"
      }`}
    >
      {showAvatar ? (
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarImage src={profile?.avatar_url || ""} />
          <AvatarFallback className={isOwn ? "bg-indigo-600" : "bg-gray-600"}>
            {profile?.username?.charAt(0).toUpperCase() || "U"}
          </AvatarFallback>
        </Avatar>
      ) : (
        <div className="w-8 shrink-0" />
      )}
      <div className={`max-w-[70%] ${isOwn ? "items-end" : "items-start"}`}>
        {showAvatar && (
          <div
            className={`flex items-center gap-2 mb-1 ${
              isOwn ? "flex-row-reverse" : ""
            }`}
          >
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {profile?.full_name || profile?.username || "Foydalanuvchi"}
            </span>
            <span className="text-xs text-gray-500">
              {formatTime(message.created_at)}
            </span>
          </div>
        )}
        <div
          className={`rounded-2xl px-4 py-2 ${
            isOwn
              ? "bg-indigo-600 text-white rounded-tr-sm"
              : "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-tl-sm"
          }`}
        >
          {renderContent()}
          {message.is_edited && (
            <span className="text-xs opacity-60 ml-2">(tahrirlangan)</span>
          )}
        </div>
      </div>
    </div>
  )
}

export function ChatMessages({ roomId, currentUserId }: ChatMessagesProps) {
  const { messages, loading } = useMessages(roomId)
  const scrollRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  if (loading) {
    return (
      <div className="flex-1 p-4 space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex gap-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-12 w-64" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500">
        <div className="text-center">
          <p className="text-lg font-medium">Xabarlar yo&apos;q</p>
          <p className="text-sm">Birinchi bo&apos;lib xabar yozing!</p>
        </div>
      </div>
    )
  }

  let lastDate = ""
  let lastUserId = ""

  return (
    <ScrollArea className="flex-1 px-4" ref={scrollRef}>
      <div className="py-4 space-y-1">
        {messages.map((message: Message, index: number) => {
          const messageDate = format(new Date(message.created_at), "yyyy-MM-dd")
          const showDateDivider = messageDate !== lastDate
          const showAvatar =
            showDateDivider || message.user_id !== lastUserId

          lastDate = messageDate
          lastUserId = message.user_id

          return (
            <div key={message.id}>
              {showDateDivider && (
                <div className="flex items-center justify-center my-6">
                  <div className="bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs px-3 py-1 rounded-full">
                    {formatMessageDate(message.created_at).split(",")[0]}
                  </div>
                </div>
              )}
              <MessageBubble
                message={message}
                isOwn={message.user_id === currentUserId}
                showAvatar={showAvatar}
              />
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>
    </ScrollArea>
  )
}
