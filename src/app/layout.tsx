import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "What to Next", template: "%s · What to Next" },
  description: "흩어진 학교생활 기록을 연결해 다음 탐구의 방향을 제안하는 도구",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko" className="dark h-full antialiased">
      <body className="min-h-full bg-background text-foreground">{children}</body>
    </html>
  );
}
