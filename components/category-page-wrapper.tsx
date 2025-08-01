"use client"

import React from "react"
import CategoryDashboard from "@/components/category-dashboard"
import { useCategoryBySlug } from "@/hooks/use-category-by-slug"
import { Loader2 } from "lucide-react"

interface CategoryPageWrapperProps {
  slug: string;
}

export default function CategoryPageWrapper({ slug }: CategoryPageWrapperProps) {
  const { category, loading, error } = useCategoryBySlug(slug);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600 mx-auto mb-4" />
          <p className="text-primary-600">Carregando categoria...</p>
        </div>
      </div>
    );
  }

  if (error || !category) {
    return (
      <div className="p-8 text-center">
        <div className="text-red-600 text-lg mb-2">
          {error || "Categoria não encontrada"}
        </div>
        <p className="text-gray-500">
          Verifique se a categoria existe ou tente novamente.
        </p>
      </div>
    );
  }

  return (
    <CategoryDashboard
      categorySlug={category.id}
      categoryName={category.name}
      color={category.color}
      description={category.description}
    />
  );
}