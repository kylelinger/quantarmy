'use client'

import Link from 'next/link'
import { useCompanyContext } from '@/lib/CompanyContext'
import { usePositions, usePerformance, useTradeHistory, useRoles, useEquityCurve } from '@/lib/hooks'
import { EquityCurve } from '@/components/Market/EquityCurve'
import { formatCurrency, formatPercent, pnlColor, cn, timeAgo } from '@/lib/utils'
import { ROLES } from '@/lib/types'

export default function CompanyOverviewPage() {
  const { company, companyId } = useCompanyContext()
  const { positions } = usePositions(companyId)
  const { perf } = usePerformance(companyId)
  const { trades } = useTradeHistory(companyId, 10)
  const { roles } = useRoles(companyId)
  const { data: equityData } = useEquityCurve(companyId)

  const equity = company?.current_equity ?? 100000
  const initial = company?.initial_capital ?? 100000
  const pnl = equity - initial
  const pnlPct = initial > 0 ? pnl / initial : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-dark-100">{company?.name ?? '我的量化公司'}</h1>
        <p className="text-dark-500 mt-1">公司概览 · {company?.market === 'stock' ? '股票' : '加密货币'} · V1 独立分析模式</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard label="总权益" value={formatCurrency(equity)} />
        <MetricCard label="总盈亏" value={formatCurrency(pnl)} sub={formatPercent(pnlPct)} className={pnlColor(pnl)} />
        <MetricCard label="持仓数" value={String(positions.length)} />
        <MetricCard label="总交易" value={String(perf?.trades ?? 0)} sub={perf?.win_rate ? `胜率 ${(perf.win_rate * 100).toFixed(0)}%` : undefined} />
      </div>

      {/* Performance Row */}
      {perf && perf.trades > 0 && (
        <div className="grid grid-cols-4 gap-4">
          <SmallStat label="盈亏比" value={perf.profit_factor.toFixed(2)} />
          <SmallStat label="夏普比率" value={perf.sharpe_ratio.toFixed(2)} />
          <SmallStat label="最大回撤" value={`${(perf.max_drawdown * 100).toFixed(1)}%`} negative />
          <SmallStat label="总回报" value={formatPercent(perf.total_return)} positive={perf.total_return > 0} />
        </div>
      )}

      {/* Equity Curve */}
      <div className="bg-dark-900 rounded-xl border border-dark-800 p-6">
        <h3 className="text-lg font-semibold text-dark-200 mb-4">权益曲线</h3>
        <EquityCurve data={equityData} initialCapital={initial} height={280} />
      </div>

      {/* 8 Role Status Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-dark-100">团队阵容</h2>
          <span className="text-sm text-dark-500">8 个角色独立分析，CEO 汇总</span>
        </div>
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
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                    style={{ backgroundColor: `${roleMeta.color}20` }}
                  >
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
                  <span className={cn(
                    'w-2 h-2 rounded-full',
                    role?.status === 'active' ? 'bg-army-500' : role?.status === 'error' ? 'bg-red-500' : 'bg-dark-600'
                  )} />
                  <span className="text-xs text-dark-500">
                    {role?.status === 'active' ? '运行中' : role?.status === 'error' ? '异常' : '空闲'}
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Positions */}
      <div className="bg-dark-900 rounded-xl border border-dark-800 p-6">
        <h3 className="text-lg font-semibold text-dark-200 mb-4">当前持仓</h3>
        {positions.length > 0 ? (
          <div className="space-y-3">
            {positions.map((pos) => (
              <div key={pos.id} className="flex items-center justify-between py-3 border-b border-dark-850 last:border-0">
                <div className="flex items-center gap-3">
                  <span className={cn(
                    'px-2 py-0.5 rounded text-xs font-medium',
                    pos.side === 'long' ? 'bg-army-900/30 text-army-400' : 'bg-red-900/30 text-red-400'
                  )}>
                    {pos.side === 'long' ? '多' : '空'}
                  </span>
                  <Link href={`/company/watchlist/${pos.symbol}`} className="text-dark-200 font-medium hover:text-army-400">{pos.symbol}</Link>
                  <span className="text-dark-500 text-xs">{pos.size.toFixed(6)} @ {formatCurrency(pos.entry_price)}</span>
                </div>
                <div className="text-right">
                  <span className={cn('font-medium', pnlColor(pos.unrealized_pnl))}>{formatCurrency(pos.unrealized_pnl)}</span>
                  <span className={cn('text-xs ml-2', pnlColor(pos.unrealized_pnl))}>{formatPercent(pos.pnl_pct)}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-dark-500 text-center py-8">暂无持仓</p>
        )}
      </div>

      {/* Recent Trades */}
      <div className="bg-dark-900 rounded-xl border border-dark-800 p-6">
        <h3 className="text-lg font-semibold text-dark-200 mb-4">最近交易</h3>
        {trades.length > 0 ? (
          <div className="space-y-2">
            {trades.map((t) => (
              <div key={t.id} className="flex items-center justify-between text-sm py-2 border-b border-dark-850 last:border-0">
                <div className="flex items-center gap-3">
                  <span className={cn(
                    'px-2 py-0.5 rounded text-xs',
                    t.side === 'buy' ? 'bg-army-900/30 text-army-400' : 'bg-red-900/30 text-red-400'
                  )}>
                    {t.side.toUpperCase()}
                  </span>
                  <span className="text-dark-200">{t.symbol}</span>
                  <span className="text-dark-500 text-xs">{t.signal_reason}</span>
                </div>
                <div className="text-right">
                  <span className="text-dark-300">{formatCurrency(t.price)}</span>
                  <span className="text-dark-500 text-xs ml-2">{timeAgo(t.executed_at)}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-dark-500 text-center py-8">暂无交易记录</p>
        )}
      </div>
    </div>
  )
}

function MetricCard({ label, value, sub, className }: { label: string; value: string; sub?: string; className?: string }) {
  return (
    <div className="bg-dark-900 rounded-xl border border-dark-800 p-5">
      <p className="text-dark-500 text-sm mb-1">{label}</p>
      <p className={cn('text-2xl font-bold text-dark-100', className)}>{value}</p>
      {sub && <p className={cn('text-sm mt-1', className)}>{sub}</p>}
    </div>
  )
}

function SmallStat({ label, value, negative, positive }: { label: string; value: string; negative?: boolean; positive?: boolean }) {
  return (
    <div className="bg-dark-900 rounded-lg border border-dark-800 p-4 text-center">
      <p className="text-dark-500 text-xs mb-1">{label}</p>
      <p className={cn('text-lg font-semibold', negative ? 'text-red-400' : positive ? 'text-army-400' : 'text-dark-100')}>{value}</p>
    </div>
  )
}
