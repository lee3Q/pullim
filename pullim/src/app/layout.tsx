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
  themeColor: "#7c3aed",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased">
        <StoreProvider>{children}</StoreProvider>
      </body>
    </html>
  );
}
