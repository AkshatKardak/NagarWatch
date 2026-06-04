"use client"

import { useRouter } from "next/navigation"
import { MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  const router = useRouter()

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4 text-center gap-6">
      <div className="flex flex-col items-center">
        <MapPin className="w-20 h-20 text-gray-300 animate-bounce" />
        <h1 className="text-8xl font-bold text-gray-200 select-none">404</h1>
        <h2 className="text-2xl font-semibold text-gray-700 mt-2">Page Not Found</h2>
        <p className="text-gray-500 mt-1 max-w-sm">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
      </div>
      <div className="flex flex-col sm:flex-row gap-3">
        <Button onClick={() => router.push("/")} variant="default">
          &larr; Back to Home
        </Button>
        <Button onClick={() => router.push("/map")} variant="outline">
          View Live Map
        </Button>
      </div>
    </main>
  )
}
