"use client"

import * as React from "react"
import { useEffect } from "react"
import { useAuth, useUser } from "@clerk/nextjs"
import { useSocket } from "@/hooks/useSocket"
import { setAuthToken, usersAPI } from "@/lib/api"
import { useUserStore } from "@/store/userStore"

interface AppProvidersProps {
  children: React.ReactNode
}

export default function AppProviders({ children }: AppProvidersProps) {
  const { getToken, isSignedIn } = useAuth()
  const { user } = useUser()
  const syncUser = useUserStore((state) => state.syncUser)

  // 1. Keep axios Bearer token in sync with Clerk — runs on every sign-in/out
  useEffect(() => {
    let active = true

    async function syncToken(): Promise<void> {
      if (isSignedIn) {
        const token = await getToken()
        if (active) setAuthToken(token)
      } else {
        setAuthToken(null)
      }
    }

    void syncToken()
    return () => { active = false }
  }, [getToken, isSignedIn])

  // 2. Sync user to backend — only after token is confirmed present
  useEffect(() => {
    if (!isSignedIn || !user) return

    const email = user.primaryEmailAddress?.emailAddress ?? ""
    const name = user.fullName ?? ""

    async function syncUserData(): Promise<void> {
      try {
        // Always fetch a fresh token and set it before making any API call.
        // This eliminates the race condition where usersAPI.sync fired before
        // the token was stored in the module-level `authToken` variable.
        const token = await getToken()
        setAuthToken(token)

        await usersAPI.sync({ email, name })
        await syncUser({ email, name })
      } catch (error) {
        console.error("Failed to sync user data:", error)
      }
    }

    void syncUserData()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSignedIn, user?.id])

  // 3. Socket connection
  useSocket()

  return <>{children}</>
}
