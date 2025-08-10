import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Footer } from "@/components/footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "OTM FPL Draftkit",
  description: "A stripped‑back draft‑kit. Compare players, craft your board, export when you’re ready. Shareable links to continue progress on other devices.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
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
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-black text-white relative`}>
        {/* Subtle stadium/noise background */}
        <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
          <div className="absolute inset-0 bg-[radial-gradient(1200px_600px_at_50%_-200px,rgba(234,179,8,0.06),transparent)]" />
          <div className="absolute inset-0 bg-[url('/bg/pl-stadium-noise.webp')] bg-center bg-cover opacity-20" />
        </div>
        {/* Preload app bundle in the background for faster route changes */}
        <script dangerouslySetInnerHTML={{ __html: `
          (function(){
            try { fetch('/api/app-bundle', { cache: 'force-cache' }); } catch(e) {}
          })();
        ` }} />
        <div className="min-h-screen flex flex-col">
          <div className="flex-1">{children}</div>
          <Footer />
        </div>
      </body>
    </html>
  );
}
