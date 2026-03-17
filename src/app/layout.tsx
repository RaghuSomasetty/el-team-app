import type { Metadata, Viewport } from 'next'
import { Inter, Playfair_Display } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'
import PWARegister from '@/components/PWARegister'

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' })
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-serif' })

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export const metadata: Metadata = {
  title: 'ELECTRICAL MAINTENANCE APP | Powered by VoltMind AI',
  description: 'AI-powered electrical maintenance management system for DRI steel plant operations',
  manifest: '/manifest.json',
  themeColor: '#0a0f1e',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'ELECTRICAL APP'
  }
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${playfair.variable} font-sans`}>
        <Providers>
          {children}
          <PWARegister />
        </Providers>
      </body>
    </html>
  )
}
