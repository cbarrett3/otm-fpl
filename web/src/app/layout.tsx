import type { Metadata } from "next";
import { Geist, Geist_Mono, Unbounded } from "next/font/google";
import "./globals.css";
import { Footer } from "@/components/footer";
import { TopProgress } from "@/components/ui/top-progress";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const unbounded = Unbounded({ subsets: ['latin'], variable: '--font-display', weight: ['400','600','700'] })

export const metadata: Metadata = {
  title: "OTM FPL Draftkit 2025/26",
  description:
    "2025/26 FPL Draft Kit – compare positions side‑by‑side, predicted XIs, highlights, smart pairing, and Fantrax CSV export.",
  keywords: [
    "FPL",
    "Fantasy Premier League",
    "FPL Draft 2025/26",
    "Premier League draft tool",
    "Fantrax export",
    "predicted lineups",
    "GW1 XIs",
    "player comparison",
    "draft rankings",
  ],
  metadataBase: new URL("https://fpldraftkit.com"),
  alternates: { canonical: "/" },
  openGraph: {
    title: "OTM FPL Draftkit 2025/26",
    description:
      "The only stripped‑back FPL draft kit for 2025/26: compare positions side‑by‑side, predicted XIs, highlights, smart pairing, Fantrax CSV.",
    url: "https://fpldraftkit.com",
    siteName: "OTM FPL Draftkit",
    images: [{ url: "/favicon.svg", width: 512, height: 512 }],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "OTM FPL Draftkit 2025/26",
    description: "Compare players quickly, predicted XIs, highlights, smart pairing – export to Fantrax.",
    images: ["/favicon.svg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1, 'max-video-preview': -1 },
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon.svg", type: 'image/svg+xml' },
    ],
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
      <body className={`${geistSans.variable} ${geistMono.variable} ${unbounded.variable} antialiased bg-black text-white relative`}>
        <TopProgress />
        {/* Subtle stadium/noise background */}
        <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
          <div className="absolute inset-0 bg-[radial-gradient(1200px_600px_at_50%_-200px,rgba(234,179,8,0.06),transparent)]" />
          <div className="absolute inset-0 bg-[url('/bg/pl-stadium-noise.webp')] bg-center bg-cover opacity-20" />
          {/* Subtle rotating conic glow for depth */}
          <div
            className="absolute inset-0 opacity-15 [mask-image:radial-gradient(80%_60%_at_50%_40%,#000_60%,transparent_100%)] animate-[spin_60s_linear_infinite]"
            style={{
              background:
                'conic-gradient(from 120deg at 50% 30%, rgba(250,204,21,0.08), transparent 40%, rgba(255,255,255,0.06) 60%, transparent)'
            }}
          />
        </div>
        {/* Preload app bundle in the background for faster route changes */}
        <script dangerouslySetInnerHTML={{ __html: `
          (function(){
            try { fetch('/api/app-bundle', { cache: 'force-cache' }); } catch(e) {}
          })();
        ` }} />
        {/* Structured data for SEO */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'SoftwareApplication',
          name: 'OTM FPL Draftkit 2025/26',
          applicationCategory: 'SportsApplication',
          operatingSystem: 'Web',
          url: 'https://fpldraftkit.com',
          description: 'FPL Draft kit for the 2025/26 season featuring player comparisons, predicted XIs, highlights, and Fantrax CSV export.',
          keywords: 'FPL Draft 2025/26, Premier League draft tool, Fantrax export, predicted lineups, player comparison'
        }) }} />
        <div className="min-h-screen flex flex-col">
          <div className="sticky top-0 z-40 h-0">
            <div className="pointer-events-none border-b border-yellow-400/60"></div>
          </div>
          <div className="flex-1">{children}</div>
          <Footer />
        </div>
      </body>
    </html>
  );
}
