import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth';
import { testBackup } from '@/lib/backup-scheduler';

const ALLOWED_ROLES = ['root'];

export async function POST(req: NextRequest) {
  const token = req.cookies.get('session-token')?.value;
  const session = AuthService.getCurrentSession(token || '');
  
  if (!session || !ALLOWED_ROLES.includes(session.user.role)) {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
  }

  try {
    const result = await testBackup();
    return NextResponse.json({ 
      success: true, 
      message: result 
    });
  } catch (error) {
    console.error('Erro no teste de backup:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Erro interno do servidor' 
    }, { status: 500 });
  }
}