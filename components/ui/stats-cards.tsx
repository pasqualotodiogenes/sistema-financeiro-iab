"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface StatsCardsProps {
  totalEntradas: number;
  totalSaidas: number;
  saldo?: number;
  className?: string;
}

export function StatsCards({ totalEntradas, totalSaidas, saldo, className = "" }: StatsCardsProps) {
  const calculatedSaldo = saldo ?? (totalEntradas - totalSaidas);
  
  return (
    <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 ${className}`}>
      {/* Total Entradas */}
      <Card className="border-green-200 bg-green-50 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-green-800">Total Entradas</CardTitle>
          <TrendingUp className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {formatCurrency(totalEntradas)}
          </div>
        </CardContent>
      </Card>

      {/* Total Saídas */}
      <Card className="border-red-200 bg-red-50 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-red-800">Total Saídas</CardTitle>
          <TrendingDown className="h-4 w-4 text-red-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">
            {formatCurrency(totalSaidas)}
          </div>
        </CardContent>
      </Card>

      {/* Saldo */}
      <Card className={`shadow-sm ${calculatedSaldo >= 0 ? 'border-primary-200 bg-primary-50' : 'border-red-200 bg-red-50'}`}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className={`text-sm font-medium ${calculatedSaldo >= 0 ? 'text-primary-800' : 'text-red-800'}`}>
            Saldo
          </CardTitle>
          <DollarSign className={`h-4 w-4 ${calculatedSaldo >= 0 ? 'text-primary-600' : 'text-red-600'}`} />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${calculatedSaldo >= 0 ? 'text-primary-600' : 'text-red-600'}`}>
            {formatCurrency(calculatedSaldo)}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}