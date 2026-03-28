import type { Metadata, Viewport } from "next";
import { Gowun_Batang, Noto_Serif_KR } from "next/font/google";
import StoreProvider from "@/components/StoreProvider";
import NativeInit from "@/components/NativeInit";
import "./globals.css";

const gowunBatang = Gowun_Batang({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-gowun",
  display: "swap",
});

const notoSerifKR = Noto_Serif_KR({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-noto-serif",
  display: "swap",
});

export const metadata: Metadata = {
  title: "풀림 — 3분이면 나를 알 수 있어요",
  description: "AI가 당신의 선택을 읽고, 당신도 몰랐던 유형을 알려줍니다",
  manifest: "/manifest.json",
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/icon-192.png",
  },
  metadataBase: new URL("https://pullim.vercel.app"),
  openGraph: {
    title: "풀림 — 3분이면 나를 알 수 있어요",
    description: "AI가 당신의 선택을 읽고, 당신도 몰랐던 유형을 알려줍니다",
    images: [{ url: "/images/og/og_main.png", width: 1200, height: 630 }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "풀림 — 3분이면 나를 알 수 있어요",
    description: "AI가 당신의 선택을 읽고, 당신도 몰랐던 유형을 알려줍니다",
    images: ["/images/og/og_main.png"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#12101a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`${gowunBatang.variable} ${notoSerifKR.variable}`}>
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/galmuri/dist/galmuri.css"
          crossOrigin="anonymous"
        />
        {/* PWA — iOS standalone */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="풀림" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        {/* Service Worker 등록 */}
        <script
          dangerouslySetInnerHTML={{
            __html: `if('serviceWorker' in navigator){window.addEventListener('load',()=>{navigator.serviceWorker.register('/sw.js')})}`,
          }}
        />
      </head>
      <body className="antialiased overflow-x-hidden w-full max-w-screen">
        <NativeInit />
        <StoreProvider>{children}</StoreProvider>
      </body>
    </html>
  );
}
