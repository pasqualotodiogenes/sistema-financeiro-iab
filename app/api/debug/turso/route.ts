import { db as getDb } from '@/lib/database'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    console.log('🔍 Debug endpoint called')
    
    const db = await getDb()
    console.log('✅ Database connection established')
    
    // Test basic query
    const users = await db.prepare('SELECT COUNT(*) as count FROM users').get()
    console.log('👥 Users count:', users)
    
    const categories = await db.prepare('SELECT COUNT(*) as count FROM categories').get()
    console.log('📁 Categories count:', categories)
    
    // Test categories for viewer
    const publicCategories = await db.prepare('SELECT id, name FROM categories WHERE isSystem = 1 OR isPublic = 1').all()
    console.log('🔓 Public categories:', publicCategories)
    
    return NextResponse.json({
      success: true,
      turso: process.env.USE_TURSO === 'true',
      data: {
        users,
        categories,
        publicCategories
      }
    })
    
  } catch (error: any) {
    console.error('❌ Debug error:', error)
    return NextResponse.json({ 
      success: false,
      error: error.message,
      turso: process.env.USE_TURSO === 'true'
    }, { status: 500 })
  }
}