"use client"

import React from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"
import { getIconComponent } from "@/lib/icons-colors"

interface CategoryData {
  id: string;
  name: string;
  icon: string;
  color: string;
  totalEntradas: number;
  totalSaidas: number;
  movementsCount: number;
  slug: string;
}

interface CategoryCardProps {
  category: CategoryData;
}

// Memoized component for category cards - critical for performance when dashboard has many categories
const CategoryCard = React.memo(function CategoryCard({ category }: CategoryCardProps) {
  
  // Memoized icon component resolution
  const IconComponent = React.useMemo(() => {
    return getIconComponent(category.icon);
  }, [category.icon]);

  // Memoized category balance calculation
  const categorySaldo = React.useMemo(() => {
    return category.totalEntradas - category.totalSaidas;
  }, [category.totalEntradas, category.totalSaidas]);

  // Memoized formatted amounts
  const formattedEntradas = React.useMemo(() => {
    return formatCurrency(category.totalEntradas);
  }, [category.totalEntradas]);

  const formattedSaidas = React.useMemo(() => {
    return formatCurrency(category.totalSaidas);
  }, [category.totalSaidas]);

  const formattedSaldo = React.useMemo(() => {
    return formatCurrency(categorySaldo);
  }, [categorySaldo]);

  // Memoized saldo color classes
  const saldoColorClasses = React.useMemo(() => {
    return categorySaldo >= 0 ? 'text-green-800' : 'text-red-800';
  }, [categorySaldo]);

  // Memoized movement text (singular/plural)
  const movementText = React.useMemo(() => {
    return `${category.movementsCount} movimentaç${category.movementsCount !== 1 ? 'ões' : 'ão'}`;
  }, [category.movementsCount]);

  return (
    <Link 
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
              <span className="font-medium">{formattedEntradas}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-red-600">Saídas:</span>
              <span className="font-medium">{formattedSaidas}</span>
            </div>
            <div className="flex justify-between text-sm border-t pt-2">
              <span className={`font-bold ${saldoColorClasses}`}>Saldo:</span>
              <span className={`font-bold ${saldoColorClasses}`}>{formattedSaldo}</span>
            </div>
            <div className="text-xs text-gray-500 text-center">
              {movementText}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
});

export default CategoryCard;