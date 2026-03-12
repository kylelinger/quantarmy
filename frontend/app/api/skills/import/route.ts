import { NextResponse } from 'next/server'

/**
 * GitHub skill import — demo flow.
 * In production this would:
 * 1. Clone the repo
 * 2. Use LLM to analyze code and extract strategy logic
 * 3. Generate a BaseSkill-compatible wrapper
 * 4. Sandbox test it
 * 5. Register it
 *
 * For demo, we simulate the process with realistic stages and delays.
 */

interface ImportRequest {
  url: string
  role_type?: string
}

const KNOWN_REPOS: Record<string, any> = {
  'jesse-ai/jesse': {
    name: 'Jesse Framework Strategy',
    role_type: 'strategist',
    description: 'Imported from jesse-ai/jesse — Python-first quant framework with backtesting, live trading, and research tools.',
    parameters: [
      { name: 'warmup_candles', type: 'int', default: 240, description: 'Warmup period for indicators' },
      { name: 'risk_per_trade', type: 'float', default: 0.02, description: 'Risk per trade as fraction of equity' },
    ],
  },
  'freqtrade/freqtrade': {
    name: 'Freqtrade Strategy',
    role_type: 'strategist',
    description: 'Imported from freqtrade/freqtrade — crypto trading bot framework with hyperopt and backtesting.',
    parameters: [
      { name: 'timeframe', type: 'str', default: '5m', description: 'Trading timeframe' },
      { name: 'stoploss', type: 'float', default: -0.10, description: 'Stop loss as negative fraction' },
    ],
  },
  'ta-lib/ta-lib-python': {
    name: 'TA-Lib Indicator Pack',
    role_type: 'analyst',
    description: 'Imported from ta-lib — comprehensive technical analysis library with 150+ indicators.',
    parameters: [
      { name: 'indicator_set', type: 'str', default: 'momentum', description: 'Indicator category to load' },
    ],
  },
}

function extractRepoPath(url: string): string | null {
  const match = url.match(/github\.com\/([^/]+\/[^/]+)/)
  return match ? match[1] : null
}

export async function POST(request: Request) {
  const body: ImportRequest = await request.json()
  const repoPath = extractRepoPath(body.url || '')

  if (!repoPath) {
    return NextResponse.json({ ok: false, data: null, error: 'Invalid GitHub URL' }, { status: 400 })
  }

  // Check if it's a known repo (demo shortcut)
  const known = KNOWN_REPOS[repoPath]

  const importId = 'imp-' + Date.now().toString(36)
  const skill = known || {
    name: `${repoPath.split('/')[1]} Strategy`,
    role_type: body.role_type || 'strategist',
    description: `Imported from ${repoPath} — AI-analyzed and adapted to QuantArmy BaseSkill interface.`,
    parameters: [
      { name: 'lookback', type: 'int', default: 50, description: 'Analysis lookback period' },
    ],
  }

  return NextResponse.json({
    ok: true,
    data: {
      import_id: importId,
      status: 'success',
      repo: repoPath,
      stages: [
        { stage: 'clone', status: 'done', message: `Cloned ${repoPath}` },
        { stage: 'analyze', status: 'done', message: 'Identified strategy pattern' },
        { stage: 'adapt', status: 'done', message: 'Generated BaseSkill wrapper' },
        { stage: 'test', status: 'done', message: 'Sandbox test passed' },
      ],
      skill: {
        id: `github-${importId}`,
        ...skill,
        version: '1.0.0',
        author: repoPath.split('/')[0],
        source: 'github',
        source_url: body.url,
        backtest_result: null,
        status: 'active',
      },
    },
    error: null,
  })
}
