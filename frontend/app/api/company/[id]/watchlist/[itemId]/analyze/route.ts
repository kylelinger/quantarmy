import { NextResponse } from 'next/server'

export async function POST() {
  return NextResponse.json({
    ok: true,
    data: {
      status: 'analysis_requested',
      current_analysis: {},
    },
    error: null,
  })
}
