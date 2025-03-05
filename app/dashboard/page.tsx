'use client';

import { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Star, StarOff } from "lucide-react";



const mockNewsData = [
  {
    id: 1,
    title: "Fed signals potential rate cuts in coming months",
    source: "Financial Times",
    time: "2 hours ago",
    impact: "high",
  },
  {
    id: 2,
    title: "Tech stocks rally on earnings beats",
    source: "Wall Street Journal",
    time: "4 hours ago",
    impact: "medium",
  },
  {
    id: 3,
    title: "Oil prices stabilize following OPEC meeting",
    source: "Bloomberg",
    time: "6 hours ago",
    impact: "medium",
  },
  {
    id: 4,
    title: "Retail sales exceed expectations in Q2",
    source: "CNBC",
    time: "12 hours ago",
    impact: "low",
  },
];

const mockSectorPerformance = [
  { name: "Technology", value: 4.2, color: "hsl(var(--chart-1))" },
  { name: "Healthcare", value: 2.1, color: "hsl(var(--chart-2))" },
  { name: "Energy", value: -1.8, color: "hsl(var(--chart-3))" },
  { name: "Financials", value: 3.5, color: "hsl(var(--chart-4))" },
  { name: "Consumer", value: 0.7, color: "hsl(var(--chart-5))" },
];

const mockTickers = [
  { symbol: "AAPL", name: "Apple Inc.", price: 182.63, change: 1.25, changePercent: 0.69, favorite: true },
  { symbol: "MSFT", name: "Microsoft Corp.", price: 378.92, change: 2.45, changePercent: 0.65, favorite: true },
  { symbol: "GOOGL", name: "Alphabet Inc.", price: 142.17, change: -0.83, changePercent: -0.58, favorite: false },
  { symbol: "AMZN", name: "Amazon.com Inc.", price: 145.24, change: 1.18, changePercent: 0.82, favorite: true },
  { symbol: "META", name: "Meta Platforms Inc.", price: 465.20, change: -2.34, changePercent: -0.50, favorite: false },
  { symbol: "TSLA", name: "Tesla Inc.", price: 191.59, change: 4.76, changePercent: 2.55, favorite: false },
  { symbol: "NVDA", name: "NVIDIA Corp.", price: 795.18, change: 12.43, changePercent: 1.59, favorite: true },
  { symbol: "BRK.B", name: "Berkshire Hathaway", price: 408.77, change: 0.56, changePercent: 0.14, favorite: false },
];

export default function Dashboard() {
  const [userEmail, setUserEmail] = useState("user@example.com");
  const [searchQuery, setSearchQuery] = useState("");
  const [tickers, setTickers] = useState(mockTickers);
  const [activeTab, setActiveTab] = useState("all");

  // Function to toggle favorite status
  const toggleFavorite = (symbol) => {
    setTickers(tickers.map(ticker =>
      ticker.symbol === symbol ? {...ticker, favorite: !ticker.favorite} : ticker
    ));
  };

  // Filter tickers based on search and active tab
  const filteredTickers = tickers
    .filter(ticker =>
      ticker.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticker.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .filter(ticker => activeTab === "all" || (activeTab === "favorites" && ticker.favorite));

  // Sort tickers to show favorites first
  const sortedTickers = [...filteredTickers].sort((a, b) => {
    // Sort by favorite status first (favorites on top)
    if (a.favorite && !b.favorite) return -1;
    if (!a.favorite && b.favorite) return 1;
    return 0;
  });

  return (
    <div className="p-6 w-full">
      <div className="max-w-[1600px] mx-auto space-y-6">
        {/* Welcome section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Welcome back, {userEmail}</h1>
            <p className="text-muted-foreground">Here's what's happening in the market today.</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-primary/10 text-primary">
              Market Open
            </Badge>
            <span className="text-sm text-muted-foreground">Last updated: {new Date().toLocaleTimeString()}</span>
          </div>
        </div>

        {/* Market Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Market Overview</CardTitle>
              <CardDescription>Performance by sector and index trends</CardDescription>
            </CardHeader>
            <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={mockSectorPerformance} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
                        <XAxis type="number" className="text-muted-foreground" />
                        <YAxis dataKey="name" type="category" className="text-muted-foreground" width={80} />
                        <Tooltip
                          contentStyle={{ background: 'hsl(var(--card))', border: 'none' }}
                          formatter={(value) => [`${value}%`, 'Change']}
                        />
                        <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                          {mockSectorPerformance.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {mockSectorPerformance.map((sector) => (
                      <div key={sector.name} className="text-center">
                        <div className="text-sm font-medium">{sector.name}</div>
                        <div className={`text-base font-semibold ${sector.value >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                          {sector.value > 0 ? '+' : ''}{sector.value}%
                        </div>
                      </div>
                    ))}
                  </div>
            </CardContent>
          </Card>

          {/* Market News */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Market News</CardTitle>
              <CardDescription>Latest financial news and updates</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {mockNewsData.map(news => (
                <div key={news.id} className="border-b pb-3 last:border-b-0 last:pb-0">
                  <h3 className="font-medium hover:text-primary cursor-pointer">{news.title}</h3>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-sm text-muted-foreground">{news.source}</span>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={`text-xs ${
                          news.impact === 'high' ? 'bg-destructive/10 text-destructive' :
                          news.impact === 'medium' ? 'bg-amber-500/10 text-amber-500' :
                          'bg-emerald-500/10 text-emerald-500'
                        }`}
                      >
                        {news.impact}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{news.time}</span>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Ticker section */}
        <Card>
          <CardHeader className="flex flex-col sm:flex-row justify-between sm:items-center space-y-2 sm:space-y-0">
            <div>
              <CardTitle>Stocks</CardTitle>
              <CardDescription>Track your favorite stocks and market movers</CardDescription>
            </div>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search symbols or names"
                  className="pl-8 w-[200px] sm:w-[260px]"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-[200px]">
                <TabsList>
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="favorites">Favorites</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Symbol</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Name</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Price</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Change</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">% Change</th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-muted-foreground">Favorite</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {sortedTickers.map((ticker) => (
                      <tr key={ticker.symbol} className="hover:bg-muted/50">
                        <td className="px-4 py-3 text-left font-medium">{ticker.symbol}</td>
                        <td className="px-4 py-3 text-left text-muted-foreground">{ticker.name}</td>
                        <td className="px-4 py-3 text-right font-medium">${ticker.price.toFixed(2)}</td>
                        <td className={`px-4 py-3 text-right ${ticker.change >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                          {ticker.change > 0 ? '+' : ''}{ticker.change.toFixed(2)}
                        </td>
                        <td className={`px-4 py-3 text-right ${ticker.changePercent >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                          {ticker.changePercent > 0 ? '+' : ''}{ticker.changePercent.toFixed(2)}%
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => toggleFavorite(ticker.symbol)}
                            className={ticker.favorite ? 'text-amber-400 hover:text-amber-500' : 'text-muted-foreground hover:text-foreground'}
                          >
                            {ticker.favorite ? <Star className="h-4 w-4 fill-current" /> : <StarOff className="h-4 w-4" />}
                          </Button>
                        </td>
                      </tr>
                    ))}
                    {sortedTickers.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">
                          No tickers found. Try adjusting your search.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
