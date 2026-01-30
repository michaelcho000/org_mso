import type { Metadata } from "next"
import "./globals.css"

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
      <head>
        <link
          rel="stylesheet"
          as="style"
          crossOrigin="anonymous"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css"
        />
      </head>
      <body className="font-sans">{children}</body>
    </html>
  )
}
