import { useEffect, useState, useMemo } from "react";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { db, query, collection, where, orderBy, getDocs, auth } from "@/lib/firebase";
import type { Trade } from "@/types/trade";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, Legend,
} from "recharts";

export default function Analytics() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrades = async () => {
      try {
        const currentUser = auth.currentUser;
        if (!currentUser) return;
        const q = query(
          collection(db, "trades"),
          where("userId", "==", currentUser.uid),
          orderBy("tradeDate", "desc")
        );
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Trade));
        setTrades(data);
      } catch {
        // Handle silently
      } finally {
        setLoading(false);
      }
    };
    fetchTrades();
  }, []);

  const stats = useMemo(() => {
    const closed = trades.filter((t) => t.status !== "open");
    const wins = closed.filter((t) => (t.profitLoss || 0) > 0);
    const losses = closed.filter((t) => (t.profitLoss || 0) < 0);
    const totalProfit = wins.reduce((s, t) => s + (t.profitLoss || 0), 0);
    const totalLoss = Math.abs(losses.reduce((s, t) => s + (t.profitLoss || 0), 0));
    return { totalTrades: trades.length, winRate: closed.length ? (wins.length / closed.length) * 100 : 0, netPnl: totalProfit - totalLoss, profitFactor: totalLoss > 0 ? totalProfit / totalLoss : 0, avgWin: wins.length ? totalProfit / wins.length : 0, avgLoss: losses.length ? totalLoss / losses.length : 0, wins: wins.length, losses: losses.length };
  }, [trades]);

  const monthlyData = useMemo(() => {
    const grouped: Record<string, { profit: number; trades: number; wins: number }> = {};
    for (const t of trades) {
      const m = t.tradeDate.substring(0, 7);
      if (!grouped[m]) grouped[m] = { profit: 0, trades: 0, wins: 0 };
      grouped[m].profit += t.profitLoss || 0;
      grouped[m].trades++;
      if ((t.profitLoss || 0) > 0) grouped[m].wins++;
    }
    return Object.entries(grouped).map(([m, d]) => ({ month: m, ...d })).sort((a, b) => a.month.localeCompare(b.month));
  }, [trades]);

  const equityCurve = useMemo(() => {
    let running = 0;
    return trades
      .filter((t) => t.status !== "open")
      .sort((a, b) => new Date(a.tradeDate).getTime() - new Date(b.tradeDate).getTime())
      .map((t) => {
        running += t.profitLoss || 0;
        return { date: t.tradeDate, equity: running };
      });
  }, [trades]);

  const marketDist = useMemo(() => {
    const g: Record<string, number> = {};
    for (const t of trades) { g[t.market] = (g[t.market] || 0) + 1; }
    return Object.entries(g).map(([name, value]) => ({ name, value }));
  }, [trades]);

  const sessionData = useMemo(() => {
    const g: Record<string, { trades: number; profit: number }> = {};
    for (const t of trades) {
      if (!g[t.session]) g[t.session] = { trades: 0, profit: 0 };
      g[t.session].trades++;
      g[t.session].profit += t.profitLoss || 0;
    }
    return Object.entries(g).map(([session, d]) => ({ session, ...d }));
  }, [trades]);

  const dayData = useMemo(() => {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const g: Record<string, { trades: number; profit: number }> = {};
    for (const day of days) g[day] = { trades: 0, profit: 0 };
    for (const t of trades) {
      const day = days[new Date(t.tradeDate).getDay()];
      g[day].trades++;
      g[day].profit += t.profitLoss || 0;
    }
    return Object.entries(g).map(([day, d]) => ({ day, ...d }));
  }, [trades]);

  const COLORS = ["#22c55e", "#ef4444", "#3b82f6", "#f59e0b", "#8b5cf6"];

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground">Deep insights into your trading performance</p>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}><CardContent className="pt-6"><Skeleton className="h-8 w-24" /></CardContent></Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Total Trades</p><p className="text-2xl font-bold">{stats.totalTrades}</p></CardContent></Card>
            <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Win Rate</p><p className="text-2xl font-bold">{stats.winRate.toFixed(1)}%</p></CardContent></Card>
            <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Net P&L</p><p className={`text-2xl font-bold ${stats.netPnl >= 0 ? "text-green-600" : "text-red-600"}`}>${stats.netPnl.toFixed(0)}</p></CardContent></Card>
            <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Profit Factor</p><p className="text-2xl font-bold">{stats.profitFactor.toFixed(2)}</p></CardContent></Card>
          </div>
        )}

        <Tabs defaultValue="equity" className="space-y-4">
          <TabsList className="flex flex-wrap h-auto">
            <TabsTrigger value="equity">Equity Curve</TabsTrigger>
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
            <TabsTrigger value="markets">Markets</TabsTrigger>
            <TabsTrigger value="sessions">Sessions</TabsTrigger>
            <TabsTrigger value="days">Day of Week</TabsTrigger>
          </TabsList>

          <TabsContent value="equity">
            <Card>
              <CardHeader><CardTitle>Equity Curve</CardTitle><CardDescription>Cumulative P&L over time</CardDescription></CardHeader>
              <CardContent>
                {equityCurve.length > 0 ? (
                  <ResponsiveContainer width="100%" height={350}>
                    <AreaChart data={equityCurve}>
                      <defs><linearGradient id="eqGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/><stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/></linearGradient></defs>
                      <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="date" tickFormatter={(v) => v.slice(5)} /><YAxis />
                      <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} formatter={(v: number) => [`$${v.toFixed(2)}`, "Equity"]} />
                      <Area type="monotone" dataKey="equity" stroke="#3b82f6" fill="url(#eqGrad)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : <div className="flex items-center justify-center h-[350px] text-muted-foreground">No data available</div>}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="monthly">
            <Card>
              <CardHeader><CardTitle>Monthly Performance</CardTitle></CardHeader>
              <CardContent>
                {monthlyData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="month" tickFormatter={(v) => v.slice(5)} /><YAxis />
                      <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} formatter={(v: number, n: string) => [n === "profit" ? `$${v.toFixed(2)}` : v, n === "profit" ? "Profit" : "Trades"]} />
                      <Legend /><Bar dataKey="profit" fill="#22c55e" radius={[4,4,0,0]} /><Bar dataKey="trades" fill="#3b82f6" radius={[4,4,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : <div className="flex items-center justify-center h-[350px] text-muted-foreground">No data available</div>}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="markets">
            <Card>
              <CardHeader><CardTitle>Market Distribution</CardTitle></CardHeader>
              <CardContent className="flex justify-center">
                {marketDist.length > 0 ? (
                  <ResponsiveContainer width="100%" height={350}>
                    <PieChart>
                      <Pie data={marketDist} cx="50%" cy="50%" outerRadius={120} dataKey="value" label>
                        {marketDist.map((_, i) => <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : <div className="flex items-center justify-center h-[350px] text-muted-foreground">No data available</div>}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sessions">
            <Card>
              <CardHeader><CardTitle>Session Performance</CardTitle></CardHeader>
              <CardContent>
                {sessionData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={sessionData}>
                      <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="session" /><YAxis />
                      <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} formatter={(v: number) => [`$${v.toFixed(2)}`, "Profit"]} />
                      <Bar dataKey="profit" fill="#8b5cf6" radius={[4,4,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : <div className="flex items-center justify-center h-[350px] text-muted-foreground">No data available</div>}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="days">
            <Card>
              <CardHeader><CardTitle>Performance by Day</CardTitle></CardHeader>
              <CardContent>
                {trades.length > 0 ? (
                  <ResponsiveContainer width="100%" height={350}>
                    <RadarChart data={dayData}>
                      <PolarGrid /><PolarAngleAxis dataKey="day" /><PolarRadiusAxis />
                      <Radar name="Profit" dataKey="profit" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                      <Legend />
                    </RadarChart>
                  </ResponsiveContainer>
                ) : <div className="flex items-center justify-center h-[350px] text-muted-foreground">No data available</div>}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
