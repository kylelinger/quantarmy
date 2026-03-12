'use client'

import { useState } from 'react'
import { formatCurrency, pnlColor, cn } from '@/lib/utils'
import type { PaperPosition } from '@/lib/paper-trading'

export function AdjustModal({
  position,
  onConfirm,
  onClose,
}: {
  position: PaperPosition
  onConfirm: (id: string, updates: { stop_loss?: number | null; take_profit?: number | null }) => void
  onClose: () => void
}) {
  const [sl, setSl] = useState(position.stop_loss ? String(position.stop_loss) : '')
  const [tp, setTp] = useState(position.take_profit ? String(position.take_profit) : '')

  if (!position) return null

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-dark-900 rounded-2xl border border-dark-700 w-full max-w-md shadow-2xl">
        <div className="p-6 border-b border-dark-800">
          <h2 className="text-xl font-bold text-dark-100">调仓 — {position.symbol}</h2>
          <p className="text-dark-500 text-sm mt-1">修改止损 / 止盈价位</p>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm mb-4">
            <div>
              <p className="text-dark-500 text-xs">开仓价</p>
              <p className="text-dark-200 font-medium">{formatCurrency(position.entry_price)}</p>
            </div>
            <div>
              <p className="text-dark-500 text-xs">当前盈亏</p>
              <p className={cn('font-bold', pnlColor(position.unrealized_pnl))}>{formatCurrency(position.unrealized_pnl)}</p>
            </div>
          </div>
          <div>
            <label className="text-dark-400 text-sm mb-1.5 block">止损价</label>
            <input
              type="number"
              value={sl}
              onChange={(e) => setSl(e.target.value)}
              placeholder="留空则不设止损"
              className="w-full bg-dark-800 text-dark-200 rounded-lg px-4 py-3 text-sm border border-dark-700 focus:border-army-600 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-dark-400 text-sm mb-1.5 block">止盈价</label>
            <input
              type="number"
              value={tp}
              onChange={(e) => setTp(e.target.value)}
              placeholder="留空则不设止盈"
              className="w-full bg-dark-800 text-dark-200 rounded-lg px-4 py-3 text-sm border border-dark-700 focus:border-army-600 focus:outline-none"
            />
          </div>
        </div>
        <div className="p-6 border-t border-dark-800 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 text-sm border border-dark-700 text-dark-400 rounded-lg">取消</button>
          <button
            onClick={() => onConfirm(position.id, {
              stop_loss: sl ? parseFloat(sl) : null,
              take_profit: tp ? parseFloat(tp) : null,
            })}
            className="flex-1 py-2.5 text-sm bg-army-600 hover:bg-army-500 text-white font-medium rounded-lg transition-colors"
          >
            确认修改
          </button>
        </div>
      </div>
    </div>
  )
}
