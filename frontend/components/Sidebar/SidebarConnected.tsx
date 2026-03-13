'use client'

import Link from 'next/link'
import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useCompanyContext } from '@/lib/CompanyContext'
import { ROLES } from '@/lib/types'

export function SidebarConnected() {
  const pathname = usePathname()
  const { company, roles } = useCompanyContext()
  const [rolesOpen, setRolesOpen] = useState(false)

  const roleStatusMap: Record<string, { status: string; skillName: string | null }> = {}
  for (const role of roles) {
    roleStatusMap[role.role_type] = {
      status: role.status,
      skillName: role.active_skill_id ? `Skill #${role.active_skill_id.slice(0, 6)}` : null,
    }
  }

  // Auto-expand roles section when on a role page
  const onRolePage = ROLES.some(r => pathname?.includes(`/company/${r.type}`))

  const navItems = [
    { href: '/company/overview', icon: '📊', label: '总览', match: (p: string) => p === '/company/overview' },
    { href: '/company/watchlist', icon: '📋', label: '自选标的', match: (p: string) => p.includes('/watchlist') },
    { href: '/company', icon: '📈', label: '模拟盘', match: (p: string) => p === '/company' },
  ]

  return (
    <aside className="w-[var(--sidebar-width)] h-screen bg-dark-900 border-r border-dark-800 flex flex-col fixed left-0 top-0 z-10">
      {/* Company Header */}
      <div className="p-5 border-b border-dark-800">
        <Link href="/company/overview" className="block">
          <h2 className="text-lg font-bold text-dark-100 truncate">{company?.name ?? '量化军团'}</h2>
          <p className="text-xs text-dark-500 mt-1">QuantArmy v1.1</p>
        </Link>
      </div>

      {/* Main Nav */}
      <div className="p-3 pb-0 space-y-1">
        {navItems.map(item => {
          const active = pathname ? item.match(pathname) : false
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-2 px-3 py-3 text-sm font-semibold rounded-lg transition-colors',
                active
                  ? 'bg-army-900/30 text-army-400 border border-army-800/50'
                  : 'text-dark-200 hover:text-army-400 hover:bg-dark-850 border border-transparent'
              )}
            >
              {item.icon} {item.label}
            </Link>
          )
        })}
      </div>

      {/* Collapsible Role List */}
      <nav className="flex-1 overflow-y-auto p-3">
        <button
          onClick={() => setRolesOpen(!rolesOpen)}
          className="flex items-center justify-between w-full px-3 mb-2 group"
        >
          <p className="text-xs text-dark-500 uppercase tracking-wider">🤖 团队成员</p>
          <span className={cn(
            'text-dark-600 text-xs transition-transform',
            (rolesOpen || onRolePage) ? 'rotate-180' : ''
          )}>▾</span>
        </button>

        {(rolesOpen || onRolePage) && (
          <ul className="space-y-1">
            {ROLES.map((role) => {
              const isActive = pathname?.includes(`/company/${role.type}`)
              const rs = roleStatusMap[role.type]

              return (
                <li key={role.type}>
                  <Link
                    href={`/company/${role.type}`}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors group',
                      isActive
                        ? 'bg-dark-800 text-dark-100'
                        : 'text-dark-400 hover:bg-dark-850 hover:text-dark-200'
                    )}
                  >
                    <span className="text-lg flex-shrink-0">{role.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{role.label}</span>
                        {rs && (
                          <span
                            className={cn('status-dot', {
                              'status-active': rs.status === 'active',
                              'status-idle': rs.status === 'idle',
                              'status-error': rs.status === 'error',
                            })}
                          />
                        )}
                      </div>
                    </div>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}

        {/* Collapsed summary when roles hidden */}
        {!rolesOpen && !onRolePage && (
          <button
            onClick={() => setRolesOpen(true)}
            className="flex items-center gap-2 px-3 py-2 text-dark-500 hover:text-dark-300 text-xs transition-colors"
          >
            <span className="flex -space-x-1.5">
              {ROLES.slice(0, 4).map(r => (
                <span key={r.type} className="text-sm">{r.icon}</span>
              ))}
            </span>
            <span>8 角色在线 · 点击展开</span>
          </button>
        )}
      </nav>

      {/* Bottom Actions */}
      <div className="p-3 border-t border-dark-800 space-y-1">
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
