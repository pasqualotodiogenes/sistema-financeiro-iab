"use client"

import { useState, useMemo, useCallback } from 'react'
import { useDebounce } from './use-debounce'

interface FilterConfig<T> {
  key: keyof T
  label: string
  type: 'text' | 'select' | 'date' | 'number' | 'boolean'
  options?: { value: any; label: string }[]
  transform?: (value: any) => any
}

interface UseFiltersOptions<T> {
  data: T[]
  filters: FilterConfig<T>[]
  debounceMs?: number
}

export function useFilters<T extends Record<string, any>>({ 
  data, 
  filters, 
  debounceMs = 300 
}: UseFiltersOptions<T>) {
  const [activeFilters, setActiveFilters] = useState<Record<string, any>>({})
  const debouncedFilters = useDebounce(activeFilters, debounceMs)

  const filteredData = useMemo(() => {
    if (!data || !Array.isArray(data)) return [];
    return data.filter(item => {
      return Object.entries(debouncedFilters).every(([key, value]) => {
        if (!value || value === '') return true

        const filterConfig = filters.find(f => f.key === key)
        if (!filterConfig) return true

        const itemValue = item[key]
        const filterValue = filterConfig.transform ? filterConfig.transform(value) : value

        switch (filterConfig.type) {
          case 'text':
            return String(itemValue).toLowerCase().includes(String(filterValue).toLowerCase())
          case 'select':
            return itemValue === filterValue
          case 'date':
            if (filterValue.start && filterValue.end) {
              const itemDate = new Date(itemValue)
              return itemDate >= new Date(filterValue.start) && itemDate <= new Date(filterValue.end)
            }
            return true
          case 'number':
            return Number(itemValue) === Number(filterValue)
          case 'boolean':
            return Boolean(itemValue) === Boolean(filterValue)
          default:
            return true
        }
      })
    })
  }, [data, debouncedFilters, filters])

  const setFilter = useCallback((key: keyof T, value: any) => {
    setActiveFilters(prev => ({
      ...prev,
      [key]: value
    }))
  }, [])

  const clearFilter = useCallback((key: keyof T) => {
    setActiveFilters(prev => {
      const newFilters = { ...prev }
      delete newFilters[key as string]
      return newFilters
    })
  }, [])

  const clearAllFilters = useCallback(() => {
    setActiveFilters({})
  }, [])

  const hasActiveFilters = Object.values(activeFilters).some(value => 
    value !== undefined && value !== null && value !== ''
  )

  return {
    filteredData,
    activeFilters,
    setFilter,
    clearFilter,
    clearAllFilters,
    hasActiveFilters,
    filters
  }
} 