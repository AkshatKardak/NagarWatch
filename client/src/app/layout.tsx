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
    // Primary favicon
    icon: [
      { url: "/favicon.png", type: "image/png" },
    ],
    // Apple touch icon (home screen on iOS)
    apple: [
      { url: "/favicon.png", type: "image/png" },
    ],
    // Shortcut icon (legacy browsers)
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
      <body className={`${inter.className} min-h-screen bg-background text-foreground`}>
        <ClerkProvider afterSignInUrl="/" afterSignUpUrl="/">
          <AppProviders>{children}</AppProviders>
        </ClerkProvider>
      </body>
    </html>
  );
}
