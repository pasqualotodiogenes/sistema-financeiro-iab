import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json();

    if (!token) {
      return NextResponse.json({ error: 'Token not provided' }, { status: 400 });
    }

    // AuthService.getCurrentSession é ASYNC, precisa de await
    const session = AuthService.getCurrentSession(token);

    if (session && session.user) {
      // Retorna o usuário para o middleware
      return NextResponse.json({ user: session.user });
    } else {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }
  } catch (error) {
    // Log do erro no servidor para depuração
    console.error('Error validating token:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
