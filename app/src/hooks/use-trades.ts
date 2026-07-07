import { useEffect, useState, useCallback } from "react"
import { fetchTrades, subscribeToTrades } from "@/lib/firestore"
import type { Trade } from "@/types"

export function useTrades(userId: string | undefined) {
  const [trades, setTrades] = useState<Trade[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const refresh = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    setError(null)
    try {
      const items = await fetchTrades(userId)
      setTrades(items)
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to load trades"))
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    if (!userId) {
      setTrades([])
      setLoading(false)
      return
    }
    setLoading(true)
    const unsubscribe = subscribeToTrades(
      userId,
      (items) => {
        setTrades(items)
        setLoading(false)
        setError(null)
      },
      (err) => {
        setError(err)
        setLoading(false)
      }
    )
    return () => unsubscribe()
  }, [userId])

  return { trades, loading, error, refresh }
}
