import type { Metadata } from "next";
import { AuthProvider } from "@/lib/auth";
import "./globals.css";
import "./dashboard.css";

export const metadata: Metadata = {
  title: "Interview Copilot",
  description:
    "Prepare for interviews with AI mock interviews, performance analytics, and personalised coaching.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-canvas font-sans antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
