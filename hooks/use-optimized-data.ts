"use client"

import { useState, useEffect, useCallback } from 'react'
import { useApi } from './use-api'
import { useCache } from './use-cache'
import { usePermissions } from './use-permissions'

interface UseOptimizedDataOptions<T> {
  endpoint: string
  cacheKey?: string
  ttl?: number
  autoLoad?: boolean
  showToast?: boolean
  filterByCategory?: boolean
  transform?: (data: T[]) => T[]
}

export function useOptimizedData<T = any>(options: UseOptimizedDataOptions<T>) {
  const {
    endpoint,
    cacheKey,
    ttl = 5 * 60 * 1000, // 5 minutos
    autoLoad = true,
    showToast = false,
    filterByCategory = false,
    transform
  } = options

  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  
  const { get, post, put, delete: del } = useApi()
  const { getAccessibleCategories } = usePermissions()
  const { get: getCache, set: setCache, invalidate: invalidateCache, has: hasCache } = useCache<T[]>({ ttl })

  const cacheKeyFinal = cacheKey || `data-${endpoint}`

  const loadData = useCallback(async (forceRefresh = false) => {
    try {
      setLoading(true)
      setError(null)

      // Verificar cache primeiro
      if (!forceRefresh && hasCache(cacheKeyFinal)) {
        const cachedData = getCache(cacheKeyFinal)
        if (cachedData) {
          let processedData = cachedData
          
          if (filterByCategory && endpoint.includes('categories')) {
            processedData = getAccessibleCategories(processedData as any) as T[]
          }
          
          if (transform) {
            processedData = transform(processedData)
          }
          
          setData(processedData)
          setLastUpdated(new Date())
          setLoading(false)
          return
        }
      }

      // Buscar dados da API
      const response = await get<T[]>(endpoint, showToast)
      if (response.success && response.data) {
        let processedData = response.data
        
        if (filterByCategory && endpoint.includes('categories')) {
          processedData = getAccessibleCategories(processedData as any) as T[]
        }
        
        if (transform) {
          processedData = transform(processedData)
        }

        // Salvar no cache
        setCache(cacheKeyFinal, response.data)
        
        setData(processedData)
        setLastUpdated(new Date())
      } else {
        setError(response.error || 'Erro ao carregar dados')
      }
    } catch (error) {
      setError('Erro de conexão')
    } finally {
      setLoading(false)
    }
  }, [endpoint, cacheKeyFinal, filterByCategory, transform, get, setCache, getCache, hasCache, getAccessibleCategories, showToast])

  const createItem = useCallback(async (item: Partial<T>) => {
    try {
      setLoading(true)
      const response = await post<T>(endpoint, item, true)
      if (response.success) {
        // Invalidar cache e recarregar
        invalidateCache(cacheKeyFinal)
        await loadData(true)
        return { success: true, data: response.data }
      } else {
        return { success: false, error: response.error }
      }
    } catch (error) {
      return { success: false, error: 'Erro ao criar item' }
    } finally {
      setLoading(false)
    }
  }, [endpoint, post, invalidateCache, cacheKeyFinal, loadData])

  const updateItem = useCallback(async (id: string, item: Partial<T>) => {
    try {
      setLoading(true)
      const response = await put<T>(`${endpoint}/${id}`, item, true)
      if (response.success) {
        // Invalidar cache e recarregar
        invalidateCache(cacheKeyFinal)
        await loadData(true)
        return { success: true, data: response.data }
      } else {
        return { success: false, error: response.error }
      }
    } catch (error) {
      return { success: false, error: 'Erro ao atualizar item' }
    } finally {
      setLoading(false)
    }
  }, [endpoint, put, invalidateCache, cacheKeyFinal, loadData])

  const deleteItem = useCallback(async (id: string) => {
    try {
      setLoading(true)
      const response = await del(`${endpoint}/${id}`, true)
      if (response.success) {
        // Invalidar cache e recarregar
        invalidateCache(cacheKeyFinal)
        await loadData(true)
        return { success: true }
      } else {
        return { success: false, error: response.error }
      }
    } catch (error) {
      return { success: false, error: 'Erro ao excluir item' }
    } finally {
      setLoading(false)
    }
  }, [endpoint, del, invalidateCache, cacheKeyFinal, loadData])

  const refresh = useCallback(() => {
    return loadData(true)
  }, [loadData])

  useEffect(() => {
    if (autoLoad) {
      loadData()
    }
  }, [autoLoad, loadData])

  return {
    data,
    loading,
    error,
    lastUpdated,
    loadData,
    createItem,
    updateItem,
    deleteItem,
    refresh,
    // Utilitários de cache
    invalidateCache: () => invalidateCache(cacheKeyFinal),
    hasCachedData: () => hasCache(cacheKeyFinal)
  }
} 