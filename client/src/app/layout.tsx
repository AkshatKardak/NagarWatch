import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { SocketProvider } from "@/components/providers/SocketProvider";
import AppProviders from "@/components/providers/AppProviders";
import { Toaster } from "sonner";
import "./globals.css";

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
    apple: [{ url: "/favicon.png", type: "image/png", sizes: "180x180" }],
    shortcut: "/favicon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider
      publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      appearance={{
        layout: {
          logoImageUrl: "/favicon.png",
          logoLinkUrl: "/",
          socialButtonsVariant: "iconButton",
          socialButtonsPlacement: "top",
        },
        variables: {
          colorPrimary: "#D95D0F",
        },
      }}
    >
      <html lang="en">
        <head>
          <link rel="icon" type="image/png" sizes="32x32" href="/favicon.png" />
          <link rel="icon" type="image/png" sizes="16x16" href="/favicon.png" />
          <link rel="shortcut icon" type="image/png" href="/favicon.png" />
          <link rel="apple-touch-icon" sizes="180x180" href="/favicon.png" />
        </head>
        <body className={`${inter.className} min-h-screen bg-background text-foreground`}>
          <QueryProvider>
            <SocketProvider>
              <AppProviders>
                {children}
                <Toaster richColors position="top-right" />
              </AppProviders>
            </SocketProvider>
          </QueryProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
