"use client"

import { useRouter, useParams } from "next/navigation"
import CategoryDashboard from '@/components/category-dashboard'
import { useCategories } from '@/components/ui/categories-context'
import { LoadingState } from '@/components/loading-states'
import Church404 from '@/components/Church404'
import { getIconComponent } from '@/lib/icons-colors'

export default function CategoryPage() {
  const params = useParams()
  const router = useRouter()
  const categorySlug = params?.slug as string
  const { categories, loading } = useCategories()

  // Lógica direta no render - sem estado derivado
  if (loading) {
    return (
      <LoadingState loading={true} error={null}>
        <></>
      </LoadingState>
    )
  }

  // Validar slug
  if (!categorySlug || categorySlug === 'null' || categorySlug === 'undefined') {
    return (
      <Church404 
        message="Categoria não encontrada." 
        onRetry={() => router.push("/dashboard")} 
      />
    )
  }

  // Encontrar categoria pelo slug
  const category = categories.find((cat) => cat.slug === categorySlug)

  if (!category) {
    return (
      <Church404 
        message="Categoria não encontrada ou você não tem permissão para acessá-la." 
        onRetry={() => router.push("/dashboard")} 
      />
    )
  }

  // Obter componente do ícone
  const IconComponent = getIconComponent(category.icon)

  return (
    <CategoryDashboard
      categorySlug={category.slug}
      categoryName={category.name}
      icon={<IconComponent className="w-5 h-5 text-gray-600" />}
      color={category.color}
      description={category.description}
    />
  )
} 