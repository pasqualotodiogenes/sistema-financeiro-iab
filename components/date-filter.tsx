"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, Filter } from "lucide-react"

interface DateFilterProps {
  onFilterChange: (year: number | null, month: number | null) => void
  className?: string
}

const months = [
  { value: 1, label: "Janeiro" },
  { value: 2, label: "Fevereiro" },
  { value: 3, label: "Março" },
  { value: 4, label: "Abril" },
  { value: 5, label: "Maio" },
  { value: 6, label: "Junho" },
  { value: 7, label: "Julho" },
  { value: 8, label: "Agosto" },
  { value: 9, label: "Setembro" },
  { value: 10, label: "Outubro" },
  { value: 11, label: "Novembro" },
  { value: 12, label: "Dezembro" },
]

export function DateFilter({ onFilterChange, className = "" }: DateFilterProps) {
  const [selectedYear, setSelectedYear] = useState<string>("")
  const [selectedMonth, setSelectedMonth] = useState<string>("")

  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i)

  const handleYearChange = (year: string) => {
    setSelectedYear(year)
    const yearNum = year ? Number.parseInt(year) : null
    const monthNum = selectedMonth ? Number.parseInt(selectedMonth) : null
    onFilterChange(yearNum, monthNum)
  }

  const handleMonthChange = (month: string) => {
    setSelectedMonth(month)
    const yearNum = selectedYear ? Number.parseInt(selectedYear) : null
    const monthNum = month ? Number.parseInt(month) : null
    onFilterChange(yearNum, monthNum)
  }

  const clearFilters = () => {
    setSelectedYear("")
    setSelectedMonth("")
    onFilterChange(null, null)
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex items-center gap-2 text-sm text-primary-600">
        <Calendar className="w-4 h-4" />
        <span>Filtrar por período:</span>
      </div>

      <Select value={selectedYear} onValueChange={handleYearChange}>
        <SelectTrigger className="w-32 border-cream-300">
          <SelectValue placeholder="Ano" />
        </SelectTrigger>
        <SelectContent>
          {years.map((year) => (
            <SelectItem key={year} value={year.toString()}>
              {year}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={selectedMonth} onValueChange={handleMonthChange} disabled={!selectedYear}>
        <SelectTrigger className="w-36 border-cream-300">
          <SelectValue placeholder="Mês" />
        </SelectTrigger>
        <SelectContent>
          {months.map((month) => (
            <SelectItem key={month.value} value={month.value.toString()}>
              {month.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {(selectedYear || selectedMonth) && (
        <Button
          variant="outline"
          size="sm"
          onClick={clearFilters}
          className="border-cream-300 text-primary-700 hover:bg-cream-50 bg-transparent"
        >
          <Filter className="w-4 h-4 mr-1" />
          Limpar
        </Button>
      )}
    </div>
  )
}
