import { NextRequest, NextResponse } from 'next/server'
import type { User } from './lib/types'

const PUBLIC_ROUTES = ['/', '/login', '/api/auth/login', '/api/auth/session', '/api/init', '/api/auth/validate']
const PROTECTED_API_ROUTES = ['/api/users', '/api/movements', '/api/categories']

async function validateSession(token: string, req: NextRequest): Promise<User | null> {
  try {
    // Use API call instead of direct database access to avoid Edge Runtime issues
    const response = await fetch(new URL('/api/auth/validate', req.url), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token }),
    })

    if (response.ok) {
      const data = await response.json()
      return data.user
    }
    return null
  } catch (error) {
    return null
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const sessionToken = req.cookies.get('session-token')?.value

  if (PUBLIC_ROUTES.some(path => pathname.startsWith(path))) {
    return NextResponse.next()
  }

  if (!sessionToken) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }
    return NextResponse.redirect(new URL('/login', req.url))
  }

  const user = await validateSession(sessionToken, req)

  if (!user) {
    const response = NextResponse.redirect(new URL('/login', req.url))
    response.cookies.delete('session-token')
    return response
  }

  if (pathname.startsWith('/login')) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  if (PROTECTED_API_ROUTES.some(path => pathname.startsWith(path))) {
    const method = req.method.toUpperCase()
    let requiredPermission: keyof User['permissions'] | null = null

    if (method === 'POST') requiredPermission = 'canCreate'
    if (method === 'PUT' || method === 'PATCH') requiredPermission = 'canEdit'
    if (method === 'DELETE') requiredPermission = 'canDelete'

    if (requiredPermission && user.role !== 'root' && user.permissions && !user.permissions[requiredPermission]) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }
  }

  const requestHeaders = new Headers(req.headers)
  requestHeaders.set('x-user', JSON.stringify(user))

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
