import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GenConverAI - Language Learning",
  description:
    "Master Japanese and English conversation naturally with AI-powered learning",
  keywords: ["Japanese", "English", "Language Learning", "JLPT", "CEFR", "AI"],
  authors: [{ name: "Siravich Boonyuen" }],
  icons: {
    icon: "/logo.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className="min-h-screen bg-transparent text-slate-200 font-sans selection:bg-emerald-500/30"
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
