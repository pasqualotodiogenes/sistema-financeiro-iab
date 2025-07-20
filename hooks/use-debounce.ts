"use client"

import { useState, useEffect } from 'react'

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

export function useThrottle<T>(value: T, delay: number): T {
  const [throttledValue, setThrottledValue] = useState<T>(value)
  const [lastRun, setLastRun] = useState<number>(Date.now())

  useEffect(() => {
    const handler = setTimeout(() => {
      setThrottledValue(value)
      setLastRun(Date.now())
    }, delay - (Date.now() - lastRun))

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay, lastRun])

  return throttledValue
} 