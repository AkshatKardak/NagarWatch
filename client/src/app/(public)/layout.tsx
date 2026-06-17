import { Navbar } from "@/components/layout/Navbar";
import type { ReactNode } from "react";

/**
 * Public route group layout — wraps /map and /complaints.
 * Adds the Navbar so users can navigate back from any public page.
 */
export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F9F7F4" }}>
      <Navbar />
      {children}
    </div>
  );
}
