import type { Metadata } from 'next'
import { Inter, Outfit } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const outfit = Outfit({ subsets: ['latin'], variable: '--font-outfit' })

export const metadata: Metadata = {
  title: 'KK Retainer ERP - Client & Commission Billing Dashboard',
  description: 'A premium full-stack ERP for billing and commission tracking',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable}`}>
      <body className="antialiased bg-[#0f111a] text-slate-200">
        <div className="flex h-screen overflow-hidden">
          {/* Main App Content */}
          <main className="flex-1 flex flex-col h-full overflow-hidden">
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}
