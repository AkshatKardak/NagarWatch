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
        {/* Explicit favicon tags — ensures ALL browsers pick up favicon.png */}
        <link rel="icon" href="/favicon.png" type="image/png" />
        <link rel="shortcut icon" href="/favicon.png" type="image/png" />
        <link rel="apple-touch-icon" href="/favicon.png" />
      </head>
      <body className={`${inter.className} min-h-screen bg-background text-foreground`}>
        <ClerkProvider afterSignInUrl="/" afterSignUpUrl="/">
          <AppProviders>{children}</AppProviders>
        </ClerkProvider>
      </body>
    </html>
  );
}
