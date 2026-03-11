import Link from 'next/link'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-dark-950 flex flex-col items-center justify-center text-center px-6">
      {/* Logo */}
      <div className="mb-8">
        <span className="text-6xl">⚔️</span>
      </div>

      {/* Hero */}
      <h1 className="text-5xl font-bold text-dark-100 mb-4">
        Quant<span className="text-army-500">Army</span>
      </h1>
      <p className="text-xl text-dark-400 mb-2 max-w-2xl">
        Build your AI quantitative trading team.
      </p>
      <p className="text-dark-500 mb-12 max-w-xl">
        Assign strategies, risk models, and data skills to 8 specialized roles.
        Watch them trade together in a fully simulated environment.
      </p>

      {/* CTA */}
      <div className="flex gap-4">
        <Link
          href="/company/new"
          className="px-8 py-4 bg-army-600 hover:bg-army-500 text-white font-semibold rounded-xl transition-colors text-lg"
        >
          🚀 Build My Team
        </Link>
        <Link
          href="/company"
          className="px-8 py-4 bg-dark-800 hover:bg-dark-700 text-dark-300 font-semibold rounded-xl transition-colors text-lg border border-dark-700"
        >
          View Dashboard
        </Link>
      </div>

      {/* Feature grid */}
      <div className="grid grid-cols-3 gap-6 mt-20 max-w-3xl w-full">
        {[
          { icon: '👥', title: '8-Role Team', desc: 'CEO, Strategist, Risk Officer, and 5 more specialized roles' },
          { icon: '🔌', title: 'Any Strategy', desc: 'Use built-in skills or import from any GitHub repo via AI adapter' },
          { icon: '🛡️', title: 'Safe & Simulated', desc: '100% paper trading — no real funds, no exchange API keys needed' },
        ].map((f) => (
          <div key={f.title} className="bg-dark-900 rounded-xl border border-dark-800 p-6 text-left">
            <span className="text-3xl">{f.icon}</span>
            <h3 className="text-dark-100 font-semibold mt-3 mb-2">{f.title}</h3>
            <p className="text-dark-400 text-sm">{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
