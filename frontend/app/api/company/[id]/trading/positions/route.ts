import { NextResponse } from 'next/server'

// Positions are now managed client-side via paper-trading.ts + localStorage
// This route returns empty — the client reads from localStorage directly
export async function GET() {
  return NextResponse.json({ ok: true, data: [], error: null })
}
