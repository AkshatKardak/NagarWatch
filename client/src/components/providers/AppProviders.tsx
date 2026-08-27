"use client"

import * as React from "react"
import { useEffect } from "react"
import { useAuth, useUser } from "@clerk/nextjs"
import { useAuthToken } from "@/hooks/useAuthToken"
import { useSocket } from "@/hooks/useSocket"
import { setAuthToken, usersAPI } from "@/lib/api"
import { ToasterProvider } from "@/components/providers/ToasterProvider"
import { OAuthRoleModal } from "@/components/auth/OAuthRoleModal"
import "@/lib/i18n"

interface AppProvidersProps {
  children: React.ReactNode
}

export default function AppProviders({ children }: AppProvidersProps) {
  // 1. Register the live token fetcher into the axios interceptor
  useAuthToken()

  // 2. Socket connection
  useSocket()

  const { getToken, isSignedIn } = useAuth()
  const { user } = useUser()

  // 3. Sync user to backend — explicitly fetches a fresh token first
  //    so this can never race against useAuthToken's async registration.
  useEffect(() => {
    if (!isSignedIn || !user) return

    const email = user.primaryEmailAddress?.emailAddress ?? ""
    const name = user.fullName ?? ""
    const role =
      (user.unsafeMetadata?.requestedRole as string) ||
      (typeof window !== "undefined" ? localStorage.getItem("nagarwatch_selected_role") : null) ||
      undefined

    async function syncUserData(): Promise<void> {
      try {
        // Guarantee the token is in the cache before ANY api call fires.
        const token = await getToken()
        setAuthToken(token)
        await usersAPI.sync({ email, name, role })
      } catch (error) {
        console.error("Failed to sync user data:", error)
      }
    }

    void syncUserData()
  // user.id is stable; avoids re-running on every render
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSignedIn, user?.id])

  return (
    <ToasterProvider>
      {children}
      <OAuthRoleModal />
    </ToasterProvider>
  )
}

