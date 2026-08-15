import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import AppProviders from "@/components/providers/AppProviders";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "NagarWatch - Civic Issue Reporting",
  description:
    "India's civic intelligence platform. Report issues, track progress, and hold authorities accountable.",
  icons: {
    icon: [
      { url: "/favicon.png", type: "image/png", sizes: "any" },
      { url: "/favicon.png", type: "image/png", sizes: "32x32" },
      { url: "/favicon.png", type: "image/png", sizes: "16x16" },
    ],
    apple: [
      { url: "/favicon.png", type: "image/png", sizes: "180x180" },
    ],
    shortcut: "/favicon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Explicit link tags override Next.js default favicon.ico (Vercel logo) */}
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon.png" />
        <link rel="shortcut icon" type="image/png" href="/favicon.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/favicon.png" />
      </head>
      <body className={`${inter.className} min-h-screen bg-background text-foreground`}>
        <ClerkProvider
          signInFallbackRedirectUrl="/"
          signUpFallbackRedirectUrl="/"
          appearance={{
            // Clerk-hosted pages (account portal, email templates) use favicon.png
            layout: {
              logoImageUrl: "/favicon.png",
              logoLinkUrl: "/",
              socialButtonsVariant: "iconButton",
              socialButtonsPlacement: "top",
            },
            variables: {
              colorPrimary: "#2563eb",
            },
          }}
        >
          <AppProviders>{children}</AppProviders>
        </ClerkProvider>
      </body>
    </html>
  );
}
