import { useState, useEffect, useCallback, useRef } from 'react'

export function useData(fetcher, deps = [], pollMs = 30000) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)
  const mountedRef = useRef(true)

  const load = useCallback(async () => {
    try {
      const result = await fetcher()
      if (mountedRef.current) {
        setData(result)
        setError(null)
        setLastUpdated(new Date())
      }
    } catch (e) {
      if (mountedRef.current) setError(e.message)
    } finally {
      if (mountedRef.current) setLoading(false)
    }
  }, deps)

  useEffect(() => {
    mountedRef.current = true
    setLoading(true)
    load()
    const interval = setInterval(load, pollMs)
    return () => {
      mountedRef.current = false
      clearInterval(interval)
    }
  }, [load])

  return { data, loading, error, refetch: load, lastUpdated }
}
