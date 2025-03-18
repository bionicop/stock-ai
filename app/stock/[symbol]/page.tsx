"use client"

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, TrendingUp, DollarSign, BarChart3, Activity, Calendar, Briefcase, LineChart as LC, Newspaper, ChevronRight, Percent, AlertCircle, Loader2, Info } from "lucide-react";
import Link from "next/link";
import { use } from "react";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";
import { fetchStockChartData, fetchStockDetails, fetchStockNews } from "@/lib/yahoo/yahooFinance";
import { Skeleton } from "@/components/ui/skeleton";
import StockAnalysisComponent from "@/components/ui/StockAnalysis";

const chartConfig = {
  priceData: {
    label: "Price Data",
  },
  high: {
    label: "High",
    color: "hsl(var(--chart-3))",
  },
  close: {
    label: "Close",
    color: "hsl(var(--chart-2))",
  },
  low: {
    label: "Low",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;

export default function StockPage({ params }: { params: { symbol: string } }) {
  const symbol = use(params).symbol;
  const [stockData, setStockData] = useState<any[]>([]);
  const [stockDetails, setStockDetails] = useState<any>(null);
  const [stockNews, setStockNews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chartRange, setChartRange] = useState<'1mo' | '3mo' | '6mo' | '1y'>('3mo');

  const loadStockData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Execute all promises in parallel for better performance
      const [chartData, details, news] = await Promise.all([
        fetchStockChartData(symbol, chartRange, '1d'),
        fetchStockDetails(symbol),
        fetchStockNews(symbol, 5)
      ]);

      setStockData(chartData);
      setStockDetails(details);
      setStockNews(news);
    } catch (error) {
      console.error("Error fetching stock data:", error);
      setError("Failed to load stock data. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStockData();
  }, [symbol, chartRange]);

  // Update chart data validation
  const isValidChartData = stockData && stockData.length > 0 && stockData.some(item =>
    item.close != null && item.high != null && item.low != null && item.date
  );

  // Show error state
  if (error) {
    return (
      <div className="p-4 w-full container mx-auto max-w-7xl">
        <Button variant="outline" size="sm" asChild className="mb-4">
          <Link href="/screener">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Screener
          </Link>
        </Button>
        <Card className="p-6">
          <div className="flex flex-col items-center justify-center text-center">
            <AlertCircle className="h-10 w-10 text-destructive mb-4" />
            <h2 className="text-lg font-semibold mb-2">Error Loading Stock Data</h2>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // If loading, show skeleton UI
  if (loading || !stockDetails) {
    return (
      <div className="p-4 w-full container">
        <div className="mb-6">
          <Button variant="outline" size="sm" asChild className="mb-4">
            <Link href="/screener">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Screener
            </Link>
          </Button>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <Skeleton className="h-8 w-64 mb-2" />
              <Skeleton className="h-6 w-32" />
            </div>
          </div>

          <Card className="mb-6">
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[300px] w-full" />
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <Skeleton className="h-[400px] w-full mb-6" />
            </div>
            <div className="lg:col-span-2">
              <Skeleton className="h-[300px] w-full mb-6" />
              <Skeleton className="h-[400px] w-full mb-6" />
            </div>
          </div>
          <Skeleton className="h-[500px] w-full mb-6" />
          <Skeleton className="h-[400px] w-full" />
        </div>
      </div>
    );
  }

  // Calculate min and max values for chart scaling
  const minValue = Math.min(...stockData.map(item => item.low || 0));
  const maxValue = Math.max(...stockData.map(item => item.high || 0));

  // Calculate percentage from 52-week low to high
  const priceRange = stockDetails.yearHigh - stockDetails.yearLow;
  const currentFromLow = stockDetails.price - stockDetails.yearLow;
  const percentInRange = priceRange > 0 ? (currentFromLow / priceRange) * 100 : 50;

  return (
    <div className="p-4 w-full container mx-auto max-w-7xl">
      {/* Header with back button */}
      <div className="mb-6">
        <Button variant="outline" size="sm" asChild className="mb-4">
          <Link href="/screener">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Screener
          </Link>
        </Button>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              {stockDetails.symbol}
              <span className="text-xl font-normal text-muted-foreground">{stockDetails.name}</span>
            </h1>
            <div className="flex items-center mt-1">
              <span className="text-2xl font-semibold mr-2">${stockDetails.price?.toFixed(2) || 'N/A'}</span>
              <span className={`px-2 py-1 rounded-md text-white text-sm ${stockDetails.change >= 0 ? 'bg-emerald-600' : 'bg-red-600'}`}>
                {stockDetails.change > 0 ? '+' : ''}{stockDetails.change?.toFixed(2) || 0} ({stockDetails.changePercent > 0 ? '+' : ''}{stockDetails.changePercent?.toFixed(2) || 0}%)
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 md:flex gap-2">
            <Card className="border-none bg-muted/50">
              <CardContent className="p-3 flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-xs text-muted-foreground">Market Cap</div>
                  <div className="font-medium">
                    {stockDetails.marketCap
                      ? (stockDetails.marketCap >= 1
                        ? `$${stockDetails.marketCap.toFixed(2)}T`
                        : `$${(stockDetails.marketCap * 1000).toFixed(2)}B`)
                      : 'N/A'}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none bg-muted/50">
              <CardContent className="p-3 flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-xs text-muted-foreground">P/E Ratio</div>
                  <div className="font-medium">{stockDetails.peRatio?.toFixed(1) || 'N/A'}</div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none bg-muted/50">
              <CardContent className="p-3 flex items-center gap-2">
                <Activity className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-xs text-muted-foreground">Volume</div>
                  <div className="font-medium">{stockDetails.volume?.toFixed(1)}M</div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none bg-muted/50">
              <CardContent className="p-3 flex items-center gap-2">
                <Percent className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-xs text-muted-foreground">Dividend</div>
                  <div className="font-medium">{stockDetails.dividendYield > 0 ? `${stockDetails.dividendYield.toFixed(2)}%` : 'N/A'}</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Price Chart Section */}
        <Card className="mb-6">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-xl">
                <LC className="h-5 w-5" /> Price Chart
              </CardTitle>
              <div className="flex gap-2">
                <Button
                  variant={chartRange === "1mo" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setChartRange("1mo")}
                >
                  1M
                </Button>
                <Button
                  variant={chartRange === "3mo" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setChartRange("3mo")}
                >
                  3M
                </Button>
                <Button
                  variant={chartRange === "6mo" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setChartRange("6mo")}
                >
                  6M
                </Button>
                <Button
                  variant={chartRange === "1y" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setChartRange("1y")}
                >
                  1Y
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[350px] flex items-center justify-center bg-muted/30 rounded-md mb-4">
              {isValidChartData ? (
                <ChartContainer
                  config={chartConfig}
                  className="h-full w-full"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={stockData}
                      margin={{
                        top: 20,
                        right: 20,
                        left: 20,
                        bottom: 10,
                      }}
                    >
                      <defs>
                        <linearGradient id="gradientHigh" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={chartConfig.high.color} stopOpacity={0.2} />
                          <stop offset="95%" stopColor={chartConfig.high.color} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                      <XAxis
                        dataKey="date"
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        minTickGap={32}
                        tick={{ fill: '#9ca3af' }}
                      />
                      <YAxis
                        domain={['auto', 'auto']}
                        tickLine={false}
                        axisLine={false}
                        tick={{ fill: '#9ca3af' }}
                        tickFormatter={(value) => `$${value.toFixed(2)}`}
                      />
                      <ChartTooltip
                        content={
                          <ChartTooltipContent
                            className="bg-muted border-border"
                            labelFormatter={(value) => value}
                            valueFormatter={(value) => `$${Number(value).toFixed(2)}`}
                          />
                        }
                      />
                      <Line
                        type="monotone"
                        dataKey="high"
                        stroke={chartConfig.high.color}
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 4 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="close"
                        stroke={chartConfig.close.color}
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 4 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="low"
                        stroke={chartConfig.low.color}
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              ) : (
                <div className="flex flex-col items-center justify-center text-muted-foreground">
                  <p>No chart data available</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => loadStockData()}
                  >
                    Retry
                  </Button>
                </div>
              )}
            </div>

            {/* 52-week range */}
            <div className="mt-4">
              <div className="flex justify-between text-sm text-muted-foreground mb-1">
                <span>52-Week Range</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm">${stockDetails.yearLow?.toFixed(2) || 'N/A'}</span>
                <div className="relative flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`absolute h-full ${stockDetails.change >= 0 ? 'bg-emerald-600' : 'bg-red-600'}`}
                    style={{ width: `${percentInRange}%` }}
                  ></div>
                </div>
                <span className="text-sm">${stockDetails.yearHigh?.toFixed(2) || 'N/A'}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Left column - Company Info */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Info className="h-5 w-5" /> Company Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-y-2">
                    <div className="text-sm text-muted-foreground">Sector</div>
                    <div className="text-sm flex items-center gap-1">
                      <Briefcase className="h-4 w-4" /> {stockDetails.sector || 'N/A'}
                    </div>

                    <div className="text-sm text-muted-foreground">Industry</div>
                    <div className="text-sm">{stockDetails.industry || 'N/A'}</div>

                    <div className="text-sm text-muted-foreground">Beta</div>
                    <div className="text-sm">{stockDetails.beta?.toFixed(2) || 'N/A'}</div>

                    <div className="text-sm text-muted-foreground">Avg Volume</div>
                    <div className="text-sm">{stockDetails.avgVolume?.toFixed(1) || 'N/A'}M</div>

                    <div className="text-sm text-muted-foreground">Current Volume</div>
                    <div className="text-sm">{stockDetails.volume?.toFixed(1) || 'N/A'}M</div>
                  </div>

                  {stockDetails.description && (
                    <div className="pt-4 border-t">
                      <h3 className="font-medium mb-2">About {stockDetails.name}</h3>
                      <div className="text-sm text-muted-foreground">
                        {stockDetails.description && stockDetails.description.length > 300 ? (
                          <div>
                            <p>{stockDetails.description.slice(0, 300)}
                              <Button
                                variant="link"
                                className="px-1 h-auto text-xs"
                                onClick={() => {
                                  const fullDesc = stockDetails.description;
                                  window.alert(fullDesc);
                                }}
                              >
                                ...show more
                              </Button>
                            </p>
                          </div>
                        ) : (
                          <p>{stockDetails.description}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right column - Financials and Performance */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <TrendingUp className="h-5 w-5" /> Performance Metrics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Performance indicators */}
                  <div>
                    <h3 className="font-medium mb-3">Key Indicators</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Market Cap</span>
                        <span className="font-medium">
                          {stockDetails.marketCap
                            ? (stockDetails.marketCap >= 1
                              ? `$${stockDetails.marketCap.toFixed(2)}T`
                              : `$${(stockDetails.marketCap * 1000).toFixed(2)}B`)
                            : 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">P/E Ratio</span>
                        <span className="font-medium">{stockDetails.peRatio?.toFixed(1) || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Dividend Yield</span>
                        <span className="font-medium">{stockDetails.dividendYield > 0 ? `${stockDetails.dividendYield.toFixed(2)}%` : 'N/A'}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Beta</span>
                        <span className="font-medium">{stockDetails.beta?.toFixed(2) || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">52-Week High</span>
                        <span className="font-medium">${stockDetails.yearHigh?.toFixed(2) || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">52-Week Low</span>
                        <span className="font-medium">${stockDetails.yearLow?.toFixed(2) || 'N/A'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Performance visualization */}
                  <div>
                    <h3 className="font-medium mb-3">Price Movement</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Today</span>
                        <span className={`font-medium ${stockDetails.change >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                          {stockDetails.change > 0 ? '+' : ''}{stockDetails.change?.toFixed(2) || 0}
                          ({stockDetails.changePercent > 0 ? '+' : ''}{stockDetails.changePercent?.toFixed(2) || 0}%)
                        </span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">From 52-Week Low</span>
                        <span className="font-medium text-emerald-500">
                          +${(stockDetails.price - stockDetails.yearLow).toFixed(2)}
                          ({((stockDetails.price / stockDetails.yearLow - 1) * 100).toFixed(2)}%)
                        </span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">From 52-Week High</span>
                        <span className="font-medium text-red-500">
                          -${(stockDetails.yearHigh - stockDetails.price).toFixed(2)}
                          ({((1 - stockDetails.price / stockDetails.yearHigh) * 100).toFixed(2)}%)
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Activity className="h-5 w-5" /> Trading Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-muted/30 rounded-md p-4">
                    <h3 className="text-sm text-muted-foreground mb-1">Volume</h3>
                    <div className="text-2xl font-semibold">{stockDetails.volume?.toFixed(1) || 'N/A'}M</div>
                    {stockDetails.volume && stockDetails.avgVolume ? (
                      <div className="text-xs text-muted-foreground mt-1">
                        {stockDetails.volume > stockDetails.avgVolume ?
                          `${((stockDetails.volume / stockDetails.avgVolume - 1) * 100).toFixed(1)}% above average` :
                          `${((1 - stockDetails.volume / stockDetails.avgVolume) * 100).toFixed(1)}% below average`}
                      </div>
                    ) : null}
                  </div>

                  <div className="bg-muted/30 rounded-md p-4">
                    <h3 className="text-sm text-muted-foreground mb-1">Avg. Daily Volume</h3>
                    <div className="text-2xl font-semibold">{stockDetails.avgVolume?.toFixed(1) || 'N/A'}M</div>
                    <div className="text-xs text-muted-foreground mt-1">Last 3 months</div>
                  </div>

                  <div className="bg-muted/30 rounded-md p-4">
                    <h3 className="text-sm text-muted-foreground mb-1">Volatility</h3>
                    <div className="text-2xl font-semibold">{stockDetails.beta ? (stockDetails.beta * 100).toFixed(0) + '%' : 'N/A'}</div>
                    {stockDetails.beta ? (
                      <div className="text-xs text-muted-foreground mt-1">
                        {stockDetails.beta > 1 ? 'More volatile than market' : 'Less volatile than market'}
                      </div>
                    ) : null}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Full-width AI Stock Analysis */}
        <div className="mb-6">
          <StockAnalysisComponent
            symbol={symbol}
            investmentHorizon="medium"
            riskTolerance="moderate"
          />
        </div>

        {/* Full-width Recent News */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-xl">
              <Newspaper className="h-5 w-5" /> Recent News
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stockNews.length > 0 ? stockNews.map((item, index) => (
                <div key={index} className={index < stockNews.length - 1 ? "border-b pb-4" : ""}>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <Calendar className="h-4 w-4" />
                    <span>{item.time || 'N/A'}</span>
                    <span className={`px-1.5 py-0.5 text-xs rounded-full ${
                      item.impact === 'high' ? 'bg-red-900/30 text-red-500' :
                      item.impact === 'medium' ? 'bg-orange-900/30 text-orange-500' :
                      'bg-blue-900/30 text-blue-500'
                    }`}>
                      {item.impact === 'high' ? 'High' :
                       item.impact === 'medium' ? 'Medium' : 'Low'} Impact
                    </span>
                  </div>
                  <h3 className="font-medium text-sm">{item.title}</h3>
                  {item.url && (
                    <Button variant="link" className="p-0 h-auto text-sm" onClick={() => window.open(item.url, '_blank')}>
                      Read more <ChevronRight className="h-3 w-3 ml-1" />
                    </Button>
                  )}
                </div>
              )) : (
                <div className="text-center py-6 text-muted-foreground">
                  No recent news available for this stock.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {loading && (
        <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Loading...</span>
          </div>
        </div>
      )}
    </div>
  );
}
