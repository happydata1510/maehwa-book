import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "매화유치원 책대장",
  description: "우리 아이 독서 기록 서비스",
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body
        className={`${geistSans.variable} font-sans antialiased bg-gray-50 text-gray-900`}
      >
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
