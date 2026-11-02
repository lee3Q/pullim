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
  title: "풀림 - 고민 정리와 작은 행동",
  description: "고민의 사실과 가정을 나누고, 선택지를 살펴본 뒤 작은 행동을 직접 고르는 실험 도구입니다. 진단이나 행동 예측을 제공하지 않습니다.",
  manifest: "/manifest.json",
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/icon-192.png",
  },
  metadataBase: new URL("https://pullim.vercel.app"),
  openGraph: {
    title: "풀림 - 고민 정리와 작은 행동",
    description: "고민의 사실과 가정을 나누고, 선택지를 살펴본 뒤 작은 행동을 직접 고르는 실험 도구입니다. 진단이나 행동 예측을 제공하지 않습니다.",
    images: [{ url: "/images/og/og_main.png", width: 1200, height: 630 }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "풀림 - 고민 정리와 작은 행동",
    description: "고민의 사실과 가정을 나누고, 선택지를 살펴본 뒤 작은 행동을 직접 고르는 실험 도구입니다. 진단이나 행동 예측을 제공하지 않습니다.",
    images: ["/images/og/og_main.png"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
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
