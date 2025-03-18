'use client';

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  TrendingUp,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  ChevronRight,
  Newspaper,
  RefreshCw,
} from "lucide-react";

interface MarketIndex {
  shortName: string;
  price: number;
  changePercent: number;
}

interface NewsItem {
  title: string;
  publisher: string;
  link: string;
}

interface TrendingStock {
  symbol: string;
  shortName: string;
  price: number;
  changePercent: number;
}

interface MarketData {
  indices?: MarketIndex[];
  news?: NewsItem[];
  trending?: TrendingStock[];
}

export default function Dashboard() {
  const [marketData, setMarketData] = useState<MarketData>({});
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClientComponentClient();
  const [username, setUsername] = useState<string>("");

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch market data
        const marketResponse = await fetch('/api/yahoo-finance/market');
        const marketData = await marketResponse.json();

        // Get user info
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.email) {
          setUsername(user.email.split('@')[0]);
        }

        setMarketData(marketData);
      } catch (error) {
        console.error('Error fetching market data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [supabase.auth]);

  // Format market time
  const formatMarketTime = () => {
    return new Date().toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="p-6 w-full">
      <div className="max-w-[1600px] mx-auto space-y-6">
        {/* Welcome section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Welcome {username ? `, ${username}` : 'to Stock AI'}</h1>
            <p className="text-muted-foreground">Here&apos;s your market overview</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="bg-primary/10 text-primary flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-green-500"></span>
              Market Open
            </Badge>
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" /> {formatMarketTime()}
            </span>
            <Button variant="ghost" size="icon" onClick={() => window.location.reload()}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Market Indices Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {isLoading ? (
            Array(4).fill(0).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4">
                  <div className="h-4 w-24 bg-muted rounded mb-2"></div>
                  <div className="h-6 w-20 bg-muted rounded mb-1"></div>
                  <div className="h-4 w-16 bg-muted rounded"></div>
                </CardContent>
              </Card>
            ))
          ) : (
            marketData?.indices?.map((index: any, i: number) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="text-sm font-medium mb-1">{index.shortName}</div>
                  <div className="text-xl font-semibold">${index.price?.toFixed(2)}</div>
                  <div className={`flex items-center text-sm ${index.changePercent >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                    {index.changePercent >= 0 ?
                      <ArrowUpRight className="h-3.5 w-3.5 mr-1" /> :
                      <ArrowDownRight className="h-3.5 w-3.5 mr-1" />
                    }
                    {index.changePercent?.toFixed(2)}%
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Main content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Market Trends */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" /> Market Trends
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={marketData.trending || []}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="time" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        borderColor: 'hsl(var(--border))'
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="price"
                      stroke="hsl(var(--primary))"
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Market News */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Newspaper className="h-5 w-5" /> Market News
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {isLoading ? (
                  Array(5).fill(0).map((_, i) => (
                    <div key={i} className="p-4 animate-pulse">
                      <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-muted rounded w-1/4"></div>
                    </div>
                  ))
                ) : (
                  marketData?.news?.map((item: any, i: number) => (
                    <div key={i} className="p-4 hover:bg-muted/50">
                      <h3 className="text-sm font-medium line-clamp-2 hover:text-primary cursor-pointer">
                        {item.title}
                      </h3>
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-xs text-muted-foreground">{item.publisher}</span>
                        <Button variant="ghost" size="sm" className="h-auto py-1" asChild>
                          <Link href={item.link} target="_blank">
                            Read <ChevronRight className="h-3 w-3 ml-1" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bottom Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Market Movers */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" /> Market Movers
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {isLoading ? (
                  Array(5).fill(0).map((_, i) => (
                    <div key={i} className="p-4 animate-pulse">
                      <div className="flex justify-between">
                        <div className="space-y-2">
                          <div className="h-4 bg-muted rounded w-16"></div>
                          <div className="h-3 bg-muted rounded w-24"></div>
                        </div>
                        <div className="space-y-2 text-right">
                          <div className="h-4 bg-muted rounded w-20"></div>
                          <div className="h-3 bg-muted rounded w-12"></div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  marketData?.trending?.slice(0, 5).map((stock: any, i: number) => (
                    <Link href={`/stock/${stock.symbol}`} key={i}>
                      <div className="p-4 hover:bg-muted/50">
                        <div className="flex justify-between">
                          <div>
                            <div className="font-medium">{stock.symbol}</div>
                            <div className="text-sm text-muted-foreground">{stock.shortName}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium">${stock.price?.toFixed(2)}</div>
                            <div className={`text-sm ${stock.changePercent >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                              {stock.changePercent >= 0 ? '+' : ''}{stock.changePercent?.toFixed(2)}%
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" size="sm" className="w-full" asChild>
                <Link href="/screener">
                  View All Stocks <ChevronRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
