"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"

interface UploadResult {
  url: string
  path: string
  name: string
  size: number
}

export function useFileUpload() {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const uploadFile = async (
    file: File,
    bucket = "chat-files"
  ): Promise<UploadResult | null> => {
    setUploading(true)
    setProgress(0)
    setError(null)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("Foydalanuvchi topilmadi")

      const fileExt = file.name.split(".").pop()
      const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`

      const { error: uploadError, data } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: false,
        })

      if (uploadError) throw uploadError

      setProgress(100)

      const {
        data: { publicUrl },
      } = supabase.storage.from(bucket).getPublicUrl(data.path)

      return {
        url: publicUrl,
        path: data.path,
        name: file.name,
        size: file.size,
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fayl yuklashda xatolik")
      return null
    } finally {
      setUploading(false)
    }
  }

  const deleteFile = async (path: string, bucket = "chat-files") => {
    const { error } = await supabase.storage.from(bucket).remove([path])
    if (error) throw error
  }

  return {
    uploadFile,
    deleteFile,
    uploading,
    progress,
    error,
  }
}
