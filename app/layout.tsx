import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'LinkBot Dashboard',
  description: 'Dylan\'s personal ops dashboard',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
