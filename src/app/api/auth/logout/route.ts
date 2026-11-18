import { NextResponse } from 'next/server'
import { clearSession } from '@/lib/auth'
import { getAppUrl } from '@/lib/app-url'

export async function POST() {
  await clearSession()
  return NextResponse.redirect(`${getAppUrl()}/`)
}

export async function GET() {
  await clearSession()
  return NextResponse.redirect(`${getAppUrl()}/`)
}
