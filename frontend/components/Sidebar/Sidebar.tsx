'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { ROLES, type RoleType } from '@/lib/types'

interface SidebarProps {
  companyName?: string
  activeRoles?: Record<RoleType, { status: 'active' | 'idle' | 'error'; skillName: string | null }>
}

export function Sidebar({ companyName = '我的量化公司', activeRoles }: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside className="w-[var(--sidebar-width)] h-screen bg-dark-900 border-r border-dark-800 flex flex-col fixed left-0 top-0 z-10">
      {/* Company Header */}
      <div className="p-5 border-b border-dark-800">
        <Link href="/company" className="block">
          <h2 className="text-lg font-bold text-dark-100 truncate">{companyName}</h2>
          <p className="text-xs text-dark-500 mt-1">量化军团</p>
        </Link>
      </div>

      {/* Role List */}
      <nav className="flex-1 overflow-y-auto p-3">
        <p className="text-xs text-dark-500 uppercase tracking-wider px-3 mb-3">团队成员</p>
        <ul className="space-y-1">
          {ROLES.map((role) => {
            const isActive = pathname?.includes(`/company/${role.type}`)
            const roleStatus = activeRoles?.[role.type]

            return (
              <li key={role.type}>
                <Link
                  href={`/company/${role.type}`}
                  className={cn(
                    'flex items-center gap-3 px-3 py-3 rounded-lg transition-colors group',
                    isActive
                      ? 'bg-dark-800 text-dark-100'
                      : 'text-dark-400 hover:bg-dark-850 hover:text-dark-200'
                  )}
                >
                  {/* Icon */}
                  <span className="text-xl flex-shrink-0">{role.icon}</span>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{role.label}</span>
                      {roleStatus && (
                        <span
                          className={cn('status-dot', {
                            'status-active': roleStatus.status === 'active',
                            'status-idle': roleStatus.status === 'idle',
                            'status-error': roleStatus.status === 'error',
                          })}
                        />
                      )}
                    </div>
                    <p className="text-xs text-dark-500 truncate mt-0.5">
                      {roleStatus?.skillName ?? '未装备'}
                    </p>
                  </div>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Bottom Actions */}
      <div className="p-3 border-t border-dark-800 space-y-2">
        <Link
          href="/company"
          className="flex items-center gap-2 px-3 py-2 text-sm text-dark-400 hover:text-dark-200 transition-colors rounded-lg hover:bg-dark-850"
        >
          📊 仪表盘
        </Link>
        <Link
          href="/company/settings"
          className="flex items-center gap-2 px-3 py-2 text-sm text-dark-400 hover:text-dark-200 transition-colors rounded-lg hover:bg-dark-850"
        >
          ⚙️ 设置
        </Link>
      </div>
    </aside>
  )
}
