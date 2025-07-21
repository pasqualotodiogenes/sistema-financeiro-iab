import { NextResponse } from 'next/server'
import { AuthService } from '@/lib/auth'
import { DataStorage } from '@/lib/data-storage'

export async function POST() {
  try {
    // Inicializar dados padrão
    AuthService.initializeUsers()
    DataStorage.initializeDefaultData()

    return NextResponse.json({ 
      success: true, 
      message: 'Dados inicializados com sucesso',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Erro na inicialização:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function GET() {
  try {
    // Verificar status da inicialização
    const users = await AuthService.getUsers()
    const usersCount = users.length
    const categoriesCount = DataStorage.getCategories().length
    const movementsCount = DataStorage.getMovements().length

    return NextResponse.json({
      initialized: usersCount > 0 && categoriesCount > 0,
      stats: {
        users: usersCount,
        categories: categoriesCount,
        movements: movementsCount
      }
    })
  } catch (error) {
    console.error('Erro ao verificar status:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
} 