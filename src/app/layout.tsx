import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ScopeForge | Least-Privilege Capability Compiler for AI Agents",
  description: "Compile an AI agent's intended job into the minimum permissions it requires — then red-team those permissions before deployment.",
  icons: {
    icon: "/favicon.ico"
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark h-full bg-[#080c14] text-slate-100">
      <body className="min-h-full flex flex-col bg-[#080c14] text-slate-100 antialiased selection:bg-indigo-500/30 selection:text-indigo-200">
        {children}
      </body>
    </html>
  );
}
