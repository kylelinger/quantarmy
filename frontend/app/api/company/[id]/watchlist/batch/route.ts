import { NextResponse } from 'next/server'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  // Redirect to parent route which handles batch via body.symbols
  const body = await request.json()
  const { id } = await params
  const res = await fetch(new URL(`/api/company/${id}/watchlist`, request.url), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await res.json()
  return NextResponse.json(data)
}
