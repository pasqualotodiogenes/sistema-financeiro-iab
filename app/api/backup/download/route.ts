import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth';
import path from 'path';
import fs from 'fs';

const ALLOWED_ROLES = ['root', 'admin'];

export async function GET(req: NextRequest) {
  const token = req.cookies.get('session-token')?.value;
  const session = AuthService.getCurrentSession(token || '');
  
  if (!session || !ALLOWED_ROLES.includes(session.user.role)) {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
  }

  try {
    // Render: usa disk persistente (/data) | Local: usa project root
    const basePath = process.env.RENDER_DISK_MOUNT_PATH || process.cwd();
    const dbPath = path.join(basePath, 'iab_finance.db');
    
    if (!fs.existsSync(dbPath)) {
      return NextResponse.json({ error: 'Banco de dados não encontrado' }, { status: 404 });
    }

    const dbBuffer = fs.readFileSync(dbPath);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `iab_finance_backup_${timestamp}.db`;

    return new NextResponse(dbBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': dbBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('Erro ao fazer backup:', error);
    return NextResponse.json({ 
      error: 'Erro interno do servidor' 
    }, { status: 500 });
  }
}