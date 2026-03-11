'use client'

import { formatCurrency, formatPercent, pnlColor, cn } from '@/lib/utils'
import type { Company, Position } from '@/lib/types'

interface DashboardProps {
  company?: Company
  positions?: Position[]
}

export function Dashboard({ company, positions = [] }: DashboardProps) {
  const equity = company?.current_equity ?? 100000
  const initial = company?.initial_capital ?? 100000
  const pnl = equity - initial
  const pnlPct = initial > 0 ? pnl / initial : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-dark-100">
          {company?.name ?? '我的量化公司'}
        </h1>
        <p className="text-dark-500 mt-1">公司概览</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-4 gap-4">
        <MetricCard
          label="总权益"
          value={formatCurrency(equity)}
          className="text-dark-100"
        />
        <MetricCard
          label="总盈亏"
          value={formatCurrency(pnl)}
          sub={formatPercent(pnlPct)}
          className={pnlColor(pnl)}
        />
        <MetricCard
          label="持仓数"
          value={String(positions.length)}
          className="text-dark-100"
        />
        <MetricCard
          label="可用资金"
          value={formatCurrency(equity - positions.reduce((sum, p) => sum + p.size * p.current_price, 0))}
          className="text-dark-100"
        />
      </div>

      {/* Equity Curve Placeholder */}
      <div className="bg-dark-900 rounded-xl border border-dark-800 p-6">
        <h3 className="text-lg font-semibold text-dark-200 mb-4">权益曲线</h3>
        <div className="h-64 flex items-center justify-center text-dark-500">
          📈 权益曲线图表 (接入后显示)
        </div>
      </div>

      {/* Positions */}
      <div className="bg-dark-900 rounded-xl border border-dark-800 p-6">
        <h3 className="text-lg font-semibold text-dark-200 mb-4">当前持仓</h3>
        {positions.length > 0 ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-dark-500 text-left">
                <th className="pb-3 font-medium">品种</th>
                <th className="pb-3 font-medium">方向</th>
                <th className="pb-3 font-medium text-right">数量</th>
                <th className="pb-3 font-medium text-right">入场价</th>
                <th className="pb-3 font-medium text-right">现价</th>
                <th className="pb-3 font-medium text-right">盈亏</th>
              </tr>
            </thead>
            <tbody>
              {positions.map((pos) => (
                <tr key={pos.id} className="border-t border-dark-800">
                  <td className="py-3 text-dark-200 font-medium">{pos.symbol}</td>
                  <td className="py-3">
                    <span className={cn(
                      'px-2 py-0.5 rounded text-xs font-medium',
                      pos.side === 'long' ? 'bg-army-900/30 text-army-400' : 'bg-red-900/30 text-red-400'
                    )}>
                      {pos.side === 'long' ? '做多' : '做空'}
                    </span>
                  </td>
                  <td className="py-3 text-dark-300 text-right">{pos.size}</td>
                  <td className="py-3 text-dark-300 text-right">{formatCurrency(pos.entry_price)}</td>
                  <td className="py-3 text-dark-300 text-right">{formatCurrency(pos.current_price)}</td>
                  <td className={cn('py-3 text-right font-medium', pnlColor(pos.unrealized_pnl))}>
                    {formatCurrency(pos.unrealized_pnl)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-dark-500 text-center py-8">暂无持仓</p>
        )}
      </div>
    </div>
  )
}

function MetricCard({ label, value, sub, className }: { label: string; value: string; sub?: string; className?: string }) {
  return (
    <div className="bg-dark-900 rounded-xl border border-dark-800 p-5">
      <p className="text-dark-500 text-sm mb-1">{label}</p>
      <p className={cn('text-2xl font-bold', className)}>{value}</p>
      {sub && <p className={cn('text-sm mt-1', className)}>{sub}</p>}
    </div>
  )
}
