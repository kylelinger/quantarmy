import Link from 'next/link'
import { cn } from '@/lib/utils'
import { ROLES } from '@/lib/types'

export function TeamPanel({ roles }: { roles: any[] }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {ROLES.map((roleMeta) => {
        const role = roles.find((r: any) => r.role_type === roleMeta.type)
        return (
          <Link
            key={roleMeta.type}
            href={`/company/${roleMeta.type}`}
            className="bg-dark-900 rounded-xl border border-dark-800 p-5 hover:border-dark-600 transition-colors group"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ backgroundColor: `${roleMeta.color}20` }}>
                {roleMeta.icon}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-dark-100 group-hover:text-army-400 transition-colors">{roleMeta.label}</p>
                <p className="text-xs text-dark-500 truncate">{roleMeta.description}</p>
              </div>
            </div>
            {role?.last_output ? (
              <p className="text-sm text-dark-400 line-clamp-2 leading-5">{role.last_output}</p>
            ) : (
              <p className="text-sm text-dark-600">等待分析...</p>
            )}
            <div className="flex items-center gap-2 mt-3">
              <span className={cn('w-2 h-2 rounded-full', role?.status === 'active' ? 'bg-army-500' : 'bg-dark-600')} />
              <span className="text-xs text-dark-500">{role?.status === 'active' ? '运行中' : '空闲'}</span>
            </div>
          </Link>
        )
      })}
    </div>
  )
}
