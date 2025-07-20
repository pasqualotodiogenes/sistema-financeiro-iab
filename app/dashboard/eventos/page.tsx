"use client"

import { useEffect, useState } from "react"
import CategoryDashboard from "@/components/category-dashboard"

const slug = "eventos"

// Tipagem explícita para category
type CategoryType = { id: string; name: string; color: string; description: string }

export default function EventosPage() {
  const [category, setCategory] = useState<CategoryType | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchCategory = async () => {
      try {
        const res = await fetch(`/api/categories/slug/${slug}`)
        if (res.ok) {
          setCategory(await res.json())
    } else {
          setError("Categoria não encontrada")
        }
      } catch {
        setError("Erro ao carregar categoria")
      } finally {
        setLoading(false)
      }
    }
    fetchCategory()
  }, [])

  if (loading) return <div className="p-8">Carregando...</div>
  if (error || !category) return <div className="p-8 text-red-600">{error}</div>

  return (
    <CategoryDashboard
      categorySlug={category.id}
      categoryName={category.name}
      color={category.color}
      description={category.description}
    />
  )
}
