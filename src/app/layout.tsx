import type { Metadata } from "next"
import { Inter, Noto_Sans_KR } from "next/font/google"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
})

const notoSansKR = Noto_Sans_KR({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-noto-sans-kr",
  display: "swap",
})

export const metadata: Metadata = {
  title: "조직도 관리",
  description: "Company와 Client 조직을 관리하는 웹앱",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body className={`${inter.variable} ${notoSansKR.variable} font-sans`}>{children}</body>
    </html>
  )
}
