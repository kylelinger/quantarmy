'use client'

import { cn, timeAgo, formatCurrency, pnlColor } from '@/lib/utils'
import { ROLES, type RoleType, type Signal, type Trade } from '@/lib/types'

interface LogEntry {
  id: string
  timestamp: string
  type: 'trade' | 'signal' | 'log' | 'system'
  role?: RoleType
  level?: 'info' | 'warn' | 'error'
  message: string
  data?: any
}

interface TradeLogProps {
  entries?: LogEntry[]
  maxHeight?: string
}

export function TradeLog({ entries = [], maxHeight = '200px' }: TradeLogProps) {
  return (
    <div className="bg-dark-900 border-t border-dark-800">
      <div className="flex items-center justify-between px-4 py-2 border-b border-dark-800">
        <h4 className="text-sm font-medium text-dark-300">实时日志</h4>
        <div className="flex gap-2">
          <span className="status-dot status-active" />
          <span className="text-xs text-dark-500">运行中</span>
        </div>
      </div>
      <div
        className="overflow-y-auto font-mono text-xs p-3 space-y-1"
        style={{ maxHeight }}
      >
        {entries.length > 0 ? (
          entries.map((entry) => (
            <LogLine key={entry.id} entry={entry} />
          ))
        ) : (
          <p className="text-dark-600 text-center py-4">等待日志输出...</p>
        )}
      </div>
    </div>
  )
}

function LogLine({ entry }: { entry: LogEntry }) {
  const role = entry.role ? ROLES.find((r) => r.type === entry.role) : null
  const levelColor = {
    info: 'text-dark-400',
    warn: 'text-yellow-500',
    error: 'text-red-400',
  }

  return (
    <div className="flex gap-2 leading-5">
      <span className="text-dark-600 flex-shrink-0">{new Date(entry.timestamp).toLocaleTimeString()}</span>
      {role && (
        <span className="flex-shrink-0" style={{ color: role.color }}>
          [{role.label}]
        </span>
      )}
      {entry.level && (
        <span className={cn('flex-shrink-0 uppercase', levelColor[entry.level])}>
          {entry.level}
        </span>
      )}
      <span className="text-dark-300">{entry.message}</span>
    </div>
  )
}
