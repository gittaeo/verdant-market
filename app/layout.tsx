import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VERDANT — 시장의 소음 너머",
  description: "공시에서 시작하는 근거 중심 주식 리서치",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased">{children}</body>
    </html>
  );
}
