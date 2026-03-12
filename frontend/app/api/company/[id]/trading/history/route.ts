import { NextResponse } from 'next/server'

// Trade history managed client-side via paper-trading.ts + localStorage
export async function GET() {
  return NextResponse.json({ ok: true, data: [], error: null })
}
