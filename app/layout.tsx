import type React from "react"
import { ToastProvider } from "@/components/ui/toast"
import "./globals.css"

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <title>OMNI3D</title>
        <meta name="description" content="Omni 3D - AI-powered 3D model generation" />
      </head>
      <body>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  )
}