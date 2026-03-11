'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import type { RoleType, Skill, SkillSource } from '@/lib/types'

interface SkillMarketProps {
  roleType: RoleType
  onSelect?: (skill: Skill) => void
  onImport?: (url: string) => void
}

export function SkillMarket({ roleType, onSelect, onImport }: SkillMarketProps) {
  const [tab, setTab] = useState<'browse' | 'import'>('browse')
  const [searchQuery, setSearchQuery] = useState('')
  const [importUrl, setImportUrl] = useState('')
  const [importing, setImporting] = useState(false)
  const [sourceFilter, setSourceFilter] = useState<SkillSource | 'all'>('all')

  const handleImport = () => {
    if (!importUrl.trim()) return
    setImporting(true)
    onImport?.(importUrl)
    // Reset after submit - actual status tracked via API polling
    setTimeout(() => setImporting(false), 2000)
  }

  return (
    <div className="bg-dark-900 rounded-xl border border-dark-800">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-dark-800">
        <h3 className="text-lg font-semibold text-dark-200">技能市场</h3>
        <div className="flex gap-1 bg-dark-850 rounded-lg p-1">
          <button
            onClick={() => setTab('browse')}
            className={cn(
              'px-4 py-1.5 text-sm rounded-md transition-colors',
              tab === 'browse' ? 'bg-dark-700 text-dark-100' : 'text-dark-400 hover:text-dark-200'
            )}
          >
            浏览
          </button>
          <button
            onClick={() => setTab('import')}
            className={cn(
              'px-4 py-1.5 text-sm rounded-md transition-colors',
              tab === 'import' ? 'bg-dark-700 text-dark-100' : 'text-dark-400 hover:text-dark-200'
            )}
          >
            GitHub导入
          </button>
        </div>
      </div>

      {tab === 'browse' ? (
        <div className="p-6">
          {/* Search & Filter */}
          <div className="flex gap-3 mb-6">
            <input
              type="text"
              placeholder="搜索技能..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-dark-800 text-dark-200 rounded-lg px-4 py-2 text-sm border border-dark-700 focus:border-army-600 focus:outline-none"
            />
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value as any)}
              className="bg-dark-800 text-dark-200 rounded-lg px-3 py-2 text-sm border border-dark-700"
            >
              <option value="all">全部来源</option>
              <option value="builtin">内置</option>
              <option value="marketplace">市场</option>
              <option value="github">GitHub</option>
            </select>
          </div>

          {/* Skill List (placeholder) */}
          <div className="space-y-3">
            <p className="text-dark-500 text-sm text-center py-8">
              技能列表加载中...
            </p>
          </div>
        </div>
      ) : (
        <div className="p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-dark-300 mb-2">GitHub仓库URL</label>
              <input
                type="url"
                placeholder="https://github.com/user/repo"
                value={importUrl}
                onChange={(e) => setImportUrl(e.target.value)}
                className="w-full bg-dark-800 text-dark-200 rounded-lg px-4 py-3 text-sm border border-dark-700 focus:border-army-600 focus:outline-none"
              />
            </div>

            <div className="bg-dark-850 rounded-lg p-4 text-sm text-dark-400">
              <p className="font-medium text-dark-300 mb-2">AI自动适配流程：</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>克隆并分析仓库代码</li>
                <li>AI识别功能类型和接口</li>
                <li>自动生成适配层代码</li>
                <li>沙箱试运行 + 基础回测</li>
                <li>适配成功后可装备使用</li>
              </ol>
            </div>

            <button
              onClick={handleImport}
              disabled={!importUrl.trim() || importing}
              className={cn(
                'w-full py-3 rounded-lg text-sm font-medium transition-colors',
                importing
                  ? 'bg-dark-700 text-dark-500 cursor-not-allowed'
                  : 'bg-army-600 hover:bg-army-500 text-white'
              )}
            >
              {importing ? '🔄 AI正在分析中...' : '🚀 开始导入并适配'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
