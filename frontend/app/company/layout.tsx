import { Sidebar } from '@/components/Sidebar'
import { TradeLog } from '@/components/TradeLog'

export default function CompanyLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen">
      {/* Left Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 ml-[var(--sidebar-width)] flex flex-col">
        {/* Content Area */}
        <main className="flex-1 p-8 overflow-y-auto">
          {children}
        </main>

        {/* Bottom Trade Log */}
        <TradeLog />
      </div>
    </div>
  )
}
