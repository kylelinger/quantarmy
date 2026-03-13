import Link from 'next/link'
import { ROLES } from '@/lib/types'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-dark-950">
      {/* Hero */}
      <section className="flex flex-col items-center justify-center text-center px-6 pt-24 pb-16">
        <span className="text-7xl mb-6">⚔️</span>
        <h1 className="text-5xl md:text-6xl font-bold text-dark-100 mb-4">
          Quant<span className="text-army-500">Army</span>
        </h1>
        <p className="text-xl text-dark-300 mb-2 max-w-2xl">
          组建你的 AI 量化交易团队
        </p>
        <p className="text-dark-500 mb-10 max-w-xl leading-7">
          8 个 AI 角色独立分析，然后互相辩论挑战 — CEO 综合投票做出最终判定。
          你看到的不是一个答案，而是一个团队的思考过程。
          免费实时行情，100% 模拟交易，无需 API Key。
        </p>
        <div className="flex gap-4 flex-wrap justify-center">
          <Link
            href="/company"
            className="px-8 py-4 bg-army-600 hover:bg-army-500 text-white font-semibold rounded-xl transition-colors text-lg"
          >
            🚀 进入作战室
          </Link>
          <Link
            href="/company/watchlist"
            className="px-8 py-4 bg-dark-800 hover:bg-dark-700 text-dark-300 font-semibold rounded-xl transition-colors text-lg border border-dark-700"
          >
            📊 查看自选标的
          </Link>
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-dark-100 text-center mb-3">产品逻辑</h2>
        <p className="text-dark-500 text-center mb-12 max-w-2xl mx-auto">
          不是"一个 AI 帮你炒币"，而是"一个量化研究团队替你多角度分析"。
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <StepCard step="1" title="选标的" desc="从加密货币或美股中添加你感兴趣的标的到自选列表。" />
          <StepCard step="2" title="团队分析 + 辩论" desc="8 个角色各自独立分析，然后互相挑战辩论 — CEO 综合投票做出判定。" />
          <StepCard step="3" title="你来决策" desc="看到团队的共识和分歧后，你做最终判断，一键模拟下单验证。" />
        </div>
      </section>

      {/* 8 Roles */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-dark-100 text-center mb-3">8 个 AI 角色</h2>
        <p className="text-dark-500 text-center mb-12">每个角色预置 3 张默认技能卡，上手即用。</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {ROLES.map((role) => (
            <div key={role.type} className="bg-dark-900 rounded-xl border border-dark-800 p-5 text-center">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-3"
                style={{ backgroundColor: `${role.color}20` }}
              >
                {role.icon}
              </div>
              <h3 className="text-dark-100 font-semibold mb-1">{role.label}</h3>
              <p className="text-dark-500 text-xs leading-5">{role.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FeatureCard icon="📈" title="实时行情" desc="嵌入 TradingView 图表，加密货币和美股均可实时查看 K 线。" />
          <FeatureCard icon="🛡️" title="安全模拟" desc="100% 纸盘交易，无需真实资金，无需交易所 API Key。" />
          <FeatureCard icon="🔌" title="技能可扩展" desc="3 张默认卡上手，熟悉后可从 GitHub 导入开源策略。" />
          <FeatureCard icon="⚡" title="多角度分析" desc="同一标的，8 个角色各抒己见，让分歧变成决策优势。" />
          <FeatureCard icon="🎯" title="用户为中心" desc="系统不自动交易，你看分析，你做决策，你掌控一切。" />
          <FeatureCard icon="⚔️" title="V2 辩论引擎" desc="角色之间真实辩论，挑战 + 反驳 + 让步，CEO 聚合加权共识。" />
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center py-12 text-dark-600 text-sm border-t border-dark-900">
        <p>QuantArmy · 量化军团 · Built by Y量化</p>
        <p className="mt-1">100% Open Source · No Real Funds</p>
      </footer>
    </div>
  )
}

function StepCard({ step, title, desc }: { step: string; title: string; desc: string }) {
  return (
    <div className="text-center">
      <div className="w-12 h-12 rounded-full bg-army-900/30 border border-army-800 flex items-center justify-center text-army-400 font-bold text-lg mx-auto mb-4">
        {step}
      </div>
      <h3 className="text-dark-100 font-semibold text-lg mb-2">{title}</h3>
      <p className="text-dark-400 text-sm leading-6">{desc}</p>
    </div>
  )
}

function FeatureCard({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div className="bg-dark-900 rounded-xl border border-dark-800 p-6">
      <span className="text-2xl">{icon}</span>
      <h3 className="text-dark-100 font-semibold mt-3 mb-2">{title}</h3>
      <p className="text-dark-400 text-sm leading-6">{desc}</p>
    </div>
  )
}
