"use client"

import { SignIn } from "@clerk/nextjs"
import { MapPin } from "lucide-react"

export default function SignInPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md rounded-xl border border-white/20 bg-white/80 p-8 shadow-xl backdrop-blur-md">
        <header className="mb-6 flex flex-col items-center text-center">
          <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600">
            <MapPin className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">NagarWatch</h1>
          <p className="mt-1 text-sm text-gray-500">Sign in to report and track civic issues</p>
        </header>
        <SignIn
          appearance={{
            elements: {
              rootBox: "w-full",
              card: "shadow-none border-0 p-0 bg-transparent",
              headerTitle: "hidden",
              headerSubtitle: "hidden",
              footerActionLink: "text-blue-600 hover:text-blue-700",
              formButtonPrimary: "bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold tracking-wider uppercase rounded-none py-2.5",
            },
          }}
          afterSignInUrl="/"
          signUpUrl="/sign-up"
        />
      </div>
    </main>
  )
}
