'use client'

import { useCompanyContext } from '@/lib/CompanyContext'
import { usePositions, usePerformance, useTradeHistory } from '@/lib/hooks'
import { formatCurrency, formatPercent, pnlColor, cn, timeAgo } from '@/lib/utils'

export default function CompanyOverviewPage() {
  const { company, companyId } = useCompanyContext()
  const { positions } = usePositions(companyId)
  const { perf } = usePerformance(companyId)
  const { trades } = useTradeHistory(companyId, 10)

  const equity = company?.current_equity ?? 100000
  const initial = company?.initial_capital ?? 100000
  const pnl = equity - initial
  const pnlPct = initial > 0 ? pnl / initial : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-dark-100">{company?.name ?? '我的量化公司'}</h1>
        <p className="text-dark-500 mt-1">公司概览 · {company?.market === 'stock' ? '股票' : '加密货币'}</p>
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
                  <td className="py-3 text-dark-300 text-right">{pos.size.toFixed(6)}</td>
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

      {/* Recent Trades */}
      <div className="bg-dark-900 rounded-xl border border-dark-800 p-6">
        <h3 className="text-lg font-semibold text-dark-200 mb-4">最近交易</h3>
        {trades.length > 0 ? (
          <div className="space-y-2">
            {trades.map((t) => (
              <div key={t.id} className="flex items-center justify-between text-sm py-2 border-b border-dark-850">
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
