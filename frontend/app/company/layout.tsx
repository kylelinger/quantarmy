'use client'

import { CompanyProvider } from '@/lib/CompanyContext'
import { SidebarConnected } from '@/components/Sidebar/SidebarConnected'
import { MobileNav } from '@/components/MobileNav'
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
          {/* Desktop Sidebar — hidden on mobile */}
          <SidebarConnected />

          {/* Main Content */}
          <div className="flex-1 lg:ml-[var(--sidebar-width)] flex flex-col">
            {/* Content Area — extra bottom padding on mobile for nav bar */}
            <main className="flex-1 p-4 lg:p-8 overflow-y-auto pb-20 lg:pb-8">
              {children}
            </main>

            {/* Bottom Trade Log */}
            <div className="hidden lg:block">
              <PaperTradeLog />
            </div>
          </div>

          {/* Mobile Bottom Nav — visible on mobile only */}
          <MobileNav />
        </div>
      </ToastProvider>
    </CompanyProvider>
  )
}
