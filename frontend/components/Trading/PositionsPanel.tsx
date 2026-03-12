import Link from 'next/link'
import { formatCurrency, formatPercent, pnlColor, cn, timeAgo } from '@/lib/utils'
import type { PaperPosition } from '@/lib/paper-trading'

export function PositionsPanel({
  positions,
  onClose,
  onAdjust,
}: {
  positions: PaperPosition[]
  onClose: (id: string) => void
  onAdjust: (id: string) => void
}) {
  if (positions.length === 0) {
    return (
      <div className="bg-dark-900 rounded-xl border border-dark-800 p-12 text-center">
        <p className="text-4xl mb-3">📦</p>
        <p className="text-dark-300 text-lg">暂无持仓</p>
        <p className="text-dark-500 text-sm mt-1">点击"模拟下单"开始建仓</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {positions.map(pos => (
        <div key={pos.id} className="bg-dark-900 rounded-xl border border-dark-800 p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className={cn(
                'px-2.5 py-1 rounded text-xs font-bold',
                pos.side === 'long' ? 'bg-army-900/40 text-army-400' : 'bg-red-900/40 text-red-400'
              )}>
                {pos.side === 'long' ? '做多' : '做空'}
              </span>
              <Link href={`/company/watchlist/${pos.symbol}`} className="text-lg font-bold text-dark-100 hover:text-army-400 transition-colors">
                {pos.symbol}
              </Link>
              <span className="text-dark-500 text-xs px-2 py-0.5 bg-dark-800 rounded">{pos.strategy}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onAdjust(pos.id)}
                className="px-3 py-1.5 text-xs text-dark-400 hover:text-dark-200 border border-dark-700 hover:border-dark-600 rounded-lg transition-colors"
              >
                ⚙️ 调仓
              </button>
              <button
                onClick={() => onClose(pos.id)}
                className="px-3 py-1.5 text-xs text-red-400 hover:text-red-300 border border-red-900/40 hover:border-red-900/60 rounded-lg transition-colors"
              >
                ✕ 平仓
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4 text-sm">
            <div>
              <p className="text-dark-500 text-xs">持仓量</p>
              <p className="text-dark-200 font-medium mt-0.5">{pos.size.toFixed(6)}</p>
            </div>
            <div>
              <p className="text-dark-500 text-xs">开仓价</p>
              <p className="text-dark-200 font-medium mt-0.5">{formatCurrency(pos.entry_price)}</p>
            </div>
            <div>
              <p className="text-dark-500 text-xs">市值</p>
              <p className="text-dark-200 font-medium mt-0.5">{formatCurrency(pos.notional)}</p>
            </div>
            <div>
              <p className="text-dark-500 text-xs">未实现盈亏</p>
              <p className={cn('font-bold mt-0.5', pnlColor(pos.unrealized_pnl))}>
                {formatCurrency(pos.unrealized_pnl)}
                <span className="text-xs ml-1">({formatPercent(pos.pnl_pct)})</span>
              </p>
            </div>
            <div>
              <p className="text-dark-500 text-xs">止损 / 止盈</p>
              <p className="text-dark-200 mt-0.5 text-xs">
                <span className="text-red-400">{pos.stop_loss ? formatCurrency(pos.stop_loss) : '—'}</span>
                {' / '}
                <span className="text-army-400">{pos.take_profit ? formatCurrency(pos.take_profit) : '—'}</span>
              </p>
            </div>
          </div>

          <p className="text-dark-600 text-xs mt-3">{timeAgo(pos.opened_at)} 开仓</p>
        </div>
      ))}
    </div>
  )
}
