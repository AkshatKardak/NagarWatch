"use client";

import { Toaster } from "react-hot-toast";

export function ToasterProvider({ children }: { children?: React.ReactNode }) {
  return (
    <>
      <Toaster
        position="top-right"
        reverseOrder={false}
        gutter={10}
        containerStyle={{
          top: 20,
          right: 20,
        }}
        toastOptions={{
          duration: 4500,
          style: {
            background: "#1E293B",
            color: "#F8FAFC",
            borderRadius: "12px",
            padding: "12px 16px",
            fontSize: "13px",
            fontWeight: 500,
            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.25), 0 8px 10px -6px rgba(0, 0, 0, 0.2)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
          },
          success: {
            duration: 4000,
            iconTheme: {
              primary: "#10B981",
              secondary: "#FFFFFF",
            },
            style: {
              background: "#0F172A",
              color: "#F1F5F9",
              border: "1px solid rgba(16, 185, 129, 0.3)",
            },
          },
          error: {
            duration: 5500,
            iconTheme: {
              primary: "#EF4444",
              secondary: "#FFFFFF",
            },
            style: {
              background: "#1E1114",
              color: "#FEE2E2",
              border: "1px solid rgba(239, 68, 68, 0.35)",
            },
          },
          loading: {
            style: {
              background: "#0F172A",
              color: "#93C5FD",
              border: "1px solid rgba(59, 130, 246, 0.3)",
            },
          },
        }}
      />
      {children}
    </>
  );
}

export default ToasterProvider;
