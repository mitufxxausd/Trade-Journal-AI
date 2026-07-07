import { useEffect, useState, useCallback } from "react"
import { fetchFilteredTrades, subscribeToTrades } from "@/lib/firestore"
import type { Trade, TradeFilters, TradeSort } from "@/types/trade"

interface UseTradesOptions {
  userId: string | undefined
  filters?: Partial<TradeFilters>
  sort?: TradeSort
  enabled?: boolean
}

export function useTrades({ userId, filters, sort, enabled = true }: UseTradesOptions) {
  const [trades, setTrades] = useState<Trade[]>([])
  const [allTrades, setAllTrades] = useState<Trade[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const effectiveSort = sort || { field: "createdAt", direction: "desc" as const }

  const refresh = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    setError(null)
    try {
      const items = await fetchFilteredTrades(userId, filters || {})
      setAllTrades(items)

      const sorted = [...items].sort((a, b) => {
        const dir = effectiveSort.direction === "asc" ? 1 : -1
        switch (effectiveSort.field) {
          case "tradeDate":
            return dir * (a.tradeDate || "").localeCompare(b.tradeDate || "")
          case "profit":
            return dir * ((a.profitLoss || 0) - (b.profitLoss || 0))
          case "rr":
            return dir * ((a.rrRatio || 0) - (b.rrRatio || 0))
          case "createdAt":
          default:
            return dir * (a.createdAt || "").localeCompare(b.createdAt || "")
        }
      })

      setTrades(sorted)
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to load trades"))
    } finally {
      setLoading(false)
    }
  }, [userId, JSON.stringify(filters), effectiveSort.field, effectiveSort.direction])

  useEffect(() => {
    if (!userId || !enabled) {
      setTrades([])
      setAllTrades([])
      setLoading(false)
      return
    }

    setLoading(true)
    refresh()

    const unsubscribe = subscribeToTrades(
      userId,
      (items) => {
        let filtered = [...items]

        if (filters) {
          if (filters.search) {
            const search = filters.search.toLowerCase()
            filtered = filtered.filter(
              (t) =>
                t.pair.toLowerCase().includes(search) ||
                (t.strategy || "").toLowerCase().includes(search) ||
                (t.broker || "").toLowerCase().includes(search) ||
                (t.notes || "").toLowerCase().includes(search) ||
                t.tags.some((tag: string) => tag.toLowerCase().includes(search))
            )
          }
          if (filters.market && filters.market !== "all") {
            filtered = filtered.filter((t) => t.market === filters.market)
          }
          if (filters.direction && filters.direction !== "all") {
            filtered = filtered.filter((t) => t.direction === filters.direction)
          }
          if (filters.status && filters.status !== "all") {
            filtered = filtered.filter((t) => t.status === filters.status)
          }
          if (filters.session && filters.session !== "all") {
            filtered = filtered.filter((t) => t.session === filters.session)
          }
          if (filters.archived !== null && filters.archived !== undefined) {
            filtered = filtered.filter((t) => t.isArchived === filters.archived)
          } else {
            filtered = filtered.filter((t) => !t.isArchived)
          }
        } else {
          filtered = filtered.filter((t) => !t.isArchived)
        }

        const sorted = filtered.sort((a, b) => {
          const dir = effectiveSort.direction === "asc" ? 1 : -1
          switch (effectiveSort.field) {
            case "tradeDate":
              return dir * (a.tradeDate || "").localeCompare(b.tradeDate || "")
            case "profit":
              return dir * ((a.profitLoss || 0) - (b.profitLoss || 0))
            case "rr":
              return dir * ((a.rrRatio || 0) - (b.rrRatio || 0))
            case "createdAt":
            default:
              return dir * (a.createdAt || "").localeCompare(b.createdAt || "")
          }
        })

        setTrades(sorted)
        setAllTrades(items)
        setLoading(false)
        setError(null)
      },
      (err) => {
        setError(err)
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [userId, enabled, JSON.stringify(filters), effectiveSort.field, effectiveSort.direction])

  return { trades, allTrades, loading, error, refresh }
}
