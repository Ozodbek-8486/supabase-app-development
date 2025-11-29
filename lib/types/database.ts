export interface Profile {
  id: string
  username: string
  full_name: string | null
  avatar_url: string | null
  status: "online" | "offline" | "away"
  last_seen: string
  created_at: string
  updated_at: string
}

export interface ChatRoom {
  id: string
  name: string
  description: string | null
  is_private: boolean
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface RoomMember {
  id: string
  room_id: string
  user_id: string
  role: "admin" | "moderator" | "member"
  joined_at: string
  profiles?: Profile
}

export interface Message {
  id: string
  room_id: string
  user_id: string
  content: string | null
  message_type: "text" | "image" | "file" | "system"
  file_url: string | null
  file_name: string | null
  file_size: number | null
  is_edited: boolean
  is_deleted: boolean
  reply_to: string | null
  created_at: string
  updated_at: string
  profiles?: Profile
  reply_message?: Message
}

export interface DirectMessage {
  id: string
  sender_id: string
  receiver_id: string
  content: string | null
  message_type: "text" | "image" | "file"
  file_url: string | null
  file_name: string | null
  is_read: boolean
  is_deleted: boolean
  created_at: string
  sender?: Profile
  receiver?: Profile
}

export interface MessageRead {
  id: string
  message_id: string
  user_id: string
  read_at: string
}

export type RealtimePayload<T> = {
  commit_timestamp: string
  eventType: "INSERT" | "UPDATE" | "DELETE"
  new: T
  old: T
  schema: string
  table: string
}
