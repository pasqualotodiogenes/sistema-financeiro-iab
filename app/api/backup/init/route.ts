import { NextResponse } from 'next/server';
import { startBackupScheduler } from '@/lib/backup-scheduler';

// Esta API é chamada automaticamente no startup para inicializar o scheduler
export async function GET() {
  try {
    // Só inicializar em produção
    if (process.env.NODE_ENV === 'production') {
      startBackupScheduler();
      return NextResponse.json({ 
        success: true, 
        message: 'Backup scheduler iniciado' 
      });
    } else {
      return NextResponse.json({ 
        success: false, 
        message: 'Scheduler só roda em produção' 
      });
    }
  } catch (error) {
    console.error('Erro ao inicializar scheduler:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Erro interno' 
    }, { status: 500 });
  }
}