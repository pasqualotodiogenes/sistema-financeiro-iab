import { NextRequest, NextResponse } from 'next/server'
import { AuthService } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json()
    if (!token) {
      return NextResponse.json({ valid: false }, { status: 400 })
    }

    const session = AuthService.getCurrentSession(token)
    if (!session) {
      return NextResponse.json({ valid: false }, { status: 401 })
    }

    // Usuário já vem sem senha da sessão
    return NextResponse.json({ valid: true, user: session.user }, { status: 200 })

  } catch (err) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _err = err
    return NextResponse.json({ valid: false, error: 'Internal Server Error' }, { status: 500 })
  }
}