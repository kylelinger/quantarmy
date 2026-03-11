'use client'

import { cn } from '@/lib/utils'
import { useCompanyContext } from '@/lib/CompanyContext'
import { useCompanyWS } from '@/lib/hooks'
import { ROLES } from '@/lib/types'

export function TradeLogConnected() {
  const { companyId } = useCompanyContext()
  const { events, connected } = useCompanyWS(companyId)

  // Filter to log-like events
  const logs = events
    .filter((e: any) => ['log', 'message', 'trade', 'tick'].includes(e.type))
    .slice(-50)

  return (
    <div className="bg-dark-900 border-t border-dark-800">
      <div className="flex items-center justify-between px-4 py-2 border-b border-dark-800">
        <h4 className="text-sm font-medium text-dark-300">实时日志</h4>
        <div className="flex gap-2 items-center">
          <span className={cn('status-dot', connected ? 'status-active' : 'status-error')} />
          <span className="text-xs text-dark-500">{connected ? '已连接' : '未连接'}</span>
        </div>
      </div>
      <div className="overflow-y-auto font-mono text-xs p-3 space-y-1" style={{ maxHeight: '200px' }}>
        {logs.length > 0 ? (
          logs.map((event: any, i: number) => (
            <LogLine key={i} event={event} />
          ))
        ) : (
          <p className="text-dark-600 text-center py-4">
            {companyId ? '等待日志输出...' : '请先创建或选择一个公司'}
          </p>
        )}
      </div>
    </div>
  )
}

function LogLine({ event }: { event: any }) {
  const data = event.data || {}

  if (event.type === 'log') {
    const role = ROLES.find((r) => r.type === data.role)
    return (
      <div className="flex gap-2 leading-5">
        {role && <span style={{ color: role.color }}>[{role.label}]</span>}
        <span className={cn(
          'uppercase text-2xs',
          data.level === 'error' ? 'text-red-400' : data.level === 'warn' ? 'text-yellow-500' : 'text-dark-500'
        )}>
          {data.level}
        </span>
        <span className="text-dark-300">{data.message}</span>
      </div>
    )
  }

  if (event.type === 'trade') {
    return (
      <div className="flex gap-2 leading-5">
        <span className="text-army-400">⚡</span>
        <span className="text-dark-200">
          {data.side?.toUpperCase()} {data.symbol} @ {data.price?.toFixed(2)}
          {data.pnl !== undefined && <span className={data.pnl >= 0 ? 'text-army-400' : 'text-red-400'}> PnL={data.pnl?.toFixed(2)}</span>}
        </span>
      </div>
    )
  }

  if (event.type === 'message') {
    return (
      <div className="flex gap-2 leading-5">
        <span className="text-dark-500">📨</span>
        <span className="text-dark-400">{data.from} → {data.to}: {data.signal?.action} {data.signal?.symbol}</span>
      </div>
    )
  }

  if (event.type === 'tick') {
    const tickData = data
    return (
      <div className="flex gap-2 leading-5">
        <span className="text-dark-600">⏱</span>
        <span className="text-dark-500">Tick #{tickData.tick} — {tickData.signals?.length || 0} signals, {tickData.fills?.length || 0} fills</span>
      </div>
    )
  }

  return null
}
