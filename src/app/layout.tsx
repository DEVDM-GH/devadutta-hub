import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Devadutta Mohapatra — Senior SDET & AI Builder",
  description:
    "Personal hub of Devadutta Mohapatra — Senior SDET, AI tools builder, fintech engineer based in Bangalore.",
  openGraph: {
    title: "Devadutta Mohapatra — Senior SDET & AI Builder",
    description:
      "7+ years in fintech QA. Building AI-powered engineering tools with Claude, MCP, and Cursor. Based in Bangalore.",
    url: "https://devadutta-hub.vercel.app",
    siteName: "DevaDutta Hub",
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Devadutta Mohapatra — Senior SDET & AI Builder",
    description: "7+ years in fintech QA. Building AI-powered engineering tools.",
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full`}
    >
      <body className="min-h-full antialiased">{children}</body>
    </html>
  );
}
