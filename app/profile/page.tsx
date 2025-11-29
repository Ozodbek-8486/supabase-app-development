import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Header from "@/components/header"
import ProfileCard from "@/components/profile-card"

export default async function ProfilePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  return (
    <div className="min-h-screen bg-background">
      <Header user={user} />
      <main className="max-w-2xl mx-auto px-4 py-8">
        <ProfileCard user={user} profile={profile} />
      </main>
    </div>
  )
}
