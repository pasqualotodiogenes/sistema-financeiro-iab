"use client"

import { useEffect, useState } from 'react'
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

  const saldo = (stats?.totalEntradas || 0) - (stats?.totalSaidas || 0)

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
            {stats?.categories
              .filter(category => canAccessCategory(category.id, stats.categories))
              .map((category) => {
                  const IconComponent = getIconComponent(category.icon)
                const categorySaldo = category.totalEntradas - category.totalSaidas

                  return (
                    <Link 
                      key={category.id}
                      href={`/dashboard/${category.slug}`}
                      className="block focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-lg"
                    >
                      <Card className="hover:shadow-md transition-shadow cursor-pointer border-cream-300 h-full">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-primary-800">
                        {category.name}
                      </CardTitle>
                      <IconComponent className="h-5 w-5 text-gray-600" />
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-green-600">Entradas:</span>
                          <span className="font-medium">{formatCurrency(category.totalEntradas)}</span>
                              </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-red-600">Saídas:</span>
                          <span className="font-medium">{formatCurrency(category.totalSaidas)}</span>
                              </div>
                        <div className="flex justify-between text-sm border-t pt-2">
                        <span className={`font-bold ${categorySaldo >= 0 ? 'text-green-800' : 'text-red-800'}`}>Saldo:</span>
                        <span className={`font-bold ${categorySaldo >= 0 ? 'text-green-800' : 'text-red-800'}`}>{formatCurrency(categorySaldo)}</span>
                            </div>
                        <div className="text-xs text-gray-500 text-center">
                        {category.movementsCount} movimentaç{category.movementsCount !== 1 ? 'ões' : 'ão'}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  )
                })}
        </div>
      </div>
    </AuthGuard>
  )
}
