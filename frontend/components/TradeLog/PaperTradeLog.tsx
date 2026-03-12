'use client'

import { useState, useEffect } from 'react'
import { cn, formatCurrency, timeAgo, pnlColor } from '@/lib/utils'
import { getPortfolio, type PaperTrade } from '@/lib/paper-trading'

export function PaperTradeLog() {
  const [trades, setTrades] = useState<PaperTrade[]>([])
  const [collapsed, setCollapsed] = useState(false)

  // Poll for new trades every 2s
  useEffect(() => {
    const refresh = () => {
      const acc = getPortfolio()
      setTrades([...acc.trades].slice(0, 30))
    }
    refresh()
    const interval = setInterval(refresh, 2000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="bg-dark-900 border-t border-dark-800">
      <div
        className="flex items-center justify-between px-4 py-2 border-b border-dark-800 cursor-pointer hover:bg-dark-800/50 transition-colors"
        onClick={() => setCollapsed(!collapsed)}
      >
        <h4 className="text-sm font-medium text-dark-300">
          📜 交易日志 <span className="text-dark-500">({trades.length})</span>
        </h4>
        <div className="flex gap-2 items-center">
          <span className="w-2 h-2 rounded-full bg-army-500" />
          <span className="text-xs text-dark-500">模拟盘</span>
          <span className="text-dark-500 text-xs">{collapsed ? '▲' : '▼'}</span>
        </div>
      </div>
      {!collapsed && (
        <div className="overflow-y-auto font-mono text-xs p-3 space-y-1" style={{ maxHeight: '200px' }}>
          {trades.length > 0 ? (
            trades.map((t) => (
              <div key={t.id} className="flex gap-2 leading-5">
                <span className="text-dark-600 min-w-[60px]">{timeAgo(t.executed_at)}</span>
                <span className={cn(
                  'min-w-[24px]',
                  t.side === 'buy' ? 'text-army-400' : 'text-red-400'
                )}>
                  {t.side === 'buy' ? '买入' : '卖出'}
                </span>
                <span className="text-dark-200">{t.symbol}</span>
                <span className="text-dark-400">@ {formatCurrency(t.price)}</span>
                <span className="text-dark-500">{formatCurrency(t.notional)}</span>
                {t.pnl !== 0 && (
                  <span className={cn('font-medium', pnlColor(t.pnl))}>
                    P&L {formatCurrency(t.pnl)}
                  </span>
                )}
                <span className="text-dark-600 truncate flex-1">{t.signal_reason}</span>
              </div>
            ))
          ) : (
            <p className="text-dark-600 text-center py-4">
              暂无交易记录 — 去模拟盘下单试试 📝
            </p>
          )}
        </div>
      )}
    </div>
  )
}
