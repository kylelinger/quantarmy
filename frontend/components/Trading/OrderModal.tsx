'use client'

import { useState, useEffect } from 'react'
import { formatCurrency, cn } from '@/lib/utils'

export function OrderModal({
  watchlistItems,
  cash,
  onSubmit,
  onClose,
}: {
  watchlistItems: any[]
  cash: number
  onSubmit: (params: any) => void
  onClose: () => void
}) {
  const [symbol, setSymbol] = useState(watchlistItems[0]?.symbol || 'BTCUSDT')
  const [side, setSide] = useState<'long' | 'short'>('long')
  const [notional, setNotional] = useState('')
  const [price, setPrice] = useState('')
  const [stopLoss, setStopLoss] = useState('')
  const [takeProfit, setTakeProfit] = useState('')
  const [reason, setReason] = useState('')
  const [fetchingPrice, setFetchingPrice] = useState(false)

  const quickAmounts = [1000, 5000, 10000, 20000]

  const fetchCurrentPrice = async (sym: string) => {
    if (!sym.endsWith('USDT')) return
    setFetchingPrice(true)
    try {
      const res = await fetch(`/api/market/ticker24h?symbol=${encodeURIComponent(sym)}`)
      const json = await res.json()
      if (json.ok && json.data?.price) {
        setPrice(String(json.data.price))
      }
    } catch { /* ignore */ } finally {
      setFetchingPrice(false)
    }
  }

  useEffect(() => { fetchCurrentPrice(symbol) }, [])

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-dark-900 rounded-2xl border border-dark-700 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-dark-800 sticky top-0 bg-dark-900 z-10">
          <h2 className="text-xl font-bold text-dark-100">📝 模拟下单</h2>
          <button onClick={onClose} className="text-dark-500 hover:text-dark-300 text-lg">✕</button>
        </div>

        <div className="p-6 space-y-5">
          {/* Symbol */}
          <div>
            <label className="text-dark-400 text-sm mb-1.5 block">标的</label>
            <select
              value={symbol}
              onChange={(e) => { setSymbol(e.target.value); fetchCurrentPrice(e.target.value) }}
              className="w-full bg-dark-800 text-dark-200 rounded-lg px-4 py-3 text-sm border border-dark-700 focus:border-army-600 focus:outline-none"
            >
              {watchlistItems.map((item: any) => (
                <option key={item.symbol} value={item.symbol}>{item.symbol} — {item.display_name}</option>
              ))}
              <option value="BTCUSDT">BTCUSDT</option>
              <option value="ETHUSDT">ETHUSDT</option>
            </select>
          </div>

          {/* Side */}
          <div>
            <label className="text-dark-400 text-sm mb-1.5 block">方向</label>
            <div className="flex gap-2">
              <button
                onClick={() => setSide('long')}
                className={cn(
                  'flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors border',
                  side === 'long' ? 'bg-army-900/40 border-army-700 text-army-400' : 'bg-dark-800 border-dark-700 text-dark-400'
                )}
              >
                📈 做多 (LONG)
              </button>
              <button
                onClick={() => setSide('short')}
                className={cn(
                  'flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors border',
                  side === 'short' ? 'bg-red-900/40 border-red-700 text-red-400' : 'bg-dark-800 border-dark-700 text-dark-400'
                )}
              >
                📉 做空 (SHORT)
              </button>
            </div>
          </div>

          {/* Price */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-dark-400 text-sm">开仓价格 (USD)</label>
              <button
                onClick={() => fetchCurrentPrice(symbol)}
                disabled={fetchingPrice}
                className="text-xs text-army-400 hover:text-army-300 transition-colors disabled:opacity-50"
              >
                {fetchingPrice ? '获取中...' : '🔄 刷新市价'}
              </button>
            </div>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="自动填入当前市价"
              className="w-full bg-dark-800 text-dark-200 rounded-lg px-4 py-3 text-sm border border-dark-700 focus:border-army-600 focus:outline-none"
            />
          </div>

          {/* Notional */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-dark-400 text-sm">下单金额 (USD)</label>
              <span className="text-dark-500 text-xs">可用: {formatCurrency(cash)}</span>
            </div>
            <input
              type="number"
              value={notional}
              onChange={(e) => setNotional(e.target.value)}
              placeholder="投入金额"
              className="w-full bg-dark-800 text-dark-200 rounded-lg px-4 py-3 text-sm border border-dark-700 focus:border-army-600 focus:outline-none"
            />
            <div className="flex gap-2 mt-2">
              {quickAmounts.map(amt => (
                <button
                  key={amt}
                  onClick={() => setNotional(String(amt))}
                  className="flex-1 py-1.5 text-xs bg-dark-800 border border-dark-700 rounded-lg text-dark-400 hover:text-dark-200 hover:border-dark-600 transition-colors"
                >
                  ${amt.toLocaleString()}
                </button>
              ))}
            </div>
          </div>

          {/* SL / TP */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-dark-400 text-sm mb-1.5 block">止损价 (可选)</label>
              <input
                type="number"
                value={stopLoss}
                onChange={(e) => setStopLoss(e.target.value)}
                placeholder="止损价"
                className="w-full bg-dark-800 text-dark-200 rounded-lg px-4 py-3 text-sm border border-dark-700 focus:border-army-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-dark-400 text-sm mb-1.5 block">止盈价 (可选)</label>
              <input
                type="number"
                value={takeProfit}
                onChange={(e) => setTakeProfit(e.target.value)}
                placeholder="止盈价"
                className="w-full bg-dark-800 text-dark-200 rounded-lg px-4 py-3 text-sm border border-dark-700 focus:border-army-600 focus:outline-none"
              />
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="text-dark-400 text-sm mb-1.5 block">下单理由 (可选)</label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="例如: 策略师PSAR看多 + CEO确认"
              className="w-full bg-dark-800 text-dark-200 rounded-lg px-4 py-3 text-sm border border-dark-700 focus:border-army-600 focus:outline-none"
            />
          </div>
        </div>

        <div className="p-6 border-t border-dark-800 flex gap-3 sticky bottom-0 bg-dark-900">
          <button onClick={onClose} className="flex-1 py-2.5 text-sm border border-dark-700 text-dark-400 hover:text-dark-200 rounded-lg transition-colors">
            取消
          </button>
          <button
            onClick={() => {
              if (!price || !notional) return
              onSubmit({
                symbol,
                side,
                notional: parseFloat(notional),
                price: parseFloat(price),
                stop_loss: stopLoss ? parseFloat(stopLoss) : null,
                take_profit: takeProfit ? parseFloat(takeProfit) : null,
                strategy: 'manual',
                reason: reason || `${side.toUpperCase()} ${symbol}`,
              })
            }}
            disabled={!price || !notional}
            className="flex-1 py-2.5 text-sm bg-army-600 hover:bg-army-500 text-white font-medium rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            确认下单
          </button>
        </div>
      </div>
    </div>
  )
}
