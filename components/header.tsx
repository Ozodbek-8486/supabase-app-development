"use client"

import type { User } from "@supabase/supabase-js"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

export default function Header({ user }: { user: User }) {
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/")
  }

  return (
    <header className="border-b border-border sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-40">
      <nav className="max-w-2xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/feed" className="text-2xl font-bold text-primary">
          SocialFeed
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/profile">
            <Button variant="outline" size="sm">
              Profile
            </Button>
          </Link>
          <Button variant="outline" size="sm" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </nav>
    </header>
  )
}
