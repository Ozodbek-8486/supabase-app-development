"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Heart } from "lucide-react"

interface Post {
  id: string
  title: string
  content: string
  user_id: string
  created_at: string
  profiles?: { display_name: string }
  likes?: { count: number }[]
  user_liked?: boolean
}

export default function PostsList() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const { data, error } = await supabase
          .from("posts")
          .select(
            `
            *,
            profiles:user_id(display_name),
            likes:likes(count)
          `,
          )
          .order("created_at", { ascending: false })

        if (error) throw error
        setPosts(data || [])
      } catch (error) {
        console.error("Error fetching posts:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchPosts()

    // Subscribe to real-time updates
    const channel = supabase
      .channel("posts")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "posts",
        },
        () => {
          fetchPosts()
        },
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [supabase])

  const handleLike = async (postId: string) => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase.from("likes").insert({
      post_id: postId,
      user_id: user.id,
    })

    if (!error) {
      // Refresh posts after liking
      const { data } = await supabase
        .from("posts")
        .select(
          `
          *,
          profiles:user_id(display_name),
          likes:likes(count)
        `,
        )
        .order("created_at", { ascending: false })

      setPosts(data || [])
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading posts...</div>
  }

  if (posts.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          No posts yet. Be the first to share!
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <Card key={post.id}>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-semibold">{post.title}</h3>
                <p className="text-sm text-muted-foreground">
                  by {(post.profiles as any)?.display_name || "Anonymous"} •{" "}
                  {new Date(post.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-foreground mb-4">{post.content}</p>
            <Button variant="outline" size="sm" onClick={() => handleLike(post.id)} className="gap-2">
              <Heart className="w-4 h-4" />
              {post.likes?.[0]?.count || 0} Likes
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
