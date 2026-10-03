import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function proxy(request: NextRequest) {
  const headers = new Headers(request.headers)
  headers.set('x-mo-path', request.nextUrl.pathname + request.nextUrl.search)
  return NextResponse.next({ request: { headers } })
}
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/bills/:path*',
    '/groups/:path*',
    '/payout-accounts/:path*',
    '/support/:path*',
    '/admin/:path*',
  ],
}
