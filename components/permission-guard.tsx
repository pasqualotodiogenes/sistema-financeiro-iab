"use client"

import { ReactNode } from 'react'
import { usePermissions } from '@/hooks/use-permissions'
import { User } from '@/lib/types'

interface PermissionGuardProps {
  children: ReactNode
  requiredPermission?: keyof User['permissions']
  requiredCategory?: string
  requiredRole?: User['role']
  fallback?: ReactNode
  showMessage?: boolean
}

export function PermissionGuard({ 
  children, 
  requiredPermission, 
  requiredCategory, 
  requiredRole,
  fallback,
  showMessage = true 
}: PermissionGuardProps) {
  const { 
    user, 
    hasPermission, 
    canAccessCategory,
    isRoot,
    isAdmin,
    isEditor,
    isViewer
  } = usePermissions()

  if (!user) {
    return showMessage ? (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Acesso Negado</h3>
          <p className="text-gray-600">Você precisa estar logado para acessar este recurso.</p>
        </div>
      </div>
    ) : null
  }

  // Verificar role específico
  if (requiredRole) {
    const hasRole = 
      (requiredRole === 'root' && isRoot) ||
      (requiredRole === 'admin' && isAdmin) ||
      (requiredRole === 'editor' && isEditor) ||
      (requiredRole === 'viewer' && isViewer)
    
    if (!hasRole) {
      return fallback || (showMessage ? (
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Permissão Insuficiente</h3>
            <p className="text-gray-600">Você precisa ter o nível de acesso {requiredRole}.</p>
          </div>
        </div>
      ) : null)
    }
  }

  // Verificar permissão específica
  if (requiredPermission) {
    if (!hasPermission(requiredPermission, requiredCategory)) {
      return fallback || (showMessage ? (
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Acesso Negado</h3>
            <p className="text-gray-600">Você não tem permissão para acessar este recurso.</p>
          </div>
        </div>
      ) : null)
    }
  }

  // Verificar acesso à categoria
  if (requiredCategory && !canAccessCategory(requiredCategory)) {
    return fallback || (showMessage ? (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Categoria Restrita</h3>
          <p className="text-gray-600">Você não tem acesso a esta categoria.</p>
        </div>
      </div>
    ) : null)
  }

  return <>{children}</>
} 