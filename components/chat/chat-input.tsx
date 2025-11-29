"use client"

import { useState, useRef, useCallback } from "react"
import { useMessages, useTypingIndicator } from "@/hooks/use-chat"
import { useFileUpload } from "@/hooks/use-file-upload"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Paperclip, Send, Image, X, Loader2 } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface ChatInputProps {
  roomId: string
  username: string
}

export function ChatInput({ roomId, username }: ChatInputProps) {
  const [message, setMessage] = useState("")
  const [sending, setSending] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const { sendMessage } = useMessages(roomId)
  const { uploadFile, uploading } = useFileUpload()
  const { setTyping } = useTypingIndicator(roomId)

  const handleFileSelect = useCallback(
    (file: File | null, isImage: boolean) => {
      if (!file) return

      setSelectedFile(file)

      if (isImage && file.type.startsWith("image/")) {
        const url = URL.createObjectURL(file)
        setPreviewUrl(url)
      } else {
        setPreviewUrl(null)
      }
    },
    []
  )

  const clearFile = useCallback(() => {
    setSelectedFile(null)
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }
    if (fileInputRef.current) fileInputRef.current.value = ""
    if (imageInputRef.current) imageInputRef.current.value = ""
  }, [previewUrl])

  const handleSend = async () => {
    if ((!message.trim() && !selectedFile) || sending) return

    setSending(true)
    try {
      if (selectedFile) {
        const result = await uploadFile(selectedFile)
        if (result) {
          const messageType = selectedFile.type.startsWith("image/")
            ? "image"
            : "file"
          await sendMessage(
            message.trim(),
            messageType,
            result.url,
            result.name,
            result.size
          )
        }
        clearFile()
      } else {
        await sendMessage(message.trim())
      }
      setMessage("")
      textareaRef.current?.focus()
    } catch (error) {
      console.error("Xabar yuborishda xatolik:", error)
    } finally {
      setSending(false)
      setTyping(false, username)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value)
    setTyping(e.target.value.length > 0, username)
  }

  const isDisabled = sending || uploading

  return (
    <div className="border-t bg-white dark:bg-gray-900 p-4">
      {/* File Preview */}
      {selectedFile && (
        <div className="mb-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="flex items-center gap-3">
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Ko'rib chiqish"
                className="h-16 w-16 object-cover rounded"
              />
            ) : (
              <div className="h-16 w-16 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center">
                <Paperclip className="h-6 w-6 text-gray-500" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{selectedFile.name}</p>
              <p className="text-xs text-gray-500">
                {(selectedFile.size / 1024).toFixed(1)} KB
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={clearFile}
              disabled={isDisabled}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="flex items-end gap-2">
        <TooltipProvider>
          <div className="flex gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  disabled={isDisabled}
                  onClick={() => imageInputRef.current?.click()}
                >
                  <Image className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Rasm yuklash</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  disabled={isDisabled}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Paperclip className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Fayl yuklash</TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>

        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) =>
            handleFileSelect(e.target.files?.[0] || null, true)
          }
        />
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={(e) =>
            handleFileSelect(e.target.files?.[0] || null, false)
          }
        />

        <Textarea
          ref={textareaRef}
          placeholder="Xabar yozing..."
          value={message}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          disabled={isDisabled}
          className="min-h-[44px] max-h-32 resize-none"
          rows={1}
        />

        <Button
          onClick={handleSend}
          disabled={(!message.trim() && !selectedFile) || isDisabled}
          size="icon"
          className="shrink-0"
        >
          {isDisabled ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Send className="h-5 w-5" />
          )}
        </Button>
      </div>
    </div>
  )
}
