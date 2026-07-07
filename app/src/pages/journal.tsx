import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { db, query, collection, where, orderBy, getDocs, auth } from "@/lib/firebase";
import type { Trade } from "@/types/trade";
import { Search, BookOpen, FileText, ArrowRight, Calendar, TrendingUp } from "lucide-react";

export default function Journal() {
  const navigate = useNavigate();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchTrades = useCallback(async () => {
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
      // Silently handle
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTrades();
  }, [fetchTrades]);

  const tradesWithNotes = trades.filter((t) => t.notes.trim().length > 0);

  const filteredTrades = tradesWithNotes.filter((t) => {
    if (!search.trim()) return true;
    const s = search.toLowerCase();
    return t.notes.toLowerCase().includes(s) || t.pair.toLowerCase().includes(s) || t.strategy.toLowerCase().includes(s);
  });

  // Group by month
  const grouped = filteredTrades.reduce<Record<string, Trade[]>>((acc, trade) => {
    const month = trade.tradeDate.substring(0, 7);
    if (!acc[month]) acc[month] = [];
    acc[month].push(trade);
    return acc;
  }, {});

  const monthNames: Record<string, string> = {};
  for (const key of Object.keys(grouped)) {
    const [year, month] = key.split("-");
    monthNames[key] = new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
  }

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <BookOpen className="h-6 w-6" />
            Trading Journal
          </h1>
          <p className="text-muted-foreground mt-1">
            {tradesWithNotes.length} entries with journal notes
          </p>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search journal entries..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}><CardContent className="p-6"><div className="h-4 w-32 bg-muted rounded mb-2" /><div className="h-20 bg-muted rounded" /></CardContent></Card>
            ))}
          </div>
        ) : filteredTrades.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">No journal entries yet</p>
              <p className="text-sm text-muted-foreground mb-4">
                Start adding notes to your trades to build your trading journal
              </p>
              <Button onClick={() => navigate("/trades/new")}>
                <TrendingUp className="mr-2 h-4 w-4" />
                Add a Trade with Notes
              </Button>
            </CardContent>
          </Card>
        ) : (
          Object.entries(grouped)
            .sort(([a], [b]) => b.localeCompare(a))
            .map(([month, monthTrades]) => (
              <div key={month} className="space-y-3">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <h2 className="font-semibold text-lg">{monthNames[month]}</h2>
                  <Badge variant="secondary">{monthTrades.length} entries</Badge>
                </div>
                {monthTrades.map((trade) => (
                  <Card
                    key={trade.id}
                    className="hover:shadow-md transition-all cursor-pointer"
                    onClick={() => navigate(`/trades/${trade.id}`)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-base">{trade.pair} ({trade.direction})</CardTitle>
                          <Badge variant="outline" className="text-xs">{trade.market}</Badge>
                          <Badge variant="secondary" className="text-xs">{trade.strategy}</Badge>
                        </div>
                        <span className="text-xs text-muted-foreground">{trade.tradeDate}</span>
                      </div>
                      <CardDescription>
                        P&L: <span className={(trade.profitLoss || 0) > 0 ? "text-green-600 font-medium" : (trade.profitLoss || 0) < 0 ? "text-red-600 font-medium" : ""}>
                          {(trade.profitLoss || 0) > 0 ? "+" : ""}${(trade.profitLoss || 0).toFixed(2)}
                        </span>
                        {trade.rrRatio ? ` • R:R ${trade.rrRatio.toFixed(1)}` : ""}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        <p className="text-sm text-muted-foreground line-clamp-4 whitespace-pre-wrap">
                          {trade.notes}
                        </p>
                      </div>
                      {trade.tags.length > 0 && (
                        <div className="flex gap-1 mt-3 flex-wrap">
                          {trade.tags.map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-[10px]">{tag}</Badge>
                          ))}
                        </div>
                      )}
                      <div className="flex justify-end mt-3">
                        <Button variant="ghost" size="sm" className="text-xs">
                          Read More <ArrowRight className="ml-1 h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ))
        )}
      </div>
    </AppLayout>
  );
}
