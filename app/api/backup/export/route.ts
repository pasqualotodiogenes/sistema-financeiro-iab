import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth';
import { db } from '@/lib/database';

const ALLOWED_ROLES = ['root', 'admin'];

export async function GET(req: NextRequest) {
  const token = req.cookies.get('session-token')?.value;
  const session = AuthService.getCurrentSession(token || '');
  
  if (!session || !ALLOWED_ROLES.includes(session.user.role)) {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
  }

  try {
    const database = db();
    
    // Obter schema das tabelas
    const tables = database.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name NOT LIKE 'sqlite_%'
      ORDER BY name
    `).all() as Array<{name: string}>;

    let sqlExport = `-- IAB Finance Database Export\n-- Generated: ${new Date().toISOString()}\n\n`;
    
    // Exportar schema e dados de cada tabela
    for (const table of tables) {
      const tableName = table.name;
      
      // Schema da tabela
      const schema = database.prepare(`
        SELECT sql FROM sqlite_master 
        WHERE type='table' AND name = ?
      `).get(tableName) as {sql: string} | undefined;
      
      if (schema) {
        sqlExport += `-- Table: ${tableName}\n`;
        sqlExport += `${schema.sql};\n\n`;
        
        // Dados da tabela
        const rows = database.prepare(`SELECT * FROM ${tableName}`).all();
        
        if (rows.length > 0) {
          const columns = Object.keys(rows[0]);
          const columnsList = columns.map(col => `\`${col}\``).join(', ');
          
          sqlExport += `-- Data for table: ${tableName}\n`;
          
          for (const row of rows) {
            const values = columns.map(col => {
              const value = (row as any)[col];
              if (value === null) return 'NULL';
              if (typeof value === 'string') return `'${value.replace(/'/g, "''")}'`;
              return value;
            }).join(', ');
            
            sqlExport += `INSERT INTO \`${tableName}\` (${columnsList}) VALUES (${values});\n`;
          }
          sqlExport += '\n';
        }
      }
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `iab_finance_export_${timestamp}.sql`;

    return new NextResponse(sqlExport, {
      status: 200,
      headers: {
        'Content-Type': 'application/sql',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': Buffer.byteLength(sqlExport, 'utf8').toString(),
      },
    });
  } catch (error) {
    console.error('Erro ao exportar dados:', error);
    return NextResponse.json({ 
      error: 'Erro interno do servidor' 
    }, { status: 500 });
  }
}