'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/company/overview', icon: '📊', label: '总览', match: (p: string) => p === '/company/overview' },
  { href: '/company/watchlist', icon: '📋', label: '自选', match: (p: string) => p.includes('/watchlist') },
  { href: '/company', icon: '📈', label: '模拟盘', match: (p: string) => p === '/company' },
  { href: '/company/settings', icon: '⚙️', label: '设置', match: (p: string) => p === '/company/settings' },
]

export function MobileNav() {
  const pathname = usePathname()

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-dark-900 border-t border-dark-800 safe-area-bottom">
      <div className="flex items-center justify-around h-14">
        {navItems.map(item => {
          const active = pathname ? item.match(pathname) : false
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-colors min-w-[60px]',
                active ? 'text-army-400' : 'text-dark-500'
              )}
            >
              <span className="text-lg">{item.icon}</span>
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
