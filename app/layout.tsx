import React from "react"
import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Dashboard de Ventas | Liverpool',
  description: 'Herramienta interna para el seguimiento y análisis corporativo de ventas.',
}

export const viewport: Viewport = {
  themeColor: '#833177',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es">
    <body
    className="antialiased bg-background text-foreground"
    style={{
      fontFamily:
      'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    }}
    >
    {children}
    </body>
    </html>
  )
}
