'use client'

import { CompanyProvider } from '@/lib/CompanyContext'
import { SidebarConnected } from '@/components/Sidebar/SidebarConnected'
import { PaperTradeLog } from '@/components/TradeLog/PaperTradeLog'
import { ToastProvider } from '@/components/Trading/Toast'

export default function CompanyLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <CompanyProvider>
      <ToastProvider>
        <div className="flex min-h-screen">
          {/* Left Sidebar */}
          <SidebarConnected />

          {/* Main Content */}
          <div className="flex-1 ml-[var(--sidebar-width)] flex flex-col">
            {/* Content Area */}
            <main className="flex-1 p-8 overflow-y-auto">
              {children}
            </main>

            {/* Bottom Trade Log — reads from paper-trading, no WebSocket needed */}
            <PaperTradeLog />
          </div>
        </div>
      </ToastProvider>
    </CompanyProvider>
  )
}
