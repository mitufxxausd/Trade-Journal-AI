export type TradeStatus = "win" | "loss" | "breakeven"
export type TradeDirection = "buy" | "sell"
export type TradeType = "long" | "short"
export type MarketType = "forex" | "crypto" | "stocks" | "futures" | "options"

export interface Screenshot {
  id: string
  url: string
  name: string
  createdAt: string
}

export interface TradePsychology {
  before: {
    confidence: number
    stressLevel: number
    emotion: string
    focusLevel: number
    sleepQuality: number
  }
  during: {
    fear: number
    greed: number
    patience: number
    discipline: number
  }
  after: {
    emotion: string
    mistakes: string
    lessons: string
  }
}

export interface TradeChecklistItem {
  id: string
  label: string
  checked: boolean
}

export interface Trade {
  id: string
  userId: string

  // Legacy dashboard compatibility fields
  symbol?: string
  type?: TradeType
  date?: string
  profit?: number
  pips?: number
  screenshot?: string

  // Core identifiers
  pair: string
  market: MarketType
  direction: TradeDirection

  // Trade plan
  broker?: string
  account?: string
  strategy?: string
  setupName?: string
  timeframe?: string

  // Pricing & sizing
  entryPrice: number
  exitPrice?: number
  stopLoss?: number
  takeProfit?: number
  positionSize?: number
  riskPercent?: number
  rrRatio?: number
  commission?: number
  swap?: number
  profitLoss: number
  currency?: string

  // Timing
  tradeDate: string
  entryTime?: string
  exitTime?: string
  session?: string

  // Content
  notes?: string
  journalNotes?: string
  tags?: string[]
  screenshots?: Screenshot[]

  // Psychology & checklist
  psychology?: TradePsychology
  checklist?: TradeChecklistItem[]

  // Management flags
  favorite?: boolean
  pinned?: boolean
  archived?: boolean

  status: TradeStatus

  createdAt?: string
  updatedAt?: string
}

export interface TradeInput {
  pair?: string
  market?: MarketType
  direction?: TradeDirection
  broker?: string
  account?: string
  strategy?: string
  setupName?: string
  timeframe?: string
  entryPrice?: number
  exitPrice?: number
  stopLoss?: number
  takeProfit?: number
  positionSize?: number
  riskPercent?: number
  rrRatio?: number
  commission?: number
  swap?: number
  profitLoss?: number
  currency?: string
  tradeDate?: string
  entryTime?: string
  exitTime?: string
  session?: string
  notes?: string
  journalNotes?: string
  tags?: string[]
  screenshots?: Screenshot[]
  psychology?: TradePsychology
  checklist?: TradeChecklistItem[]
  favorite?: boolean
  pinned?: boolean
  archived?: boolean
  status?: TradeStatus
}

export interface UserSettings {
  defaultCurrency?: string
  defaultMarket?: MarketType
  defaultSession?: string
  defaultTags?: string[]
  defaultChecklist?: TradeChecklistItem[]
}

export interface JournalEntry {
  id: string
  title: string
  content: string
  date: string
  mood: string
  tags: string[]
}

export interface AIReview {
  id: string
  tradeId: string
  feedback: string
  strengths: string[]
  weaknesses: string[]
  suggestions: string[]
  date: string
}

export interface DashboardStats {
  totalTrades: number
  winningTrades: number
  losingTrades: number
  winRate: number
  profitFactor: number
  averageRR: number
  netProfit: number
  currentBalance: number
  largestWin: number
  largestLoss: number
}

export interface MonthlyData {
  month: string
  profit: number
  trades: number
}

export interface WeeklyData {
  week: string
  profit: number
  trades: number
}

export interface DailyData {
  day: string
  profit: number
  trades: number
}

export interface EquityPoint {
  date: string
  balance: number
}

export interface StrategyPerformance {
  strategy: string
  wins: number
  losses: number
  profit: number
}

export interface SessionPerformance {
  session: string
  wins: number
  losses: number
  profit: number
}

export interface TradingGoal {
  id: string
  title: string
  target: number
  current: number
  deadline: string
}

export interface CalendarDay {
  date: string
  profit: number
  trades: number
}

// Trade filter and sort helpers

export interface TradeFilters {
  query?: string
  dateRange?: { from?: Date; to?: Date }
  status?: TradeStatus[]
  strategy?: string[]
  market?: MarketType[]
  session?: string[]
  emotion?: string[]
  confidence?: number[]
  tags?: string[]
  minRisk?: number
  maxRisk?: number
  minProfit?: number
  maxProfit?: number
}

export type TradeSortOption =
  | "newest"
  | "oldest"
  | "highestProfit"
  | "lowestProfit"
  | "highestRR"
  | "lowestRR"
  | "mostRecent"

export interface TradeFiltersState extends TradeFilters {
  sortBy: TradeSortOption
  page: number
  limit: number
}
