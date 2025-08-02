import { NextResponse } from 'next/server';
import { db } from '@/lib/database';

export async function GET() {
  try {
    const updateSlugs = db().prepare('UPDATE categories SET slug = ? WHERE id = ? AND slug IS NULL');
    const systemCategories = [
      { id: 'aquisicao', slug: 'aquisicao' },
      { id: 'cantinas', slug: 'cantinas' },  
      { id: 'eventos', slug: 'eventos' },
      { id: 'jovens', slug: 'jovens' },
      { id: 'melhorias', slug: 'melhorias' },
      { id: 'missoes', slug: 'missoes' }
    ];
    
    const results = [];
    systemCategories.forEach(({ id, slug }) => {
      const result = updateSlugs.run(slug, id);
      results.push({ id, slug, changes: result.changes });
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Slugs corrigidos com sucesso!',
      results 
    });
  } catch (error) {
    console.error('Erro ao corrigir slugs:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Erro interno do servidor' 
    }, { status: 500 });
  }
}