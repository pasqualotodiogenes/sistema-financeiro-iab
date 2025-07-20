import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value)
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString("pt-BR")
}

export function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

export function filterMovementsByDate<T extends { date: string }>(movements: T[], selectedYear?: number, selectedMonth?: number): T[] {
  if (!selectedYear && !selectedMonth) return movements
  return movements.filter((m) => {
    const movementDate = new Date(m.date)
    const movementYear = movementDate.getFullYear()
    const movementMonth = movementDate.getMonth() + 1
    if (selectedYear && selectedMonth) return movementYear === selectedYear && movementMonth === selectedMonth
    else if (selectedYear) return movementYear === selectedYear
    return true
  })
}
