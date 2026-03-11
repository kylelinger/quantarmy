'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { createCompany } from '@/lib/hooks'

export default function NewCompanyPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [capital, setCapital] = useState(100000)
  const [market, setMarket] = useState<'crypto' | 'stock'>('crypto')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCreate = async () => {
    if (!name.trim()) return
    setCreating(true)
    setError(null)
    try {
      const company = await createCompany(name, capital, market)
      // Store company ID
      localStorage.setItem('quantarmy_company_id', company.id)
      router.push('/company')
    } catch (e: any) {
      setError(e.message)
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-950">
      <div className="w-full max-w-lg">
        <h1 className="text-3xl font-bold text-dark-100 mb-2 text-center">🏢 创建量化公司</h1>
        <p className="text-dark-400 text-center mb-10">组建你的AI交易团队</p>

        <div className="bg-dark-900 rounded-2xl border border-dark-800 p-8 space-y-6">
          {/* Company Name */}
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">公司名称</label>
            <input
              type="text" placeholder="例: Star Quant"
              value={name} onChange={(e) => setName(e.target.value)}
              className="w-full bg-dark-800 text-dark-100 rounded-lg px-4 py-3 border border-dark-700 focus:border-army-600 focus:outline-none"
            />
          </div>

          {/* Initial Capital */}
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">初始资金 (虚拟)</label>
            <div className="grid grid-cols-3 gap-2">
              {[50000, 100000, 500000].map((amount) => (
                <button key={amount} onClick={() => setCapital(amount)}
                  className={cn('py-2 rounded-lg text-sm font-medium transition-colors border',
                    capital === amount
                      ? 'bg-army-600 text-white border-army-600'
                      : 'bg-dark-800 text-dark-300 border-dark-700 hover:border-dark-600'
                  )}>
                  ${(amount / 1000).toFixed(0)}K
                </button>
              ))}
            </div>
          </div>

          {/* Market */}
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">交易市场</label>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setMarket('crypto')}
                className={cn('p-4 rounded-xl border text-left transition-colors',
                  market === 'crypto' ? 'bg-dark-800 border-army-600 text-dark-100' : 'bg-dark-850 border-dark-700 text-dark-400 hover:border-dark-600')}>
                <span className="text-2xl">₿</span>
                <p className="font-medium mt-2">加密货币</p>
                <p className="text-xs text-dark-500 mt-1">BTC, ETH, SOL...</p>
              </button>
              <button onClick={() => setMarket('stock')}
                className={cn('p-4 rounded-xl border text-left transition-colors',
                  market === 'stock' ? 'bg-dark-800 border-army-600 text-dark-100' : 'bg-dark-850 border-dark-700 text-dark-400 hover:border-dark-600')}>
                <span className="text-2xl">📈</span>
                <p className="font-medium mt-2">股票</p>
                <p className="text-xs text-dark-500 mt-1">US Stocks, A股...</p>
              </button>
            </div>
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          {/* Create Button */}
          <button onClick={handleCreate}
            disabled={!name.trim() || creating}
            className={cn('w-full py-4 rounded-xl text-lg font-semibold transition-colors',
              name.trim() && !creating
                ? 'bg-army-600 hover:bg-army-500 text-white'
                : 'bg-dark-700 text-dark-500 cursor-not-allowed')}>
            {creating ? '🔄 创建中...' : '🚀 开始组建团队'}
          </button>
        </div>
      </div>
    </div>
  )
}
