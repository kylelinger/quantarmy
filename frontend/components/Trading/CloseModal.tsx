'use client'

import { useState } from 'react'
import { formatCurrency, pnlColor, cn } from '@/lib/utils'
import type { PaperPosition } from '@/lib/paper-trading'

export function CloseModal({
  position,
  onConfirm,
  onClose,
}: {
  position: PaperPosition
  onConfirm: (id: string, price: number) => void
  onClose: () => void
}) {
  const [price, setPrice] = useState(String(position.current_price || position.entry_price))

  if (!position) return null

  const closePrice = parseFloat(price) || position.entry_price
  const priceDiff = position.side === 'long' ? closePrice - position.entry_price : position.entry_price - closePrice
  const estimatedPnl = priceDiff * position.size

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-dark-900 rounded-2xl border border-dark-700 w-full max-w-md shadow-2xl">
        <div className="p-6 border-b border-dark-800">
          <h2 className="text-xl font-bold text-dark-100">平仓确认</h2>
          <p className="text-dark-500 text-sm mt-1">{position.symbol} · {position.side === 'long' ? '做多' : '做空'} · {position.size.toFixed(6)}</p>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-dark-500 text-xs">开仓价</p>
              <p className="text-dark-200 font-medium">{formatCurrency(position.entry_price)}</p>
            </div>
            <div>
              <p className="text-dark-500 text-xs">预估盈亏</p>
              <p className={cn('font-bold', pnlColor(estimatedPnl))}>{formatCurrency(estimatedPnl)}</p>
            </div>
          </div>
          <div>
            <label className="text-dark-400 text-sm mb-1.5 block">平仓价格</label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full bg-dark-800 text-dark-200 rounded-lg px-4 py-3 text-sm border border-dark-700 focus:border-army-600 focus:outline-none"
            />
          </div>
        </div>
        <div className="p-6 border-t border-dark-800 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 text-sm border border-dark-700 text-dark-400 rounded-lg">取消</button>
          <button
            onClick={() => onConfirm(position.id, parseFloat(price))}
            className="flex-1 py-2.5 text-sm bg-red-600 hover:bg-red-500 text-white font-medium rounded-lg transition-colors"
          >
            确认平仓
          </button>
        </div>
      </div>
    </div>
  )
}
