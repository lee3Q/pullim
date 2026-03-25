import type { Metadata, Viewport } from "next";
import StoreProvider from "@/components/StoreProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "풀림 — 고민이 정리되는 곳",
  description:
    "감정 정리하러 왔는데, 결정까지 됐다. AI와 함께 고민을 풀어보세요.",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#7c3aed",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
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
        <StoreProvider>{children}</StoreProvider>
      </body>
    </html>
  );
}
