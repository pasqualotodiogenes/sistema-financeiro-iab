"use client"

import { useState, useEffect } from 'react'
import { useApi } from './use-api'
import { usePermissions } from './use-permissions'

interface UseDataOptions {
  autoLoad?: boolean
  showToast?: boolean
  filterByCategory?: boolean
}

export function useData<T = any>(endpoint: string, options: UseDataOptions = {}) {
  const { autoLoad = true, showToast = false, filterByCategory = false } = options
  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { get, post, put, delete: del } = useApi()
  const { getAccessibleCategories } = usePermissions()

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await get<T[]>(endpoint, showToast)
      if (response.success && response.data) {
        let processedData = response.data
        
        // Filtrar por categoria se necessário (só aplicar se T for Category)
        if (filterByCategory && endpoint.includes('categories')) {
          const accessibleCategories = getAccessibleCategories(processedData as any)
          processedData = accessibleCategories as T[]
        }
        
        setData(processedData)
      } else {
        setError(response.error || 'Erro ao carregar dados')
      }
    } catch (error) {
      setError('Erro de conexão')
    } finally {
      setLoading(false)
    }
  }

  const createItem = async (item: Partial<T>) => {
    try {
      setLoading(true)
      const response = await post<T>(endpoint, item, true)
      if (response.success) {
        await loadData() // Recarregar dados
        return { success: true, data: response.data }
      } else {
        return { success: false, error: response.error }
      }
    } catch (error) {
      return { success: false, error: 'Erro ao criar item' }
    } finally {
      setLoading(false)
    }
  }

  const updateItem = async (id: string, item: Partial<T>) => {
    try {
      setLoading(true)
      const response = await put<T>(`${endpoint}/${id}`, item, true)
      if (response.success) {
        await loadData() // Recarregar dados
        return { success: true, data: response.data }
      } else {
        return { success: false, error: response.error }
      }
    } catch (error) {
      return { success: false, error: 'Erro ao atualizar item' }
    } finally {
      setLoading(false)
    }
  }

  const deleteItem = async (id: string) => {
    try {
      setLoading(true)
      const response = await del(`${endpoint}/${id}`, true)
      if (response.success) {
        await loadData() // Recarregar dados
        return { success: true }
      } else {
        return { success: false, error: response.error }
      }
    } catch (error) {
      return { success: false, error: 'Erro ao excluir item' }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (autoLoad) {
      loadData()
    }
  }, [endpoint, autoLoad])

  return {
    data,
    loading,
    error,
    loadData,
    createItem,
    updateItem,
    deleteItem,
    refresh: loadData
  }
} 