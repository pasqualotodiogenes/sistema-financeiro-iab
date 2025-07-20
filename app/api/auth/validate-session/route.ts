import { NextRequest, NextResponse } from 'next/server'
import { AuthService } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json()
    if (!token) {
      return NextResponse.json({ error: 'Token não fornecido' }, { status: 400 })
    }

    const session = AuthService.getCurrentSession(token)

    if (session) {
      return NextResponse.json({ user: session.user }, { status: 200 })
    }

    return NextResponse.json({ error: 'Sessão inválida' }, { status: 401 })
  } catch (error) {
    console.error('Erro ao validar sessão:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
