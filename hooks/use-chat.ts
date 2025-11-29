"use client"

import { useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import type { Message, Profile, ChatRoom, RoomMember } from "@/lib/types/database"
import type { RealtimeChannel } from "@supabase/supabase-js"

export function useMessages(roomId: string) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const fetchMessages = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("messages")
        .select(`
          *,
          profiles:user_id (id, username, full_name, avatar_url, status)
        `)
        .eq("room_id", roomId)
        .eq("is_deleted", false)
        .order("created_at", { ascending: true })
        .limit(100)

      if (error) throw error
      setMessages(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Xatolik yuz berdi")
    } finally {
      setLoading(false)
    }
  }, [roomId, supabase])

  useEffect(() => {
    fetchMessages()

    const channel: RealtimeChannel = supabase
      .channel(`room-${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `room_id=eq.${roomId}`,
        },
        async (payload) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("id, username, full_name, avatar_url, status")
            .eq("id", payload.new.user_id)
            .single()

          const newMessage = {
            ...payload.new,
            profiles: profile,
          } as Message

          setMessages((prev) => [...prev, newMessage])
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === payload.new.id ? { ...msg, ...payload.new } : msg
            )
          )
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "messages",
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          setMessages((prev) => prev.filter((msg) => msg.id !== payload.old.id))
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [roomId, supabase, fetchMessages])

  const sendMessage = async (
    content: string,
    messageType: "text" | "image" | "file" = "text",
    fileUrl?: string,
    fileName?: string,
    fileSize?: number
  ) => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error("Foydalanuvchi topilmadi")

    const { error } = await supabase.from("messages").insert({
      room_id: roomId,
      user_id: user.id,
      content,
      message_type: messageType,
      file_url: fileUrl,
      file_name: fileName,
      file_size: fileSize,
    })

    if (error) throw error
  }

  const editMessage = async (messageId: string, newContent: string) => {
    const { error } = await supabase
      .from("messages")
      .update({ content: newContent, is_edited: true })
      .eq("id", messageId)

    if (error) throw error
  }

  const deleteMessage = async (messageId: string) => {
    const { error } = await supabase
      .from("messages")
      .update({ is_deleted: true })
      .eq("id", messageId)

    if (error) throw error
  }

  return {
    messages,
    loading,
    error,
    sendMessage,
    editMessage,
    deleteMessage,
    refetch: fetchMessages,
  }
}

export function useRooms() {
  const [rooms, setRooms] = useState<ChatRoom[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const fetchRooms = useCallback(async () => {
    setLoading(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("Foydalanuvchi topilmadi")

      const { data: memberRooms } = await supabase
        .from("room_members")
        .select("room_id")
        .eq("user_id", user.id)

      const roomIds = memberRooms?.map((m) => m.room_id) || []

      const { data, error } = await supabase
        .from("chat_rooms")
        .select("*")
        .or(`is_private.eq.false,id.in.(${roomIds.join(",")})`)
        .order("updated_at", { ascending: false })

      if (error) throw error
      setRooms(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Xatolik yuz berdi")
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchRooms()
  }, [fetchRooms])

  const createRoom = async (name: string, description?: string, isPrivate = false) => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error("Foydalanuvchi topilmadi")

    const { data: room, error: roomError } = await supabase
      .from("chat_rooms")
      .insert({
        name,
        description,
        is_private: isPrivate,
        created_by: user.id,
      })
      .select()
      .single()

    if (roomError) throw roomError

    await supabase.from("room_members").insert({
      room_id: room.id,
      user_id: user.id,
      role: "admin",
    })

    await fetchRooms()
    return room
  }

  const joinRoom = async (roomId: string) => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error("Foydalanuvchi topilmadi")

    const { error } = await supabase.from("room_members").insert({
      room_id: roomId,
      user_id: user.id,
      role: "member",
    })

    if (error && !error.message.includes("duplicate")) throw error
    await fetchRooms()
  }

  const leaveRoom = async (roomId: string) => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error("Foydalanuvchi topilmadi")

    const { error } = await supabase
      .from("room_members")
      .delete()
      .eq("room_id", roomId)
      .eq("user_id", user.id)

    if (error) throw error
    await fetchRooms()
  }

  return {
    rooms,
    loading,
    error,
    createRoom,
    joinRoom,
    leaveRoom,
    refetch: fetchRooms,
  }
}

export function useRoomMembers(roomId: string) {
  const [members, setMembers] = useState<RoomMember[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchMembers = async () => {
      setLoading(true)
      const { data } = await supabase
        .from("room_members")
        .select(`
          *,
          profiles:user_id (id, username, full_name, avatar_url, status)
        `)
        .eq("room_id", roomId)

      setMembers(data || [])
      setLoading(false)
    }

    fetchMembers()

    const channel = supabase
      .channel(`members-${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "room_members",
          filter: `room_id=eq.${roomId}`,
        },
        () => {
          fetchMembers()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [roomId, supabase])

  return { members, loading }
}

export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchProfile = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }

      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single()

      setProfile(data)
      setLoading(false)
    }

    fetchProfile()
  }, [supabase])

  const updateProfile = async (updates: Partial<Profile>) => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error("Foydalanuvchi topilmadi")

    const { data, error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", user.id)
      .select()
      .single()

    if (error) throw error
    setProfile(data)
    return data
  }

  const updateStatus = async (status: "online" | "offline" | "away") => {
    return updateProfile({ status, last_seen: new Date().toISOString() })
  }

  return { profile, loading, updateProfile, updateStatus }
}

export function useTypingIndicator(roomId: string) {
  const [typingUsers, setTypingUsers] = useState<string[]>([])
  const supabase = createClient()

  useEffect(() => {
    const channel = supabase.channel(`typing-${roomId}`)

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState()
        const users = Object.values(state)
          .flat()
          .filter((u: unknown) => (u as { typing: boolean }).typing)
          .map((u: unknown) => (u as { username: string }).username)
        setTypingUsers(users)
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [roomId, supabase])

  const setTyping = async (isTyping: boolean, username: string) => {
    const channel = supabase.channel(`typing-${roomId}`)
    await channel.track({ typing: isTyping, username })
  }

  return { typingUsers, setTyping }
}
