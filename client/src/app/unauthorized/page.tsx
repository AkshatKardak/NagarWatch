"use client"

import { useRouter } from "next/navigation"
import { useClerk } from "@clerk/nextjs"
import { ShieldOff } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function UnauthorizedPage() {
  const router = useRouter()
  const { signOut } = useClerk()

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4 text-center gap-6">
      <div className="flex flex-col items-center">
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-red-50 text-red-500">
          <ShieldOff className="w-16 h-16 text-red-400" />
        </div>
        <h1 className="text-2xl font-bold text-gray-800 mt-4">Access Denied</h1>
        <p className="text-gray-500 mt-1 max-w-sm">
          You don&apos;t have permission to view this page.
        </p>
        <p className="text-xs text-gray-400 mt-2">
          Your role may not be configured. Contact an administrator.
        </p>
      </div>
      <div className="flex flex-col sm:flex-row gap-3">
        <Button onClick={() => router.push("/")} variant="default">
          Go to Home
        </Button>
        <Button
          onClick={() => signOut(() => router.push("/"))}
          variant="destructive"
        >
          Sign Out
        </Button>
      </div>
    </main>
  )
}
