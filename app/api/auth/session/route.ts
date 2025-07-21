// MOVED: Este arquivo deve ser movido para app/api/auth/session/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { AuthService } from '@/lib/auth'
import crypto from 'crypto'

// Inicializar usuários padrão
AuthService.initializeUsers();

export async function GET(req: NextRequest) {
  const token = req.cookies.get('session-token')?.value
  
  if (!token) {
    return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })
  }
  
  const session = await AuthService.getCurrentSession(token)
  if (!session) {
    return NextResponse.json({ error: 'Sessão inválida ou expirada.' }, { status: 401 })
  }
  
  // Usuário já vem sem senha da sessão
  const userSafe = session.user
  
  // Gerar e definir o token CSRF
  const csrfToken = crypto.randomBytes(32).toString('hex')
  const response = NextResponse.json({ user: userSafe, expiresAt: session.expiresAt, csrfToken })
  
  // Headers de segurança para cache
  response.headers.set('Cache-Control', 'private, no-store, max-age=0')
  response.headers.set('Pragma', 'no-cache')
  
  response.cookies.set('csrf-token', csrfToken, {
    httpOnly: false, // O cliente PRECISA ler este
    sameSite: 'lax',
    path: '/',
    secure: true,
  })
  
  return response
} 