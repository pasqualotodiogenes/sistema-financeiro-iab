import { Resend } from 'resend';
import { db } from './database';
import path from 'path';
import fs from 'fs';

// Configuração do Resend (variável de ambiente)
const resend = new Resend(process.env.RESEND_API_KEY);

interface BackupEmailData {
  recipientEmail: string;
  recipientName: string;
  changesCount: number;
  weekPeriod: string;
  backupBuffer: Buffer;
  backupFilename: string;
}

export async function sendBackupEmail(data: BackupEmailData): Promise<boolean> {
  try {
    const emailHtml = generateEmailTemplate(data);
    
    const result = await resend.emails.send({
      from: 'Sistema IAB <sistema@sistema-financeiro-iab.onrender.com>',
      to: [data.recipientEmail],
      subject: `📊 Backup Semanal - Sistema Financeiro IAB (${data.weekPeriod})`,
      html: emailHtml,
      attachments: [
        {
          filename: data.backupFilename,
          content: data.backupBuffer,
        },
      ],
    });

    console.log('✅ Email de backup enviado:', result.data?.id);
    return true;
  } catch (error) {
    console.error('❌ Erro ao enviar email de backup:', error);
    return false;
  }
}

function generateEmailTemplate(data: BackupEmailData): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #4a7c59; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
        .stats { background: white; padding: 15px; border-radius: 6px; margin: 15px 0; }
        .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
        .attachment { background: #e8f5e8; padding: 15px; border-radius: 6px; margin: 15px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📊 Backup Semanal - Sistema Financeiro IAB</h1>
          <p>Período: ${data.weekPeriod}</p>
        </div>
        
        <div class="content">
          <p>Olá <strong>${data.recipientName}</strong>,</p>
          
          <p>Seu backup semanal foi gerado automaticamente pelo sistema.</p>
          
          <div class="stats">
            <h3>✅ ATIVIDADE DA SEMANA</h3>
            <p><strong>${data.changesCount}</strong> alterações detectadas no sistema</p>
            <ul>
              <li>Movimentações financeiras</li>
              <li>Usuários e permissões</li>
              <li>Categorias e configurações</li>
            </ul>
          </div>
          
          <div class="attachment">
            <h3>📎 ARQUIVO DE BACKUP</h3>
            <p><strong>Nome:</strong> ${data.backupFilename}</p>
            <p><strong>Tamanho:</strong> ${Math.round(data.backupBuffer.length / 1024)} KB</p>
            <p>⚠️ <em>Mantenha este arquivo em local seguro! Ele contém todos os dados financeiros da igreja.</em></p>
          </div>
          
          <p><strong>O que fazer com o backup:</strong></p>
          <ol>
            <li>Baixe o arquivo anexo</li>
            <li>Salve em local seguro (Google Drive, Dropbox, etc.)</li>
            <li>Mantenha pelo menos 4 backups mensais</li>
          </ol>
        </div>
        
        <div class="footer">
          <p>Este é um email automático gerado pelo Sistema Financeiro IAB</p>
          <p>💚 Desenvolvido com amor para a Igreja Assembleia de Deus</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export async function getRootUserEmail(): Promise<{email: string, name: string} | null> {
  try {
    const database = db();
    const rootUser = database.prepare(`
      SELECT email, name FROM users 
      WHERE role = 'root' 
      ORDER BY createdAt ASC 
      LIMIT 1
    `).get() as {email: string, name: string} | undefined;
    
    return rootUser || null;
  } catch (error) {
    console.error('Erro ao buscar email do root:', error);
    return null;
  }
}

export async function checkWeeklyChanges(): Promise<number> {
  try {
    const database = db();
    
    // Buscar data do último backup
    const lastBackup = database.prepare(`
      SELECT backup_date FROM backup_log 
      WHERE email_sent = 1 
      ORDER BY backup_date DESC 
      LIMIT 1
    `).get() as {backup_date: string} | undefined;
    
    const weekAgo = lastBackup?.backup_date || 
      new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    
    // Contar mudanças desde último backup
    const changes = database.prepare(`
      SELECT 
        (SELECT COUNT(*) FROM movements WHERE createdAt > ?) +
        (SELECT COUNT(*) FROM users WHERE createdAt > ?) +
        (SELECT COUNT(*) FROM categories WHERE id NOT LIKE '%system%' AND createdAt > ?) +
        (SELECT COUNT(*) FROM church_profile WHERE updatedAt > ?) as total
    `).get(weekAgo, weekAgo, weekAgo, weekAgo) as {total: number};
    
    return changes.total || 0;
  } catch (error) {
    console.error('Erro ao verificar mudanças:', error);
    return 0;
  }
}

export async function generateBackupBuffer(): Promise<Buffer> {
  const basePath = process.env.RENDER_DISK_MOUNT_PATH || process.cwd();
  const dbPath = path.join(basePath, 'iab_finance.db');
  return fs.readFileSync(dbPath);
}