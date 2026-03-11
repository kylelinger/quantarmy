import { NextResponse } from 'next/server'

const DEMO_SKILLS = [
  {
    id: 'psar-001',
    name: 'PSAR Trend',
    role_type: 'strategist',
    version: '1.0.0',
    description: 'Parabolic SAR trend following with EMA filter and ADX regime guard',
    author: 'QuantArmy',
    source: 'builtin',
    source_url: null,
    parameters: [
      { name: 'af_start', type: 'float', default: 0.01, min_value: 0.001, max_value: 0.1, description: 'PSAR acceleration factor start' },
      { name: 'af_step', type: 'float', default: 0.01, min_value: 0.001, max_value: 0.1, description: 'PSAR acceleration factor step' },
      { name: 'af_max', type: 'float', default: 0.1, min_value: 0.05, max_value: 0.5, description: 'PSAR acceleration factor max' },
      { name: 'ema_period', type: 'int', default: 50, min_value: 10, max_value: 200, description: 'EMA trend filter period' },
      { name: 'adx_period', type: 'int', default: 14, min_value: 7, max_value: 30, description: 'ADX regime detection period' },
      { name: 'adx_min', type: 'float', default: 20.0, min_value: 10.0, max_value: 40.0, description: 'Minimum ADX for trending regime' },
      { name: 'size_pct', type: 'float', default: 0.2, min_value: 0.05, max_value: 0.5, description: 'Position size as % of equity' },
      { name: 'sl_atr_mult', type: 'float', default: 2.5, min_value: 1.0, max_value: 5.0, description: 'Stop loss ATR multiplier' },
      { name: 'tp_atr_mult', type: 'float', default: 4.0, min_value: 1.0, max_value: 10.0, description: 'Take profit ATR multiplier' },
    ],
    backtest_result: {
      trades: 27, win_rate: 0.444, profit_factor: 1.07,
      max_drawdown: 0.024, sharpe_ratio: 0.07, total_return: 0.004,
    },
    status: 'active',
  },
  {
    id: 'risk-001',
    name: 'Basic Risk Officer',
    role_type: 'risk_officer',
    version: '1.0.0',
    description: 'Position sizing, drawdown guard, max exposure limits',
    author: 'QuantArmy',
    source: 'builtin',
    source_url: null,
    parameters: [
      { name: 'max_position_pct', type: 'float', default: 0.15, min_value: 0.05, max_value: 0.5, description: 'Max single position as % of equity' },
      { name: 'max_total_exposure', type: 'float', default: 0.8, min_value: 0.3, max_value: 1.0, description: 'Max total portfolio exposure' },
      { name: 'max_positions', type: 'int', default: 10, min_value: 1, max_value: 20, description: 'Max number of open positions' },
      { name: 'drawdown_halt_pct', type: 'float', default: 0.15, min_value: 0.05, max_value: 0.5, description: 'Halt new trades if drawdown exceeds this' },
    ],
    backtest_result: null,
    status: 'active',
  },
]

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const roleType = searchParams.get('role_type')

  let filtered = DEMO_SKILLS
  if (roleType) {
    filtered = filtered.filter((s) => s.role_type === roleType)
  }

  return NextResponse.json({ ok: true, data: filtered, error: null })
}
