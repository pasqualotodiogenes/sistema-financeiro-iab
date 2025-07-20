"use client"

import { ReactNode } from 'react'
import { Loader2, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface LoadingStateProps {
  loading: boolean
  error: string | null
  onRetry?: () => void
  children: ReactNode
  loadingText?: string
  errorText?: string
  showSpinner?: boolean
}

export function LoadingState({ 
  loading, 
  error, 
  onRetry, 
  children, 
  loadingText = "Carregando...",
  errorText = "Erro ao carregar dados",
  showSpinner = true 
}: LoadingStateProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          {showSpinner && (
            <Loader2 className="h-8 w-8 animate-spin text-primary-600 mx-auto mb-4" />
          )}
          <p className="text-primary-600">{loadingText}</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <p className="text-red-600 mb-4">{errorText}</p>
          <p className="text-gray-600 mb-4">{error}</p>
          {onRetry && (
            <Button onClick={onRetry} variant="outline" className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Tentar Novamente
            </Button>
          )}
        </div>
      </div>
    )
  }

  return <>{children}</>
}

interface SkeletonProps {
  rows?: number
  className?: string
}

export function Skeleton({ rows = 3, className = "" }: SkeletonProps) {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </div>
      ))}
    </div>
  )
}

interface TableSkeletonProps {
  rows?: number
  columns?: number
}

export function TableSkeleton({ rows = 5, columns = 4 }: TableSkeletonProps) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 animate-pulse">
          {Array.from({ length: columns }).map((_, j) => (
            <div key={j} className="h-4 bg-gray-200 rounded flex-1"></div>
          ))}
        </div>
      ))}
    </div>
  )
} 