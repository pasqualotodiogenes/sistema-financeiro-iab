import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';
import { AuthService } from '@/lib/auth';
import path from 'path';
import fs from 'fs';

const ALLOWED_ROLES = ['root', 'admin', 'editor'];
const CHURCH_DIR = path.join(process.cwd(), 'public', 'church');

export async function GET() {
<<<<<<< HEAD
  const db = getDb();
  const row = await db.prepare('SELECT image FROM church_profile WHERE id = ?').get('main') as { image: string | null } | undefined;
=======
  const row = db.prepare('SELECT image FROM church_profile WHERE id = ?').get('main') as { image: string | null } | undefined;
>>>>>>> 8c7ee621e6097d5d86f5297726a3fafed9a905c4
  return NextResponse.json({ image: row?.image || null });
}

export async function POST(req: NextRequest) {
  const token = req.cookies.get('session-token')?.value;
  const session = AuthService.getCurrentSession(token || '');
  if (!session || !ALLOWED_ROLES.includes(session.user.role)) {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
  }

  const formData = await req.formData();
  const file = formData.get('file');
  if (!file || typeof file === 'string') {
    return NextResponse.json({ error: 'Arquivo inválido' }, { status: 400 });
  }

  // Garante que a pasta existe
  if (!fs.existsSync(CHURCH_DIR)) fs.mkdirSync(CHURCH_DIR, { recursive: true });

  const buffer = Buffer.from(await file.arrayBuffer());
  const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.\-_]/g, '')}`;
  const filePath = path.join(CHURCH_DIR, fileName);
  fs.writeFileSync(filePath, buffer);

  const imagePath = `/api/assets/church/${fileName}`;
<<<<<<< HEAD
  const db = getDb();
  await db.prepare("UPDATE church_profile SET image = ?, updatedAt = datetime('now') WHERE id = ?")
=======
  db.prepare("UPDATE church_profile SET image = ?, updatedAt = datetime('now') WHERE id = ?")
>>>>>>> 8c7ee621e6097d5d86f5297726a3fafed9a905c4
    .run(imagePath, 'main');

  return NextResponse.json({ success: true, image: imagePath });
}

export async function DELETE(req: NextRequest) {
  const token = req.cookies.get('session-token')?.value;
  const session = AuthService.getCurrentSession(token || '');
  if (!session || !ALLOWED_ROLES.includes(session.user.role)) {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
  }
<<<<<<< HEAD
  const db = getDb();
  const row = await db.prepare('SELECT image FROM church_profile WHERE id = ?').get('main') as { image: string | null } | undefined;
=======
  const row = db.prepare('SELECT image FROM church_profile WHERE id = ?').get('main') as { image: string | null } | undefined;
>>>>>>> 8c7ee621e6097d5d86f5297726a3fafed9a905c4
  if (row?.image) {
    const filePath = path.join(process.cwd(), 'public', row.image);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }
  db.prepare("UPDATE church_profile SET image = NULL, updatedAt = datetime('now') WHERE id = ?").run('main');
  return NextResponse.json({ success: true });
} 