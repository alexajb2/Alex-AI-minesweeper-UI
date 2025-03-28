import type React from "react"
import "./globals.css"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { MinesweeperProvider } from "@/context/minesweeper-context"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "Minesweeper Solver",
  description: "An AI-powered Minesweeper solver application",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <MinesweeperProvider>{children}</MinesweeperProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}

