"use client"

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AuthGuard } from '@/components/auth-guard'
import { useAuth } from '@/contexts/auth-context'
import { usePermissions } from '@/hooks/use-permissions'
import Link from 'next/link'
import { LoadingState } from '@/components/loading-states'
import { Coffee, Heart, Wrench, Users, Calendar, ShoppingCart, TrendingUp, TrendingDown, DollarSign } from 'lucide-react'

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

const iconMap = {
  Coffee,
  Heart,
  Wrench,
  Users,
  Calendar,
  ShoppingCart,
}

const colorMap: Record<string, string> = {
  blue: 'text-blue-600',
  green: 'text-green-600', 
  red: 'text-red-600',
  yellow: 'text-yellow-600',
  purple: 'text-purple-600',
  pink: 'text-pink-600',
  indigo: 'text-indigo-600',
  gray: 'text-gray-600',
  orange: 'text-orange-600',
  teal: 'text-teal-600'
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



  const getIconComponent = (iconName: string) => {
    const IconComponent = iconMap[iconName as keyof typeof iconMap]
    return IconComponent || Coffee
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            <Card className="border-green-200 bg-green-50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-green-800">Total Entradas</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-800">
                  {formatCurrency(stats?.totalEntradas || 0)}
                </div>
              </CardContent>
            </Card>

            <Card className="border-red-200 bg-red-50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-red-800">Total Saídas</CardTitle>
                <TrendingDown className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-800">
                  {formatCurrency(stats?.totalSaidas || 0)}
                </div>
              </CardContent>
            </Card>

            <Card className={`border-2 ${saldo >= 0 ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className={`text-sm font-medium ${saldo >= 0 ? 'text-green-800' : 'text-red-800'}`}>Saldo</CardTitle>
                <DollarSign className={`h-4 w-4 ${saldo >= 0 ? 'text-green-600' : 'text-red-600'}`} />
              </CardHeader>
              <CardContent>
              <div className={`text-2xl font-bold ${saldo >= 0 ? 'text-green-800' : 'text-red-800'}`}>{formatCurrency(saldo)}</div>
              </CardContent>
            </Card>
          </div>

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
                      <IconComponent className={`h-5 w-5 ${colorMap[category.color] || 'text-gray-600'}`} />
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
