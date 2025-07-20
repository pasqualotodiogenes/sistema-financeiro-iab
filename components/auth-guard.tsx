"use client"

import { ReactNode } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { usePermissions } from '@/hooks/use-permissions'
import { useRouter } from 'next/navigation'
import { User } from '@/lib/types'

interface AuthGuardProps {
  children: ReactNode
  requiredPermission?: keyof User['permissions']
  category?: string
  fallback?: ReactNode
}

export function AuthGuard({ children, requiredPermission, category, fallback }: AuthGuardProps) {
  const { loading, isAuthenticated } = useAuth()
  const { hasPermission, canAccessCategory } = usePermissions()
  const router = useRouter()

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-cream-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  // Não autenticado
  if (!isAuthenticated) {
    router.push('/')
    return null
  }

  // Verificar permissão específica
  if (requiredPermission && !hasPermission(requiredPermission, category)) {
    return fallback || (
        <div className="min-h-screen bg-cream-50 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-primary-800 mb-2">Acesso Negado</h1>
            <p className="text-primary-600">Você não tem permissão para acessar esta página.</p>
          </div>
        </div>
      )
  }

  // Verificar acesso à categoria
  if (category && !canAccessCategory(category)) {
    return fallback || (
      <div className="min-h-screen bg-cream-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-primary-800 mb-2">Categoria Restrita</h1>
          <p className="text-primary-600">Você não tem acesso a esta categoria.</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
