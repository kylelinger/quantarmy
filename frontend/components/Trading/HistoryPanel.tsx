import { formatCurrency, pnlColor, cn, timeAgo } from '@/lib/utils'
import type { PaperTrade } from '@/lib/paper-trading'

export function HistoryPanel({ trades }: { trades: PaperTrade[] }) {
  if (trades.length === 0) {
    return (
      <div className="bg-dark-900 rounded-xl border border-dark-800 p-12 text-center">
        <p className="text-4xl mb-3">📜</p>
        <p className="text-dark-300 text-lg">暂无交易记录</p>
        <p className="text-dark-500 text-sm mt-1">去模拟盘下单试试 📝</p>
      </div>
    )
  }

  return (
    <div className="bg-dark-900 rounded-xl border border-dark-800 overflow-hidden">
      <div className="divide-y divide-dark-800">
        {trades.map(t => (
          <div key={t.id} className="flex items-center justify-between px-5 py-4">
            <div className="flex items-center gap-3">
              <span className={cn(
                'px-2 py-0.5 rounded text-xs font-medium min-w-[40px] text-center',
                t.side === 'buy' ? 'bg-army-900/30 text-army-400' : 'bg-red-900/30 text-red-400'
              )}>
                {t.side === 'buy' ? '买入' : '卖出'}
              </span>
              <span className="text-dark-200 font-medium">{t.symbol}</span>
              <span className="text-dark-500 text-xs hidden md:inline">{t.signal_reason}</span>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <span className="text-dark-300">{formatCurrency(t.price)}</span>
              <span className="text-dark-400 text-xs">{formatCurrency(t.notional)}</span>
              {t.pnl !== 0 && (
                <span className={cn('font-medium', pnlColor(t.pnl))}>{formatCurrency(t.pnl)}</span>
              )}
              <span className="text-dark-600 text-xs min-w-[60px] text-right">{timeAgo(t.executed_at)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
