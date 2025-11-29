"use client"

import { useState, useEffect, useRef } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Send, MessageCircle, Loader2, Settings, X, Upload, Pencil, Trash2, Copy, Shield, Eye, EyeOff, LogOut, Key } from "lucide-react"

const SUPABASE_URL = "https://kmdphhqcfbxwbnttnmqc.supabase.co"
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttZHBoaHFjZmJ4d2JudHRubXFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgxNzI5NDAsImV4cCI6MjA2Mzc0ODk0MH0.vMvE2cPe5ibJCCR7uvpODrBXQnIBLUV-J_BKjxoGJWI"

interface Message {
  id: string
  username: string
  content: string
  created_at: string
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
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [sending, setSending] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [editName, setEditName] = useState("")
  const [editAvatar, setEditAvatar] = useState("")
  const [supabase, setSupabase] = useState<ReturnType<typeof createBrowserClient> | null>(null)
  const [showKeyInput, setShowKeyInput] = useState(false)
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
  const [editingContent, setEditingContent] = useState("")
  const [isAdmin, setIsAdmin] = useState(false)
  const [showAdminLogin, setShowAdminLogin] = useState(false)
  const [showAdminMenu, setShowAdminMenu] = useState(false)
  const [showChangePassword, setShowChangePassword] = useState(false)
  const [adminPassword, setAdminPassword] = useState("")
  const [newAdminPassword, setNewAdminPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [savedAdminPassword, setSavedAdminPassword] = useState("admin123")
  const scrollRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Supabase client
  useEffect(() => {
    const key = localStorage.getItem("supabase_anon_key")
    if (key) {
      setSupabase(createBrowserClient(SUPABASE_URL, key))
    } else {
      setShowKeyInput(true)
    }

    // Admin tekshirish
    const savedAdmin = localStorage.getItem("chat_is_admin")
    if (savedAdmin === "true") {
      setIsAdmin(true)
    }

    // Admin parolini yuklash
    const savedPass = localStorage.getItem("chat_admin_password")
    if (savedPass) {
      setSavedAdminPassword(savedPass)
    }
  }, [])

  // Foydalanuvchi ma'lumotlari
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
  }, [])

  // Xabarlarni yuklash
  useEffect(() => {
    if (!username || !supabase) return

    const fetchMessages = async () => {
      try {
        const { data, error } = await supabase
          .from("chat_messages")
          .select("*")
          .order("created_at", { ascending: true })

        if (error) {
          console.error("Yuklashda xatolik:", JSON.stringify(error, null, 2))
          alert(`Yuklashda xatolik: ${error.message || error.code || JSON.stringify(error)}`)
          return
        }
        if (data) setMessages(data)
      } catch (err) {
        console.error("Xatolik:", err)
      }
    }

    fetchMessages()

    const channel = supabase
      .channel("chat-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages" },
        (payload) => {
          const newMsg = payload.new as Message
          setMessages((prev) => {
            if (prev.find((m) => m.id === newMsg.id)) return prev
            return [...prev, newMsg]
          })
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "chat_messages" },
        (payload) => {
          const updated = payload.new as Message
          setMessages((prev) => prev.map((m) => m.id === updated.id ? updated : m))
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "chat_messages" },
        (payload) => {
          const deleted = payload.old as { id: string }
          setMessages((prev) => prev.filter((m) => m.id !== deleted.id))
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [username, supabase])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || sending || !supabase) return

    setSending(true)
    try {
      const { error } = await supabase.from("chat_messages").insert({
        username,
        content: newMessage.trim(),
      })
      if (error) {
        console.error("Yuborishda xatolik:", JSON.stringify(error, null, 2))
        alert(`Yuborishda xatolik: ${error.message || error.code || JSON.stringify(error)}`)
      } else {
        setNewMessage("")
      }
    } catch (err) {
      console.error("Xatolik:", err)
    } finally {
      setSending(false)
    }
  }

  const handleEditMessage = async (id: string) => {
    if (!editingContent.trim() || !supabase) return
    try {
      await supabase.from("chat_messages").update({ content: editingContent.trim() }).eq("id", id)
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
      await supabase.from("chat_messages").delete().eq("id", id)
    } catch (err) {
      console.error("O'chirishda xatolik:", err)
    }
  }

  const handleCopyMessage = (content: string) => {
    navigator.clipboard.writeText(content)
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onloadend = () => {
      setEditAvatar(reader.result as string)
    }
    reader.readAsDataURL(file)
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

  const handleAdminLogin = () => {
    if (adminPassword === savedAdminPassword) {
      setIsAdmin(true)
      localStorage.setItem("chat_is_admin", "true")
      setShowAdminLogin(false)
      setAdminPassword("")
      setShowPassword(false)
    } else {
      alert("Parol noto'g'ri!")
    }
  }

  const handleAdminLogout = () => {
    setIsAdmin(false)
    localStorage.removeItem("chat_is_admin")
    setShowAdminMenu(false)
  }

  const handleChangePassword = () => {
    if (newAdminPassword.length < 4) {
      alert("Parol kamida 4 ta belgi bo'lishi kerak!")
      return
    }
    setSavedAdminPassword(newAdminPassword)
    localStorage.setItem("chat_admin_password", newAdminPassword)
    setNewAdminPassword("")
    setShowChangePassword(false)
    setShowPassword(false)
    alert("Parol muvaffaqiyatli o'zgartirildi!")
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
    const colors = ["bg-rose-500", "bg-sky-500", "bg-emerald-500", "bg-amber-500", "bg-violet-500", "bg-pink-500", "bg-indigo-500", "bg-teal-500"]
    return colors[name.charCodeAt(0) % colors.length]
  }

  const canModify = (msgUsername: string) => {
    return msgUsername === username || isAdmin
  }

  if (showKeyInput || !supabase) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 to-indigo-100">
        <Card className="w-full max-w-md p-6">
          <div className="text-center mb-6">
            <MessageCircle className="w-12 h-12 mx-auto mb-3 text-indigo-600" />
            <h2 className="text-xl font-bold text-slate-800">Supabase sozlamalari</h2>
            <p className="text-sm mt-2 text-slate-500">
              Supabase Dashboard → Settings → API dan anon key ni oling
            </p>
          </div>
          <form onSubmit={(e) => {
            e.preventDefault()
            const input = (e.target as HTMLFormElement).key as HTMLInputElement
            if (input.value) {
              localStorage.setItem("supabase_anon_key", input.value)
              setSupabase(createBrowserClient(SUPABASE_URL, input.value))
              setShowKeyInput(false)
            }
          }}>
            <Input name="key" placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." className="mb-4" />
            <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700">
              Saqlash va boshlash
            </Button>
          </form>
        </Card>
      </div>
    )
  }

  if (!username) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-50 to-indigo-50 overflow-hidden">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-sm shadow-sm p-3 sm:p-4 shrink-0 relative z-[60]">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-2 rounded-xl bg-indigo-100">
              <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600" />
            </div>
            <h1 className="text-lg sm:text-xl font-bold text-slate-800">Muhokama</h1>
            {isAdmin && (
              <span className="bg-amber-100 text-amber-700 text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                <Shield className="w-3 h-3" /> Admin
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {/* Admin tugmasi */}
            <div className="relative">
              <button
                onClick={() => isAdmin ? setShowAdminMenu(!showAdminMenu) : setShowAdminLogin(true)}
                className={`p-2 rounded-xl transition-colors ${isAdmin ? "bg-amber-100 hover:bg-amber-200 text-amber-600" : "hover:bg-slate-100 text-slate-400 hover:text-slate-600"}`}
                title={isAdmin ? "Admin menyu" : "Admin kirish"}
              >
                <Shield className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>

              {/* Admin Menu */}
              {showAdminMenu && isAdmin && (
                <div className="absolute right-0 top-12 bg-white shadow-xl rounded-xl py-2 z-[100] min-w-[180px] border border-slate-200">
                  <button
                    onClick={() => {
                      setShowChangePassword(true)
                      setShowAdminMenu(false)
                    }}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50 flex items-center gap-2 text-slate-700"
                  >
                    <Key className="w-4 h-4" /> Parolni almashtirish
                  </button>
                  <button
                    onClick={handleAdminLogout}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-rose-50 flex items-center gap-2 text-rose-600"
                  >
                    <LogOut className="w-4 h-4" /> Adminlikdan chiqish
                  </button>
                </div>
              )}
            </div>

            {/* Profil */}
            <button 
              onClick={() => setShowSettings(true)}
              className="flex items-center gap-1 sm:gap-2 hover:bg-slate-100 rounded-xl p-1.5 sm:p-2 transition-colors"
            >
              <Avatar className="h-7 w-7 sm:h-8 sm:w-8 ring-2 ring-indigo-500 ring-offset-1">
                {avatarUrl ? <AvatarImage src={avatarUrl} /> : null}
                <AvatarFallback className={`${getAvatarColor(username)} text-white text-xs sm:text-sm font-medium`}>
                  {username.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="font-medium text-xs sm:text-sm text-slate-700 hidden sm:block">{username}</span>
              <Settings className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400" />
            </button>
          </div>
        </div>
      </header>

      {/* Admin Login Modal */}
      {showAdminLogin && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setShowAdminLogin(false)}>
          <Card className="w-full max-w-sm p-4 sm:p-6 relative bg-white" onClick={(e) => e.stopPropagation()}>
            <button 
              onClick={() => setShowAdminLogin(false)}
              className="absolute top-3 right-3 p-1 rounded-lg hover:bg-slate-100 text-slate-500"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="text-center mb-4">
              <Shield className="w-12 h-12 mx-auto mb-2 text-amber-500" />
              <h2 className="text-lg font-bold text-slate-800">Admin kirish</h2>
            </div>

            <div className="relative mb-4">
              <Input
                type={showPassword ? "text" : "password"}
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="Admin paroli"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <Button onClick={handleAdminLogin} className="w-full bg-amber-500 hover:bg-amber-600">
              Kirish
            </Button>
          </Card>
        </div>
      )}

      {/* Change Password Modal */}
      {showChangePassword && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setShowChangePassword(false)}>
          <Card className="w-full max-w-sm p-4 sm:p-6 relative bg-white" onClick={(e) => e.stopPropagation()}>
            <button 
              onClick={() => setShowChangePassword(false)}
              className="absolute top-3 right-3 p-1 rounded-lg hover:bg-slate-100 text-slate-500"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="text-center mb-4">
              <Key className="w-12 h-12 mx-auto mb-2 text-indigo-500" />
              <h2 className="text-lg font-bold text-slate-800">Parolni almashtirish</h2>
            </div>

            <div className="relative mb-4">
              <Input
                type={showPassword ? "text" : "password"}
                value={newAdminPassword}
                onChange={(e) => setNewAdminPassword(e.target.value)}
                placeholder="Yangi parol"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <Button onClick={handleChangePassword} className="w-full bg-indigo-600 hover:bg-indigo-700">
              Saqlash
            </Button>
          </Card>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setShowSettings(false)}>
          <Card className="w-full max-w-md p-4 sm:p-6 relative bg-white" onClick={(e) => e.stopPropagation()}>
            <button 
              onClick={() => setShowSettings(false)}
              className="absolute top-3 right-3 sm:top-4 sm:right-4 p-1 rounded-lg hover:bg-slate-100 text-slate-500"
            >
              <X className="w-5 h-5" />
            </button>
            
            <h2 className="text-lg sm:text-xl font-bold mb-4 sm:mb-6 text-center text-slate-800">
              Profil sozlamalari
            </h2>
            
            <div className="flex flex-col items-center mb-4 sm:mb-6">
              <Avatar className="h-20 w-20 sm:h-24 sm:w-24 ring-4 ring-indigo-500 ring-offset-2 mb-3">
                {editAvatar ? <AvatarImage src={editAvatar} /> : null}
                <AvatarFallback className={`${getAvatarColor(editName || username)} text-white text-2xl font-bold`}>
                  {(editName || username).charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-4 h-4 mr-2" />
                Rasm yuklash
              </Button>
            </div>

            <div className="mb-3 sm:mb-4">
              <label className="text-sm font-medium text-slate-700">Ism</label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Ismingiz"
                className="mt-1"
              />
            </div>

            <div className="mb-4 sm:mb-6">
              <label className="text-sm font-medium text-slate-700">Rasm URL (ixtiyoriy)</label>
              <Input
                value={editAvatar}
                onChange={(e) => setEditAvatar(e.target.value)}
                placeholder="https://example.com/avatar.jpg"
                className="mt-1"
              />
            </div>

            <Button onClick={handleSaveSettings} className="w-full bg-indigo-600 hover:bg-indigo-700">
              Saqlash
            </Button>
          </Card>
        </div>
      )}

      {/* Click outside to close admin menu */}
      {showAdminMenu && (
        <div className="fixed inset-0 z-40" onClick={() => setShowAdminMenu(false)} />
      )}

      {/* Messages */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <div className="h-full max-w-4xl w-full mx-auto p-2 sm:p-4 flex flex-col">
          <Card className="flex-1 min-h-0 flex flex-col overflow-hidden bg-white/80 backdrop-blur-sm">
            <div className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-4" ref={scrollRef}>
              {messages.length === 0 ? (
                <div className="h-full flex items-center justify-center text-slate-500">
                  <div className="text-center">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl mx-auto mb-3 flex items-center justify-center bg-slate-100">
                      <MessageCircle className="w-7 h-7 sm:w-8 sm:h-8 opacity-50" />
                    </div>
                    <p className="text-sm sm:text-base font-medium">Hali xabarlar yoq</p>
                    <p className="text-xs sm:text-sm opacity-70">Birinchi bolib xabar yozing!</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 sm:space-y-4">
                  {messages.map((msg) => {
                    const isOwn = msg.username === username
                    const isEditing = editingMessageId === msg.id
                    const showActions = canModify(msg.username)

                    return (
                      <div key={msg.id} className={`flex gap-2 sm:gap-3 ${isOwn ? "flex-row-reverse" : ""}`}>
                        <Avatar className="h-8 w-8 sm:h-9 sm:w-9 shrink-0">
                          {isOwn && avatarUrl ? <AvatarImage src={avatarUrl} /> : null}
                          <AvatarFallback className={`${getAvatarColor(msg.username)} text-white text-xs sm:text-sm font-medium`}>
                            {msg.username.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className={`max-w-[75%] sm:max-w-[70%] ${isOwn ? "text-right" : ""}`}>
                          <div className={`flex items-center gap-1 sm:gap-2 mb-1 ${isOwn ? "flex-row-reverse" : ""}`}>
                            <span className="text-xs sm:text-sm font-semibold text-slate-700">
                              {msg.username}
                            </span>
                            <span className="text-[10px] sm:text-xs text-slate-400">
                              {formatDateTime(msg.created_at)}
                            </span>
                          </div>

                          {isEditing ? (
                            <div className="flex gap-2">
                              <Input
                                value={editingContent}
                                onChange={(e) => setEditingContent(e.target.value)}
                                className="text-sm"
                                autoFocus
                              />
                              <Button size="sm" onClick={() => handleEditMessage(msg.id)}>
                                <Send className="w-3 h-3" />
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => setEditingMessageId(null)}>
                                <X className="w-3 h-3" />
                              </Button>
                            </div>
                          ) : (
                            <div className="group">
                              <div
                                className={`inline-block rounded-2xl px-3 py-2 sm:px-4 sm:py-2.5 ${
                                  isOwn
                                    ? "bg-indigo-600 text-white rounded-tr-sm"
                                    : "bg-white text-slate-700 rounded-tl-sm shadow-sm border border-slate-100"
                                }`}
                              >
                                <p className="text-xs sm:text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                              </div>

                              {/* Action Buttons */}
                              <div className={`flex gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity ${isOwn ? "justify-end" : "justify-start"}`}>
                                <button
                                  onClick={() => handleCopyMessage(msg.content)}
                                  className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
                                  title="Nusxalash"
                                >
                                  <Copy className="w-3.5 h-3.5" />
                                </button>
                                {showActions && (
                                  <>
                                    <button
                                      onClick={() => {
                                        setEditingMessageId(msg.id)
                                        setEditingContent(msg.content)
                                      }}
                                      className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-blue-600 transition-colors"
                                      title="Tahrirlash"
                                    >
                                      <Pencil className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteMessage(msg.id)}
                                      className="p-1.5 hover:bg-rose-50 rounded-lg text-slate-400 hover:text-rose-600 transition-colors"
                                      title="O'chirish"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-3 sm:p-4 shrink-0 bg-slate-50 border-t border-slate-200">
              <form onSubmit={handleSend} className="flex gap-2">
                <Input
                  placeholder="Xabar yozing..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  disabled={sending}
                  className="flex-1 text-sm h-11 bg-white border-slate-300 focus:border-indigo-500 focus:ring-indigo-500"
                  autoFocus
                />
                <Button 
                  type="submit" 
                  disabled={!newMessage.trim() || sending} 
                  className="px-4 sm:px-5 h-11 bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  {sending ? <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" /> : <Send className="h-4 w-4 sm:h-5 sm:w-5" />}
                </Button>
              </form>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}


//salom 