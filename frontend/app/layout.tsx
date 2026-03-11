import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'QuantArmy — AI Quantitative Trading Team',
  description: 'Build and run your AI quantitative trading team in a fully simulated environment.',
  icons: { icon: '/favicon.ico' },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body>{children}</body>
    </html>
  )
}
