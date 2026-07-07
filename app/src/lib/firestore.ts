import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
} from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { Trade, TradeInput, UserSettings, TradeChecklistItem } from "@/types"

const DEFAULT_PAGE_LIMIT = 50

function getUserTradesCollection(userId: string) {
  return collection(db, "users", userId, "trades")
}

function getUserSettingsDocRef(userId: string) {
  return doc(db, "users", userId, "settings", "app")
}

function timestampToString(value: unknown): string | undefined {
  if (value instanceof Timestamp) {
    return value.toDate().toISOString()
  }
  if (typeof value === "string") {
    return value
  }
  return undefined
}

export function normalizeTrade(id: string, data: Record<string, unknown>): Trade {
  return {
    ...(data as Record<string, unknown>),
    id,
    createdAt: timestampToString(data.createdAt) ?? (typeof data.createdAt === "string" ? data.createdAt : undefined),
    updatedAt: timestampToString(data.updatedAt) ?? (typeof data.updatedAt === "string" ? data.updatedAt : undefined),
  } as Trade
}

export function getDefaultChecklist(): TradeChecklistItem[] {
  return [
    { id: "confirmation", label: "Waited for confirmation", checked: false },
    { id: "risk-limit", label: "Risk below limit", checked: false },
    { id: "trend", label: "Trend followed", checked: false },
    { id: "news", label: "News checked", checked: false },
    { id: "entry-plan", label: "Entry according to plan", checked: false },
  ]
}

function deriveStatus(trade: TradeInput): Trade["status"] {
  if (trade.profitLoss === undefined || trade.profitLoss === 0) return "breakeven"
  return trade.profitLoss > 0 ? "win" : "loss"
}

export async function createTrade(userId: string, input: TradeInput): Promise<Trade> {
  const now = serverTimestamp()
  const status = input.status ?? deriveStatus(input)
  const data = {
    ...input,
    userId,
    status,
    checklist: input.checklist ?? getDefaultChecklist(),
    createdAt: now,
    updatedAt: now,
  }
  const docRef = await addDoc(getUserTradesCollection(userId), data)
  const snap = await getDoc(docRef)
  return normalizeTrade(docRef.id, snap.data() as Record<string, unknown>)
}

export async function updateTrade(
  userId: string,
  tradeId: string,
  input: TradeInput
): Promise<Trade> {
  const ref = doc(db, "users", userId, "trades", tradeId)
  const status = input.status ?? deriveStatus(input)
  const data = {
    ...input,
    status,
    updatedAt: serverTimestamp(),
  }
  await updateDoc(ref, data)
  const snap = await getDoc(ref)
  return normalizeTrade(tradeId, snap.data() as Record<string, unknown>)
}

export async function deleteTrade(userId: string, tradeId: string): Promise<void> {
  await deleteDoc(doc(db, "users", userId, "trades", tradeId))
}

export async function getTrade(userId: string, tradeId: string): Promise<Trade | null> {
  const snap = await getDoc(doc(db, "users", userId, "trades", tradeId))
  if (!snap.exists()) return null
  return normalizeTrade(snap.id, snap.data() as Record<string, unknown>)
}

export function subscribeToTrades(
  userId: string,
  callback: (trades: Trade[]) => void,
  onError?: (error: Error) => void,
  limit = DEFAULT_PAGE_LIMIT,
  lastVisible?: unknown
): () => void {
  const baseQuery = query(
    getUserTradesCollection(userId),
    orderBy("createdAt", "desc")
  )

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const finalQuery = lastVisible ? (baseQuery as any) : baseQuery

  return onSnapshot(
    finalQuery,
    (snapshot) => {
      const trades = snapshot.docs.map((d) => normalizeTrade(d.id, d.data() as Record<string, unknown>))
      callback(trades)
    },
    (error) => {
      onError?.(error)
    }
  )
}

export async function fetchTrades(userId: string): Promise<Trade[]> {
  const snapshot = await getDocs(
    query(getUserTradesCollection(userId), orderBy("createdAt", "desc"))
  )
  return snapshot.docs.map((d) => normalizeTrade(d.id, d.data() as Record<string, unknown>))
}

export async function duplicateTrade(userId: string, tradeId: string): Promise<Trade> {
  const original = await getTrade(userId, tradeId)
  if (!original) throw new Error("Trade not found")
  const { id, createdAt, updatedAt, ...rest } = original
  const data: TradeInput = {
    ...rest,
    notes: rest.notes ? `${rest.notes}\n\n(Duplicated from trade ${id})` : `(Duplicated from trade ${id})`,
    favorite: false,
    pinned: false,
    archived: false,
  }
  return createTrade(userId, data)
}

export async function updateTradeFlags(
  userId: string,
  tradeId: string,
  flags: { favorite?: boolean; pinned?: boolean; archived?: boolean }
): Promise<void> {
  const ref = doc(db, "users", userId, "trades", tradeId)
  await updateDoc(ref, { ...flags, updatedAt: serverTimestamp() })
}

export async function getUserSettings(userId: string): Promise<UserSettings | null> {
  const snap = await getDoc(getUserSettingsDocRef(userId))
  if (!snap.exists()) return null
  return snap.data() as UserSettings
}

export async function saveUserSettings(userId: string, settings: UserSettings): Promise<void> {
  await setDoc(getUserSettingsDocRef(userId), settings, { merge: true })
}
