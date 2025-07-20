import { NextResponse } from 'next/server'
import { AuthService } from '@/lib/auth'

export async function POST(req: Request) {
  try {
    const { token } = await req.json()
    if (!token) {
      return NextResponse.json({ error: 'Token não fornecido' }, { status: 400 })
    }

    const session = AuthService.getCurrentSession(token)
    if (!session) {
      return NextResponse.json({ error: 'Sessão inválida ou expirada' }, { status: 401 })
    }

    return NextResponse.json({ user: session.user })
  } catch (error) {
    console.error('Erro ao verificar a sessão:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
