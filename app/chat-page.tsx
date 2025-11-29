// Bu veb sayt sinov uchun holos


"use client"

import { useState, useEffect, useRef } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Send, MessageCircle, Loader2, Settings, User, UserX, Trash2, X, Pencil, MoreVertical, Users, WifiOff, Moon, Sun, History, Clock } from "lucide-react"

interface Message {
  id: string
  username: string
  avatar_url: string | null
  content: string
  created_at: string
}

interface OnlineUser {
  username: string
  avatar_url: string | null
  online_at: string
}

function generateUsername(): string {
  const adjectives = ["Tez", "Aqlli", "Kuchli", "Baxtli", "Oltin", "Kumush", "Yashil", "Kok"]
  const nouns = ["Sherlar", "Burgut", "Tulki", "Bori", "Lochin", "Qoplon", "Arslon", "Laylak"]
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)]
  const noun = nouns[Math.floor(Math.random() * nouns.length)]
  const num = Math.floor(Math.random() * 100)
  return `${adj}${noun}${num}`
}

export default function ChatPage() {
  const [username, setUsername] = useState("")
  const [avatarUrl, setAvatarUrl] = useState("")
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [sending, setSending] = useState(false)
  const [supabase, setSupabase] = useState<ReturnType<typeof createBrowserClient> | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  const [editName, setEditName] = useState("")
  const [editAvatar, setEditAvatar] = useState("")
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
  const [editingContent, setEditingContent] = useState("")
  const [activeMenu, setActiveMenu] = useState<string | null>(null)
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([])
  const [showOnlineUsers, setShowOnlineUsers] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [isOnline, setIsOnline] = useState(true)
  const [isDark, setIsDark] = useState(false)
  const [deletingAll, setDeletingAll] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Dark mode
  useEffect(() => {
    const savedTheme = localStorage.getItem("chat_theme")
    if (savedTheme === "dark") {
      setIsDark(true)
      document.documentElement.classList.add("dark")
    }
  }, [])

  const toggleTheme = () => {
    setIsDark(!isDark)
    if (!isDark) {
      document.documentElement.classList.add("dark")
      localStorage.setItem("chat_theme", "dark")
    } else {
      document.documentElement.classList.remove("dark")
      localStorage.setItem("chat_theme", "light")
    }
  }

  useEffect(() => {
    const url = "https://kmdphhqcfbxwbnttnmqc.supabase.co"
    const key = localStorage.getItem("supabase_anon_key") || ""
    if (key) {
      setSupabase(createBrowserClient(url, key))
    }
  }, [])

  useEffect(() => {
    let savedUsername = localStorage.getItem("chat_username")
    if (!savedUsername) {
      savedUsername = generateUsername()
      localStorage.setItem("chat_username", savedUsername)
    }
    setUsername(savedUsername)
    setEditName(savedUsername)
    const savedAvatar = localStorage.getItem("chat_avatar") || ""
    setAvatarUrl(savedAvatar)
    setEditAvatar(savedAvatar)
    const savedAnon = localStorage.getItem("chat_anonymous") === "true"
    setIsAnonymous(savedAnon)
  }, [])

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)
    setIsOnline(navigator.onLine)
    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  useEffect(() => {
    if (!username || !supabase || !isOnline) return
    const displayName = isAnonymous ? "Anonim" : username
    const displayAvatar = isAnonymous ? null : avatarUrl

    const channel = supabase.channel("online-users", {
      config: { presence: { key: displayName } },
    })

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState()
        const users: OnlineUser[] = []
        Object.keys(state).forEach((key) => {
          const presences = state[key] as unknown as { username: string; avatar_url: string | null; online_at: string }[]
          if (presences.length > 0) {
            users.push({
              username: presences[0].username,
              avatar_url: presences[0].avatar_url,
              online_at: presences[0].online_at,
            })
          }
        })
        setOnlineUsers(users)
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({
            username: displayName,
            avatar_url: displayAvatar,
            online_at: new Date().toISOString(),
          })
        }
      })

    const handleBeforeUnload = () => { channel.untrack() }
    window.addEventListener("beforeunload", handleBeforeUnload)

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload)
      channel.untrack()
      supabase.removeChannel(channel)
    }
  }, [username, supabase, isAnonymous, avatarUrl, isOnline])

  useEffect(() => {
    if (!username || !supabase) return

    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from("chat_messages")
        .select("*")
        .order("created_at", { ascending: true })
        .limit(500)
      if (error) {
        console.error("Xatolik:", error.message)
        return
      }
      if (data) setMessages(data)
    }

    fetchMessages()

    const channel = supabase
      .channel("realtime-chat-" + Date.now())
      .on("postgres_changes", { event: "*", schema: "public", table: "chat_messages" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const newMsg = payload.new as Message
            setMessages((prev) => {
              if (prev.find((m) => m.id === newMsg.id)) return prev
              return [...prev, newMsg]
            })
          } else if (payload.eventType === "UPDATE") {
            const updated = payload.new as Message
            setMessages((prev) => prev.map((m) => m.id === updated.id ? updated : m))
          } else if (payload.eventType === "DELETE") {
            const deleted = payload.old as Message
            setMessages((prev) => prev.filter((m) => m.id !== deleted.id))
          }
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [username, supabase])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || sending || !supabase || !isOnline) return
    setSending(true)
    try {
      const displayName = isAnonymous ? "Anonim" : username
      const displayAvatar = isAnonymous ? null : (avatarUrl || null)
      const { error } = await supabase.from("chat_messages").insert({
        username: displayName,
        avatar_url: displayAvatar,
        content: newMessage.trim(),
      })
      if (error) throw error
      setNewMessage("")
    } catch (err) {
      console.error("Xabar yuborishda xatolik:", err)
    } finally {
      setSending(false)
    }
  }

  const handleEditMessage = async (id: string) => {
    if (!editingContent.trim() || !supabase) return
    try {
      const { error } = await supabase.from("chat_messages").update({ content: editingContent.trim() }).eq("id", id)
      if (error) throw error
      setEditingMessageId(null)
      setEditingContent("")
    } catch (err) {
      console.error("Tahrirlashda xatolik:", err)
    }
  }

  const handleDeleteMessage = async (id: string) => {
    if (!supabase) return
    if (!confirm("Xabarni o'chirmoqchimisiz?")) return
    try {
      const { error } = await supabase.from("chat_messages").delete().eq("id", id)
      if (error) throw error
    } catch (err) {
      console.error("O'chirishda xatolik:", err)
    }
  }

  const handleDeleteAllMyMessages = async () => {
    if (!supabase) return
    const displayName = isAnonymous ? "Anonim" : username
    if (!confirm(`"${displayName}" nomidagi barcha xabarlaringiz o'chiriladi. Davom etasizmi?`)) return
    
    setDeletingAll(true)
    try {
      const { error } = await supabase.from("chat_messages").delete().eq("username", displayName)
      if (error) throw error
      setShowHistory(false)
    } catch (err) {
      console.error("O'chirishda xatolik:", err)
    } finally {
      setDeletingAll(false)
    }
  }

  const handleSaveSettings = () => {
    if (editName.trim()) {
      setUsername(editName.trim())
      localStorage.setItem("chat_username", editName.trim())
    }
    setAvatarUrl(editAvatar)
    localStorage.setItem("chat_avatar", editAvatar)
    setShowSettings(false)
  }

  const handleDeleteProfile = () => {
    if (confirm("Profilingizni tozalashni xohlaysizmi?")) {
      const newName = generateUsername()
      setUsername(newName)
      setEditName(newName)
      localStorage.setItem("chat_username", newName)
      setAvatarUrl("")
      setEditAvatar("")
      localStorage.removeItem("chat_avatar")
      setIsAnonymous(false)
      localStorage.removeItem("chat_anonymous")
      setShowSettings(false)
    }
  }

  const toggleAnonymous = (value: boolean) => {
    setIsAnonymous(value)
    localStorage.setItem("chat_anonymous", value.toString())
  }

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const isToday = date.toDateString() === now.toDateString()
    const yesterday = new Date(now)
    yesterday.setDate(yesterday.getDate() - 1)
    const isYesterday = date.toDateString() === yesterday.toDateString()
    const time = date.toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" })
    if (isToday) return `Bugun, ${time}`
    if (isYesterday) return `Kecha, ${time}`
    return `${date.toLocaleDateString("uz-UZ", { day: "numeric", month: "short", year: "numeric" })}, ${time}`
  }

  const getAvatarColor = (name: string) => {
    if (name === "Anonim") return "bg-slate-500"
    const colors = ["bg-rose-500", "bg-sky-500", "bg-emerald-500", "bg-amber-500", "bg-violet-500", "bg-pink-500", "bg-indigo-500", "bg-teal-500"]
    return colors[name.charCodeAt(0) % colors.length]
  }

  const canEditDelete = (msgUsername: string) => {
    return msgUsername === username || (isAnonymous && msgUsername === "Anonim")
  }

  const isUserOnline = (name: string) => onlineUsers.some((u) => u.username === name)

  const myMessages = messages.filter((m) => m.username === username || (isAnonymous && m.username === "Anonim"))

  if (!supabase) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-4 ${isDark ? "bg-slate-900" : "bg-gradient-to-br from-sky-50 to-indigo-100"}`}>
        <Card className={`w-full max-w-md p-6 ${isDark ? "bg-slate-800 border-slate-700" : "bg-white"}`}>
          <h2 className={`text-xl font-bold mb-4 text-center ${isDark ? "text-white" : "text-slate-800"}`}>Supabase Anon Key</h2>
          <p className={`text-sm mb-4 ${isDark ? "text-slate-400" : "text-slate-500"}`}>Supabase Dashboard - Settings - API dan anon key ni oling</p>
          <form onSubmit={(e) => {
            e.preventDefault()
            const input = (e.target as HTMLFormElement).key as HTMLInputElement
            if (input.value) {
              localStorage.setItem("supabase_anon_key", input.value)
              window.location.reload()
            }
          }}>
            <Input name="key" placeholder="eyJ..." className={`mb-4 ${isDark ? "bg-slate-700 border-slate-600 text-white" : ""}`} />
            <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700">Saqlash</Button>
          </form>
        </Card>
      </div>
    )
  }

  if (!username) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? "bg-slate-900" : "bg-slate-50"}`}>
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    )
  }

  return (
    <div className={`h-screen flex flex-col overflow-hidden transition-colors duration-300 ${isDark ? "bg-slate-900" : "bg-gradient-to-br from-slate-50 to-sky-50"}`}>
      {/* Offline Banner */}
      {!isOnline && (
        <div className="bg-rose-500 text-white text-center py-2 px-4 flex items-center justify-center gap-2 shrink-0">
          <WifiOff className="w-4 h-4" />
          <span className="text-sm font-medium">Internet aloqasi yo'q</span>
        </div>
      )}

      {/* Header */}
      <header className={`shadow-sm p-3 sm:p-4 shrink-0 transition-colors ${isDark ? "bg-slate-800 border-b border-slate-700" : "bg-white/80 backdrop-blur-sm"}`}>
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className={`p-2 rounded-xl ${isDark ? "bg-indigo-600" : "bg-indigo-100"}`}>
              <MessageCircle className={`w-5 h-5 sm:w-6 sm:h-6 ${isDark ? "text-white" : "text-indigo-600"}`} />
            </div>
            <h1 className={`text-lg sm:text-xl font-bold ${isDark ? "text-white" : "text-slate-800"}`}>Muhokama</h1>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-xl transition-colors ${isDark ? "bg-slate-700 hover:bg-slate-600 text-amber-400" : "bg-slate-100 hover:bg-slate-200 text-slate-600"}`}
            >
              {isDark ? <Sun className="w-4 h-4 sm:w-5 sm:h-5" /> : <Moon className="w-4 h-4 sm:w-5 sm:h-5" />}
            </button>

            {/* History Button */}
            <button
              onClick={() => setShowHistory(true)}
              className={`p-2 rounded-xl transition-colors ${isDark ? "bg-slate-700 hover:bg-slate-600 text-slate-300" : "bg-slate-100 hover:bg-slate-200 text-slate-600"}`}
            >
              <History className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            {/* Online Users */}
            <button
              onClick={() => setShowOnlineUsers(true)}
              className={`flex items-center gap-1.5 rounded-full px-2.5 py-1.5 transition-colors ${isDark ? "bg-emerald-900/50 text-emerald-400 hover:bg-emerald-900" : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"}`}
            >
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-xs sm:text-sm font-medium">{onlineUsers.length}</span>
              <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>

            {/* Profile */}
            <button 
              onClick={() => setShowSettings(true)}
              className={`flex items-center gap-1 sm:gap-2 rounded-xl p-1.5 sm:p-2 transition-colors ${isDark ? "hover:bg-slate-700" : "hover:bg-slate-100"}`}
            >
              <div className="relative">
                <Avatar className="h-7 w-7 sm:h-8 sm:w-8 ring-2 ring-offset-2 ring-indigo-500 ring-offset-transparent">
                  {!isAnonymous && avatarUrl ? <AvatarImage src={avatarUrl} /> : null}
                  <AvatarFallback className={`${isAnonymous ? "bg-slate-500" : getAvatarColor(username)} text-white text-xs sm:text-sm font-medium`}>
                    {isAnonymous ? "?" : username.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 ${isDark ? "border-slate-800" : "border-white"} ${isOnline ? "bg-emerald-500" : "bg-slate-400"}`} />
              </div>
              <span className={`font-medium text-xs sm:text-sm hidden sm:block ${isDark ? "text-white" : "text-slate-700"}`}>{isAnonymous ? "Anonim" : username}</span>
            </button>
          </div>
        </div>
      </header>

      {/* History Modal */}
      {showHistory && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setShowHistory(false)}>
          <Card className={`w-full max-w-lg max-h-[80vh] overflow-hidden ${isDark ? "bg-slate-800 border-slate-700" : "bg-white"}`} onClick={(e) => e.stopPropagation()}>
            <div className={`p-4 border-b ${isDark ? "border-slate-700" : "border-slate-200"} flex items-center justify-between`}>
              <div className="flex items-center gap-2">
                <Clock className={`w-5 h-5 ${isDark ? "text-indigo-400" : "text-indigo-600"}`} />
                <h3 className={`font-bold ${isDark ? "text-white" : "text-slate-800"}`}>Xabarlar tarixingiz ({myMessages.length})</h3>
              </div>
              <button onClick={() => setShowHistory(false)} className={`p-1 rounded-lg ${isDark ? "hover:bg-slate-700 text-slate-400" : "hover:bg-slate-100 text-slate-500"}`}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-y-auto max-h-[50vh] p-4">
              {myMessages.length === 0 ? (
                <p className={`text-center py-8 ${isDark ? "text-slate-400" : "text-slate-500"}`}>Hali xabar yozmadingiz</p>
              ) : (
                <div className="space-y-3">
                  {myMessages.map((msg) => (
                    <div key={msg.id} className={`p-3 rounded-xl ${isDark ? "bg-slate-700/50" : "bg-slate-50"}`}>
                      <p className={`text-sm ${isDark ? "text-white" : "text-slate-700"}`}>{msg.content}</p>
                      <p className={`text-xs mt-1 ${isDark ? "text-slate-500" : "text-slate-400"}`}>{formatDateTime(msg.created_at)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {myMessages.length > 0 && (
              <div className={`p-4 border-t ${isDark ? "border-slate-700" : "border-slate-200"}`}>
                <Button 
                  variant="destructive" 
                  className="w-full bg-rose-600 hover:bg-rose-700"
                  onClick={handleDeleteAllMyMessages}
                  disabled={deletingAll}
                >
                  {deletingAll ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
                  Barcha xabarlarimni o'chirish
                </Button>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Online Users Modal */}
      {showOnlineUsers && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setShowOnlineUsers(false)}>
          <Card className={`w-full max-w-sm p-4 max-h-[70vh] overflow-hidden ${isDark ? "bg-slate-800 border-slate-700" : "bg-white"}`} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`font-bold flex items-center gap-2 ${isDark ? "text-white" : "text-slate-800"}`}>
                <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
                Onlayn ({onlineUsers.length})
              </h3>
              <button onClick={() => setShowOnlineUsers(false)} className={`p-1 rounded-lg ${isDark ? "hover:bg-slate-700 text-slate-400" : "hover:bg-slate-100 text-slate-500"}`}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-2 overflow-y-auto max-h-[50vh]">
              {onlineUsers.map((user, i) => (
                <div key={i} className={`flex items-center gap-3 p-2 rounded-xl ${isDark ? "hover:bg-slate-700" : "hover:bg-slate-50"}`}>
                  <div className="relative">
                    <Avatar className="h-9 w-9">
                      {user.avatar_url ? <AvatarImage src={user.avatar_url} /> : null}
                      <AvatarFallback className={`${getAvatarColor(user.username)} text-white font-medium`}>
                        {user.username === "Anonim" ? "?" : user.username.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 ${isDark ? "border-slate-800" : "border-white"}`} />
                  </div>
                  <div>
                    <p className={`font-medium text-sm ${isDark ? "text-white" : "text-slate-700"}`}>{user.username}</p>
                    <p className="text-xs text-emerald-500">Onlayn</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <Card className={`w-full max-w-md p-4 sm:p-6 relative max-h-[90vh] overflow-y-auto ${isDark ? "bg-slate-800 border-slate-700" : "bg-white"}`}>
            <button onClick={() => setShowSettings(false)} className={`absolute top-3 right-3 sm:top-4 sm:right-4 p-1 rounded-lg ${isDark ? "hover:bg-slate-700 text-slate-400" : "hover:bg-slate-100 text-slate-500"}`}>
              <X className="w-5 h-5" />
            </button>
            <h2 className={`text-lg sm:text-xl font-bold mb-4 sm:mb-6 text-center ${isDark ? "text-white" : "text-slate-800"}`}>Profil sozlamalari</h2>
            <div className="flex justify-center mb-4 sm:mb-6">
              <div className="relative">
                <Avatar className="h-16 w-16 sm:h-20 sm:w-20 ring-4 ring-indigo-500 ring-offset-4 ring-offset-transparent">
                  {editAvatar ? <AvatarImage src={editAvatar} /> : null}
                  <AvatarFallback className={`${getAvatarColor(editName || username)} text-white text-xl font-bold`}>
                    {(editName || username).charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-3 ${isDark ? "border-slate-800" : "border-white"} ${isOnline ? "bg-emerald-500" : "bg-slate-400"}`} />
              </div>
            </div>
            <div className="mb-4 sm:mb-6">
              <p className={`text-sm font-medium mb-2 ${isDark ? "text-slate-300" : "text-slate-700"}`}>Rejim tanlang:</p>
              <div className="flex gap-2">
                <Button type="button" variant={!isAnonymous ? "default" : "outline"} className={`flex-1 text-xs sm:text-sm ${!isAnonymous ? "bg-indigo-600 hover:bg-indigo-700" : isDark ? "border-slate-600 text-slate-300" : ""}`} onClick={() => toggleAnonymous(false)}>
                  <User className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  <span className="truncate">{username}</span>
                </Button>
                <Button type="button" variant={isAnonymous ? "default" : "outline"} className={`flex-1 text-xs sm:text-sm ${isAnonymous ? "bg-indigo-600 hover:bg-indigo-700" : isDark ? "border-slate-600 text-slate-300" : ""}`} onClick={() => toggleAnonymous(true)}>
                  <UserX className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  Anonim
                </Button>
              </div>
              {isAnonymous && <p className={`text-xs mt-2 text-center ${isDark ? "text-slate-500" : "text-slate-400"}`}>Anonim rejimda ismingiz va rasmingiz korinmaydi</p>}
            </div>
            <div className="mb-3 sm:mb-4">
              <label className={`text-sm font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}>Ism</label>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Ismingiz" className={`mt-1 ${isDark ? "bg-slate-700 border-slate-600 text-white" : ""}`} />
            </div>
            <div className="mb-4 sm:mb-6">
              <label className={`text-sm font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}>Profil rasm URL</label>
              <Input value={editAvatar} onChange={(e) => setEditAvatar(e.target.value)} placeholder="https://example.com/avatar.jpg" className={`mt-1 ${isDark ? "bg-slate-700 border-slate-600 text-white" : ""}`} />
            </div>
            <div className="space-y-2">
              <Button onClick={handleSaveSettings} className="w-full bg-indigo-600 hover:bg-indigo-700">Saqlash</Button>
              <Button variant="outline" onClick={handleDeleteProfile} className={`w-full ${isDark ? "border-slate-600 text-slate-300 hover:bg-slate-700" : ""}`}>
                <Trash2 className="w-4 h-4 mr-2" />Profilni tozalash
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <div className="h-full max-w-4xl mx-auto p-2 sm:p-4 flex flex-col">
          <Card className={`flex-1 min-h-0 flex flex-col overflow-hidden ${isDark ? "bg-slate-800/50 border-slate-700 backdrop-blur-sm" : "bg-white/70 backdrop-blur-sm"}`}>
            <div className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-4 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-600">
              {messages.length === 0 ? (
                <div className={`h-full flex items-center justify-center ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                  <div className="text-center">
                    <div className={`w-16 h-16 rounded-2xl mx-auto mb-3 flex items-center justify-center ${isDark ? "bg-slate-700" : "bg-slate-100"}`}>
                      <MessageCircle className="w-8 h-8 opacity-50" />
                    </div>
                    <p className="text-sm sm:text-base font-medium">Hali xabarlar yoq</p>
                    <p className="text-xs sm:text-sm opacity-70">Birinchi bolib xabar yozing!</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 sm:space-y-4">
                  {messages.map((msg) => {
                    const isOwn = canEditDelete(msg.username)
                    const isAnonMsg = msg.username === "Anonim"
                    const isEditing = editingMessageId === msg.id
                    const userOnline = isUserOnline(msg.username)

                    return (
                      <div key={msg.id} className={`flex gap-2 sm:gap-3 ${isOwn ? "flex-row-reverse" : ""}`}>
                        <div className="relative shrink-0">
                          <Avatar className="h-8 w-8 sm:h-9 sm:w-9">
                            {msg.avatar_url && !isAnonMsg ? <AvatarImage src={msg.avatar_url} /> : null}
                            <AvatarFallback className={`${getAvatarColor(msg.username)} text-white text-xs sm:text-sm font-medium`}>
                              {isAnonMsg ? "?" : msg.username.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 ${isDark ? "border-slate-800" : "border-white"} ${userOnline ? "bg-emerald-500" : "bg-slate-300"}`} />
                        </div>
                        <div className={`max-w-[75%] sm:max-w-[70%] ${isOwn ? "text-right" : ""}`}>
                          <div className={`flex items-center gap-1 sm:gap-2 mb-1 ${isOwn ? "flex-row-reverse" : ""}`}>
                            <span className={`text-xs sm:text-sm font-semibold ${isAnonMsg ? "text-slate-400 italic" : isDark ? "text-white" : "text-slate-700"}`}>
                              {msg.username}
                            </span>
                            {userOnline && <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />}
                            <span className={`text-[10px] sm:text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}>{formatDateTime(msg.created_at)}</span>
                          </div>
                          
                          {isEditing ? (
                            <div className="flex gap-2">
                              <Input value={editingContent} onChange={(e) => setEditingContent(e.target.value)} className={`text-sm ${isDark ? "bg-slate-700 border-slate-600 text-white" : ""}`} autoFocus />
                              <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700" onClick={() => handleEditMessage(msg.id)}><Send className="w-3 h-3" /></Button>
                              <Button size="sm" variant="ghost" onClick={() => setEditingMessageId(null)}><X className="w-3 h-3" /></Button>
                            </div>
                          ) : (
                            <div className="relative group">
                              <div className={`inline-block rounded-2xl px-3 py-2 sm:px-4 sm:py-2.5 ${isOwn ? "bg-gradient-to-br from-indigo-500 to-indigo-600 text-white rounded-tr-sm" : isDark ? "bg-slate-700 text-white rounded-tl-sm" : "bg-white text-slate-700 rounded-tl-sm shadow-sm"}`}>
                                <p className="text-xs sm:text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                              </div>
                              
                              {isOwn && (
                                <div className={`absolute top-0 ${isOwn ? "left-0 -translate-x-full pr-1" : "right-0 translate-x-full pl-1"}`}>
                                  <button
                                    onClick={() => setActiveMenu(activeMenu === msg.id ? null : msg.id)}
                                    className={`opacity-0 group-hover:opacity-100 p-1 rounded transition-opacity ${isDark ? "hover:bg-slate-700" : "hover:bg-slate-200"}`}
                                  >
                                    <MoreVertical className={`w-4 h-4 ${isDark ? "text-slate-400" : "text-slate-500"}`} />
                                  </button>
                                  {activeMenu === msg.id && (
                                    <div className={`absolute top-6 right-0 shadow-lg rounded-xl py-1 z-10 min-w-[120px] ${isDark ? "bg-slate-700 border border-slate-600" : "bg-white border border-slate-200"}`}>
                                      <button
                                        onClick={() => { setEditingMessageId(msg.id); setEditingContent(msg.content); setActiveMenu(null) }}
                                        className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 ${isDark ? "hover:bg-slate-600 text-slate-200" : "hover:bg-slate-50 text-slate-700"}`}
                                      >
                                        <Pencil className="w-3.5 h-3.5" /> Tahrirlash
                                      </button>
                                      <button
                                        onClick={() => { handleDeleteMessage(msg.id); setActiveMenu(null) }}
                                        className="w-full px-3 py-2 text-left text-sm hover:bg-rose-50 text-rose-600 flex items-center gap-2"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" /> O'chirish
                                      </button>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            <div className={`p-3 sm:p-4 border-t shrink-0 ${isDark ? "border-slate-700" : "border-slate-200"}`}>
              <form onSubmit={handleSend} className="flex gap-2">
                <Input
                  placeholder={!isOnline ? "Aloqa yo'q..." : isAnonymous ? "Anonim xabar..." : "Xabar yozing..."}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  disabled={sending || !isOnline}
                  className={`flex-1 text-sm ${isDark ? "bg-slate-700 border-slate-600 text-white placeholder:text-slate-500" : "bg-white"}`}
                  autoFocus
                />
                <Button type="submit" disabled={!newMessage.trim() || sending || !isOnline} className="px-3 sm:px-4 bg-indigo-600 hover:bg-indigo-700">
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </form>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
