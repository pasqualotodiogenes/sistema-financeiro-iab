// MOVED: Este arquivo deve ser movido para app/api/auth/logout/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { AuthService } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const token = req.cookies.get('session-token')?.value
  
  if (token) {
    // Remover sessão do banco
    AuthService.logout(token)
  }
  
  // Limpar cookie
  const response = NextResponse.json({ success: true })
  response.cookies.set('session-token', '', {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
    secure: process.env.NODE_ENV === 'production',
  })
  
  return response
} 