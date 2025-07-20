import { NextResponse } from 'next/server'
import { AuthService } from '@/lib/auth'

export async function GET() {
  try {
    const session = AuthService.getCurrentSession('')
    if (!session) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }
    
    return NextResponse.json({
      user: {
        id: session.user.id,
        username: session.user.username,
        role: session.user.role,
        permissions: session.user.permissions
      }
    })
  } catch (error) {
    console.error('Erro no debug:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
} 