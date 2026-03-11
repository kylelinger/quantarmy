'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useCompanyContext } from '@/lib/CompanyContext'
import { ROLES, type RoleType } from '@/lib/types'
import { startTrading, stopTrading } from '@/lib/hooks'

export function SidebarConnected() {
  const pathname = usePathname()
  const { company, roles, companyId, refresh } = useCompanyContext()

  const roleStatusMap: Record<string, { status: string; skillName: string | null }> = {}
  for (const role of roles) {
    roleStatusMap[role.role_type] = {
      status: role.status,
      skillName: role.active_skill_id ? `Skill #${role.active_skill_id.slice(0, 6)}` : null,
    }
  }

  const handleToggle = async () => {
    if (!companyId) return
    try {
      if (company?.status === 'active') {
        await stopTrading(companyId)
      } else {
        await startTrading(companyId)
      }
      await refresh()
    } catch (e) {
      console.error('Toggle trading error:', e)
    }
  }

  return (
    <aside className="w-[var(--sidebar-width)] h-screen bg-dark-900 border-r border-dark-800 flex flex-col fixed left-0 top-0 z-10">
      {/* Company Header */}
      <div className="p-5 border-b border-dark-800">
        <Link href="/company" className="block">
          <h2 className="text-lg font-bold text-dark-100 truncate">{company?.name ?? '量化军团'}</h2>
          <p className="text-xs text-dark-500 mt-1">QuantArmy</p>
        </Link>
      </div>

      {/* Role List */}
      <nav className="flex-1 overflow-y-auto p-3">
        <p className="text-xs text-dark-500 uppercase tracking-wider px-3 mb-3">团队成员</p>
        <ul className="space-y-1">
          {ROLES.map((role) => {
            const isActive = pathname?.includes(`/company/${role.type}`)
            const rs = roleStatusMap[role.type]

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
                  <span className="text-xl flex-shrink-0">{role.icon}</span>
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
                    <p className="text-xs text-dark-500 truncate mt-0.5">
                      {rs?.skillName ?? '未装备'}
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
        {companyId && (
          <button
            onClick={handleToggle}
            className={cn(
              'w-full flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors',
              company?.status === 'active'
                ? 'bg-red-900/30 text-red-400 hover:bg-red-900/50'
                : 'bg-army-900/30 text-army-400 hover:bg-army-900/50'
            )}
          >
            {company?.status === 'active' ? '⏸ 停止交易' : '▶️ 开始交易'}
          </button>
        )}
        <Link
          href="/company"
          className="flex items-center gap-2 px-3 py-2 text-sm text-dark-400 hover:text-dark-200 transition-colors rounded-lg hover:bg-dark-850"
        >
          📊 公司概览
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
