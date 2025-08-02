import cron from 'node-cron';
import { db } from './database';
import { 
  sendBackupEmail, 
  getRootUserEmail, 
  checkWeeklyChanges, 
  generateBackupBuffer 
} from './email-service';

let isSchedulerStarted = false;

export function startBackupScheduler() {
  // Evitar múltiplas inicializações
  if (isSchedulerStarted) {
    console.log('📅 Backup scheduler já está ativo');
    return;
  }

  // Todo domingo às 8h da manhã (horário do servidor)
  // Formato: segundo minuto hora dia-do-mês mês dia-da-semana
  const schedule = '0 8 * * 0'; // 0 = domingo
  
  console.log('📅 Iniciando backup scheduler - Todo domingo às 8h');
  
  cron.schedule(schedule, async () => {
    console.log('🔄 Executando verificação de backup semanal...');
    await executeWeeklyBackup();
  }, {
    scheduled: true,
    timezone: 'America/Sao_Paulo' // Fuso horário do Brasil
  });

  isSchedulerStarted = true;
  console.log('✅ Backup scheduler iniciado com sucesso!');
}

export async function executeWeeklyBackup(): Promise<void> {
  const database = db();
  let logId: number | null = null;

  try {
    // 1. Verificar se houve mudanças na semana
    console.log('🔍 Verificando mudanças semanais...');
    const changesCount = await checkWeeklyChanges();
    
    // 2. Criar log de tentativa
    const logResult = database.prepare(`
      INSERT INTO backup_log (changes_count, status) 
      VALUES (?, 'checking')
    `).run(changesCount);
    logId = logResult.lastInsertRowid as number;
    
    console.log(`📊 Mudanças detectadas: ${changesCount}`);
    
    // 3. Se não houve mudanças, finalizar
    if (changesCount === 0) {
      database.prepare(`
        UPDATE backup_log 
        SET status = 'no_changes' 
        WHERE id = ?
      `).run(logId);
      
      console.log('ℹ️  Nenhuma mudança detectada - backup não enviado');
      return;
    }

    // 4. Buscar email do usuário root
    console.log('👤 Buscando usuário root...');
    const rootUser = await getRootUserEmail();
    
    if (!rootUser) {
      throw new Error('Usuário root não encontrado');
    }
    
    console.log(`📧 Email do root: ${rootUser.email}`);
    
    // 5. Gerar backup
    console.log('🗄️ Gerando backup do banco de dados...');
    const backupBuffer = await generateBackupBuffer();
    
    const now = new Date();
    const weekPeriod = getWeekPeriod(now);
    const backupFilename = `iab_finance_backup_${now.toISOString().slice(0,10)}.db`;
    
    // 6. Enviar email
    console.log('📨 Enviando email de backup...');
    const emailSent = await sendBackupEmail({
      recipientEmail: rootUser.email,
      recipientName: rootUser.name,
      changesCount,
      weekPeriod,
      backupBuffer,
      backupFilename
    });
    
    // 7. Atualizar log
    database.prepare(`
      UPDATE backup_log 
      SET email_sent = ?, status = ?
      WHERE id = ?
    `).run(emailSent ? 1 : 0, emailSent ? 'sent' : 'failed', logId);
    
    if (emailSent) {
      console.log('✅ Backup enviado com sucesso!');
    } else {
      console.log('❌ Falha ao enviar backup');
    }
    
  } catch (error) {
    console.error('💥 Erro no processo de backup:', error);
    
    // Atualizar log com erro
    if (logId) {
      database.prepare(`
        UPDATE backup_log 
        SET status = 'error'
        WHERE id = ?
      `).run(logId);
    }
  }
}

function getWeekPeriod(date: Date): string {
  const endDate = new Date(date);
  const startDate = new Date(date);
  startDate.setDate(endDate.getDate() - 7);
  
  const formatDate = (d: Date) => d.toLocaleDateString('pt-BR');
  
  return `${formatDate(startDate)} a ${formatDate(endDate)}`;
}

// Função para teste manual (pode ser chamada via API)
export async function testBackup(): Promise<string> {
  console.log('🧪 Executando teste manual de backup...');
  await executeWeeklyBackup();
  return 'Teste de backup executado - verifique os logs';
}