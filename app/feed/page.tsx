import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Header from "@/components/header"
import PostsList from "@/components/posts-list"
import CreatePostForm from "@/components/create-post-form"

export default async function FeedPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  return (
    <div className="min-h-screen bg-background">
      <Header user={user} />
      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="space-y-6">
          <CreatePostForm />
          <PostsList />
        </div>
      </main>
    </div>
  )
}
