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
  title: "FPL Draft Wizard",
  description: "Compare players, prefer winners, and build cookie-saved draft rankings.",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {/* Preload app bundle in the background for faster route changes */}
        <script dangerouslySetInnerHTML={{ __html: `
          (function(){
            try { fetch('/api/app-bundle', { cache: 'force-cache' }); } catch(e) {}
          })();
        ` }} />
        {children}
      </body>
    </html>
  );
}
