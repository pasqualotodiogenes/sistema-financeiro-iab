import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/toaster";
import { ToastProvider } from "@/components/ui/toast";
import { AuthProvider } from "@/contexts/auth-context";

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "IAB IGREJINHA - Sistema Financeiro",
  description: "Sistema de Administração Financeira da Igreja Assembleia de Deus",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <AuthProvider>
          <ToastProvider>
            {children}
            <Toaster />
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
