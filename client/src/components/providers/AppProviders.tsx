"use client"

import * as React from "react"
import { useEffect } from "react"
import { useUser } from "@clerk/nextjs"
import { useAuthToken } from "@/hooks/useAuthToken"
import { useSocket } from "@/hooks/useSocket"
import { usersAPI } from "@/lib/api"
import { useUserStore } from "@/store/userStore"

interface AppProvidersProps {
  children: React.ReactNode
}

export default function AppProviders({ children }: AppProvidersProps) {
  // 1. Calls useAuthToken() — keeps API Bearer token synced with Clerk
  useAuthToken()

  // 2. Calls useSocket() — initializes socket connection
  useSocket()

  const { user, isSignedIn } = useUser()
  const syncUser = useUserStore((state) => state.syncUser)

  // 3. On user sign-in (when useUser().isSignedIn becomes true)
  useEffect(() => {
    if (isSignedIn && user) {
      const email = user.primaryEmailAddress?.emailAddress || ""
      const name = user.fullName || ""
      
      const syncUserData = async () => {
        try {
          // Calls usersAPI.sync
          await usersAPI.sync({ email, name })
          // Calls useUserStore.syncUser() to store user in Zustand
          await syncUser({ email, name })
        } catch (error) {
          console.error("Failed to sync user data:", error)
        }
      }
      
      void syncUserData()
    }
  }, [isSignedIn, user, syncUser])

  // 4. Renders {children}
  return <>{children}</>
}
