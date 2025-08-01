"use client"

import { useEffect, useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AuthGuard } from '@/components/auth-guard'
import { useAuth } from '@/contexts/auth-context'
import { usePermissions } from '@/hooks/use-permissions'
import Link from 'next/link'
import { LoadingState } from '@/components/loading-states'
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { StatsCards } from '@/components/ui/stats-cards'
import { getIconComponent } from '@/lib/icons-colors'
import CategoryCard from '@/components/category-card'

interface DashboardStats {
  totalEntradas: number
  totalSaidas: number
  totalMovements: number
  categories: Array<{
    id: string
    name: string
    icon: string
    color: string
    totalEntradas: number
    totalSaidas: number
    movementsCount: number
    slug: string
  }>
}


export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()
  const { canAccessCategory } = usePermissions()
  const isRoot = user?.role === 'root'

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Carregar estatísticas
      const statsRes = await fetch('/api/dashboard/stats', { credentials: 'include' })
      if (statsRes.ok) {
        const statsData = await statsRes.json()
        setStats(statsData)
      } else {
        setError('Erro ao carregar dados do dashboard')
      }
    } catch {
      setError('Erro de conexão')
    } finally {
      setLoading(false)
    }
  }

  // ✅ HOOKS SEMPRE ANTES DOS EARLY RETURNS
  // Memoized calculations
  const saldo = useMemo(() => {
    return (stats?.totalEntradas || 0) - (stats?.totalSaidas || 0);
  }, [stats?.totalEntradas, stats?.totalSaidas]);

  // Memoized filtered categories
  const filteredCategories = useMemo(() => {
    return stats?.categories?.filter(category => canAccessCategory(category.id, stats.categories)) ?? [];
  }, [stats?.categories, canAccessCategory]);

  // Early returns APÓS todos os hooks
  if (loading) {
    return (
      <LoadingState loading={true} error={null}>
        <div>Carregando dashboard...</div>
      </LoadingState>
    )
  }

  if (error) {
    return (
      <LoadingState loading={false} error={error} onRetry={loadDashboardData}>
        <div>Erro ao carregar dashboard</div>
      </LoadingState>
    )
  }

  return (
    <AuthGuard>
      <div className="w-full px-2 sm:px-4 md:px-8 ">
        {/* Header */}
        <div className="bg-white shadow-sm border-b border-cream-200 rounded-lg px-4 py-4 mb-6">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-2">
            <div>
              <h1 className="text-2xl font-bold text-primary-800">Dashboard Financeiro</h1>
              <p className="text-primary-600">
                Bem-vindo, {user?.name} • {isRoot ? 'Acesso Total' : 'Visualização'}
              </p>
            </div>
          </div>
        </div>

          {/* Cards de Resumo */}
          <StatsCards 
            totalEntradas={stats?.totalEntradas || 0}
            totalSaidas={stats?.totalSaidas || 0}
            saldo={saldo}
            className="mb-8"
          />

          {/* Categorias */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {filteredCategories.map((category) => (
              <CategoryCard key={category.id} category={category} />
            ))}
        </div>
      </div>
    </AuthGuard>
  )
}
