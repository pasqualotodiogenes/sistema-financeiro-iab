import { NextRequest, NextResponse } from 'next/server';
import { join } from 'path';
import { readFileSync, existsSync } from 'fs';

// Tipos MIME por extensão
const MIME_TYPES: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    // Await dos params (obrigatório no Next.js 15)
    const { path } = await params;
    
    // Constrói o caminho do arquivo
    const filePath = join(process.cwd(), 'public', ...path);
    
    // Verifica se o arquivo existe
    if (!existsSync(filePath)) {
      return new NextResponse('File not found', { status: 404 });
    }

    // Lê o arquivo
    const fileBuffer = readFileSync(filePath);
    
    // Determina o tipo MIME pela extensão
    const extension = '.' + path[path.length - 1].split('.').pop()?.toLowerCase();
    const contentType = MIME_TYPES[extension] || 'application/octet-stream';

    // Retorna a imagem com headers corretos
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable', // Cache 1 ano
      },
    });
  } catch (error) {
    console.error('Error serving asset:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}