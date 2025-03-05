"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { AuthError } from "@supabase/supabase-js"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Alert } from "@/components/ui/alert"

export default function AuthForm({ mode }: { mode: "login" | "signup" | "forgot-password" }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClientComponentClient()

  const handleSubmit = async (formData: FormData) => {
    setLoading(true)
    setError(null)
    setSuccess(null)

    const email = formData.get("email") as string
    const password = formData.get("password") as string

    try {
      if (mode === "forgot-password") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        })
        if (error) throw error
        setSuccess("Check your email for password reset instructions")
      } else if (mode === "signup") {
        const { error, data } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        })
        if (error) {
          if (error.message.includes("already registered") || error.message.includes("unique constraint") || error.message.includes("already exists") || error.status === 422) {
            throw new Error("An account with this email already exists")
          }
          throw error
        }
        if (data?.user && !data.user.identities?.length) {
          throw new Error("An account with this email already exists")
        }
        setSuccess("Verification email sent! Please check your inbox")
      } else {
        const { error, data } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) {
          switch (error.message) {
            case "Invalid login credentials":
            case "Invalid email or password":
              throw new Error("Incorrect email or password")
            case "Email not confirmed":
              throw new Error("Please verify your email before logging in")
            default:
              throw error
          }
        }
        if (data?.user) {
          if (!data.user.email_confirmed_at) {
            throw new Error("Please verify your email before logging in")
          }
          // Get a fresh session after login
          const { data: { session } } = await supabase.auth.getSession()
          if (session) {
            router.refresh() // Refresh server components
            router.push("/dashboard")
          }
        }
      }
    } catch (error) {
      if (error instanceof AuthError || error instanceof Error) {
        setError(error.message)
      } else {
        setError("An unexpected error occurred")
      }
    } finally {
      setLoading(false)
    }
  }

  const title = mode === "login" ? "Log In" : mode === "signup" ? "Sign Up" : "Reset Password"

  return (
    <form action={handleSubmit} className="flex flex-col gap-4 px-4 sm:px-16 w-full">
      {error && (
        <Alert variant="destructive" className="text-sm">
          {error}
        </Alert>
      )}
      {success && (
        <Alert className="text-sm text-emerald-500 bg-emerald-500/10 border-emerald-500/20">
          {success}
        </Alert>
      )}
      <div className="grid gap-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="you@example.com"
          required
          disabled={loading}
        />
      </div>
      {mode !== "forgot-password" && (
        <div className="grid gap-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            placeholder="••••••••"
            required
            disabled={loading}
          />
        </div>
      )}
      <Button className="mt-2" disabled={loading}>
        {loading ? "Please wait..." : title}
      </Button>
    </form>
  )
}
