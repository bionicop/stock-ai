'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  BarChart3,
  Activity,
  Calendar,
  Briefcase,
  LineChart,
  Clock,
  Globe,
  Users,
  Star,
  Info,
  AlertCircle,
  ArrowRight,
  ChevronRight,
  Loader2
} from "lucide-react";
import Link from "next/link";

interface StockDetailDialogProps {
  isOpen: boolean;
  onClose: () => void;
  symbol: string;
}

interface StockData {
  quote: any;
  profile: any;
  news: any[];
  error?: string;
  loading: boolean;
}

export default function StockDetailDialog({ isOpen, onClose, symbol }: StockDetailDialogProps) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [stockData, setStockData] = useState<StockData>({
    quote: null,
    profile: null,
    news: [],
    loading: true
  });

  // Format large numbers with commas
  const formatNumber = (num: number) => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  // Fetch stock details when the symbol changes
  useEffect(() => {
    async function fetchStockDetails() {
      if (!symbol || !isOpen) return;

      setStockData(prev => ({ ...prev, loading: true }));

      try {
        const response = await fetch(`/api/yahoo-finance/stock-details?symbol=${encodeURIComponent(symbol)}`);

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();
        setStockData({
          quote: data.quote,
          profile: data.profile,
          news: data.news,
          loading: false
        });
      } catch (error) {
        console.error('Error fetching stock details:', error);
        setStockData({
          quote: null,
          profile: null,
          news: [],
          loading: false,
          error: 'Failed to load stock details'
        });
      }
    }

    fetchStockDetails();
  }, [symbol, isOpen]);

  // Check if we should show loading state
  if (stockData.loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[900px] p-6 overflow-hidden rounded-xl">
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-10 w-10 animate-spin text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Loading stock data...</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Check if we have an error
  if (stockData.error || !stockData.quote) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[900px] p-6 overflow-hidden rounded-xl">
          <div className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-10 w-10 text-red-500 mb-4" />
            <p className="text-red-500 mb-2">Failed to load stock details</p>
            <Button variant="outline" onClick={onClose}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Extract data from the API response
  const stock = {
    symbol: stockData.quote.symbol,
    name: stockData.quote.longName || stockData.quote.shortName || stockData.quote.symbol,
    price: stockData.quote.regularMarketPrice,
    change: stockData.quote.regularMarketChange,
    changePercent: stockData.quote.regularMarketChangePercent,
    volume: (stockData.quote.regularMarketVolume || 0) / 1000000, // Convert to millions
    marketCap: (stockData.quote.marketCap || 0) / 1000000000000, // Convert to trillions
    peRatio: stockData.quote.trailingPE || 0,
    sector: stockData.profile?.sector || 'Unknown',
    industry: stockData.profile?.industry || 'Unknown',
    beta: stockData.quote.beta || 0,
    avgVolume: (stockData.quote.averageDailyVolume10Day || 0) / 1000000,
    yearHigh: stockData.quote.fiftyTwoWeekHigh || 0,
    yearLow: stockData.quote.fiftyTwoWeekLow || 0,
    dividendYield: stockData.quote.dividendYield ? stockData.quote.dividendYield * 100 : 0,
    eps: stockData.quote.epsTrailingTwelveMonths || 0,
    priceToBook: stockData.quote.priceToBook || 0,
    priceToSales: stockData.quote.priceToSalesTrailing12Months || 0,
    debtToEquity: stockData.profile?.debtToEquity || 0,
    returnOnEquity: (stockData.profile?.returnOnEquity || 0) * 100,
    profitMargin: (stockData.quote.profitMargins || 0) * 100,
    analystRating: stockData.quote.recommendationKey || 'N/A',
    analystTargetPrice: stockData.quote.targetMeanPrice || 0,
    description: stockData.profile?.longBusinessSummary || 'No detailed information available for this stock.',
    news: stockData.news.map((item: any) => ({
      title: item.title,
      date: new Date(item.providerPublishTime * 1000).toLocaleDateString(),
      source: item.publisher,
      url: item.link
    })),
  };

  // Calculate price change color
  const priceChangeColor = stock.change >= 0 ? 'text-emerald-600' : 'text-red-600';
  const priceChangeBgColor = stock.change >= 0 ? 'bg-emerald-600' : 'bg-red-600';

  // Calculate analyst sentiment color
  const getAnalystColor = (rating: string) => {
    if (rating.includes('STRONG_BUY') || rating.includes('BUY')) return 'text-emerald-600';
    if (rating.includes('HOLD')) return 'text-amber-500';
    if (rating.includes('SELL')) return 'text-red-600';
    return 'text-muted-foreground';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[900px] p-0 overflow-hidden border-none shadow-xl rounded-xl max-h-[85vh]">
        {/* Header with stock info */}
        <div className="relative">
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-r from-background/90 to-background/40 z-10"></div>

          {/* Background pattern */}
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]"></div>

          <div className="relative z-20 p-6">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                    {stock.sector}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {stock.industry}
                  </span>
                </div>

                <div className="mt-2 flex items-center gap-3">
                  <h2 className="text-3xl font-bold">{stock.symbol}</h2>
                  <h3 className="text-xl text-muted-foreground">{stock.name}</h3>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={isFavorite ? "text-amber-400" : "text-muted-foreground"}
                    onClick={() => setIsFavorite(!isFavorite)}
                  >
                    <Star className={`h-5 w-5 ${isFavorite ? "fill-current" : ""}`} />
                  </Button>
                </div>
              </div>

              <div className="text-right">
                <div className="text-3xl font-bold">${stock.price.toFixed(2)}</div>
                <div className="flex items-center justify-end gap-2 mt-1">
                  <span className={`${priceChangeColor} font-medium`}>
                    {stock.change > 0 ? '+' : ''}{stock.change.toFixed(2)}
                  </span>
                  <span className={`${priceChangeBgColor} text-white text-sm px-2 py-0.5 rounded-full`}>
                    {stock.changePercent > 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%
                  </span>
                  {stock.change >= 0 ?
                    <TrendingUp className="h-4 w-4 text-emerald-600" /> :
                    <TrendingDown className="h-4 w-4 text-red-600" />
                  }
                </div>
              </div>
            </div>

            {/* Key metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <div className="bg-card/50 backdrop-blur-sm rounded-lg p-3">
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <DollarSign className="h-3 w-3" /> Market Cap
                </div>
                <div className="font-medium mt-1">
                  {stock.marketCap >= 1
                    ? `$${stock.marketCap.toFixed(2)}T`
                    : `$${(stock.marketCap * 1000).toFixed(2)}B`}
                </div>
              </div>

              <div className="bg-card/50 backdrop-blur-sm rounded-lg p-3">
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <BarChart3 className="h-3 w-3" /> P/E Ratio
                </div>
                <div className="font-medium mt-1">{stock.peRatio > 0 ? stock.peRatio.toFixed(1) : 'N/A'}</div>
              </div>

              <div className="bg-card/50 backdrop-blur-sm rounded-lg p-3">
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <Activity className="h-3 w-3" /> Volume
                </div>
                <div className="font-medium mt-1">{stock.volume.toFixed(1)}M</div>
              </div>

              <div className="bg-card/50 backdrop-blur-sm rounded-lg p-3">
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> Rating
                </div>
                <div className={`font-medium mt-1 ${getAnalystColor(stock.analystRating)}`}>
                  {stock.analystRating.replace('_', ' ')}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs for different sections */}
        <div className="overflow-y-auto" style={{ maxHeight: "calc(85vh - 240px)" }}>
          <Tabs defaultValue="overview" className="p-6 pt-0">
            <TabsList className="grid grid-cols-4 mb-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="financials">Financials</TabsTrigger>
              <TabsTrigger value="news">News</TabsTrigger>
              <TabsTrigger value="analysis">Analysis</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardContent className="p-4">
                    <h3 className="text-sm font-medium mb-3 flex items-center gap-1">
                      <Info className="h-4 w-4 text-muted-foreground" /> Company Profile
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {stock.description}
                    </p>

                    <div className="grid grid-cols-2 gap-y-3 gap-x-6 mt-4">
                      <div>
                        <div className="text-xs text-muted-foreground">Sector</div>
                        <div className="text-sm flex items-center gap-1">
                          <Briefcase className="h-3.5 w-3.5 text-muted-foreground" /> {stock.sector}
                        </div>
                      </div>

                      <div>
                        <div className="text-xs text-muted-foreground">Industry</div>
                        <div className="text-sm">{stock.industry}</div>
                      </div>

                      <div>
                        <div className="text-xs text-muted-foreground">Beta</div>
                        <div className="text-sm">{stock.beta > 0 ? stock.beta.toFixed(2) : 'N/A'}</div>
                      </div>

                      <div>
                        <div className="text-xs text-muted-foreground">Dividend Yield</div>
                        <div className="text-sm">{stock.dividendYield > 0 ? `${stock.dividendYield.toFixed(2)}%` : 'N/A'}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <h3 className="text-sm font-medium mb-3 flex items-center gap-1">
                      <Clock className="h-4 w-4 text-muted-foreground" /> Trading Information
                    </h3>

                    <div className="grid grid-cols-2 gap-y-3 gap-x-6">
                      <div>
                        <div className="text-xs text-muted-foreground">52-Week High</div>
                        <div className="text-sm">${stock.yearHigh.toFixed(2)}</div>
                      </div>

                      <div>
                        <div className="text-xs text-muted-foreground">52-Week Low</div>
                        <div className="text-sm">${stock.yearLow.toFixed(2)}</div>
                      </div>

                      <div>
                        <div className="text-xs text-muted-foreground">Avg. Volume</div>
                        <div className="text-sm">{stock.avgVolume.toFixed(1)}M</div>
                      </div>

                      <div>
                        <div className="text-xs text-muted-foreground">Current Volume</div>
                        <div className="text-sm">{stock.volume.toFixed(1)}M</div>
                      </div>

                      {/* Add more metrics here */}
                      <div>
                        <div className="text-xs text-muted-foreground">Market Cap</div>
                        <div className="text-sm">
                          {stock.marketCap >= 1
                            ? `$${stock.marketCap.toFixed(2)}T`
                            : `$${(stock.marketCap * 1000).toFixed(2)}B`}
                        </div>
                      </div>

                      <div>
                        <div className="text-xs text-muted-foreground">P/E Ratio</div>
                        <div className="text-sm">{stock.peRatio > 0 ? stock.peRatio.toFixed(1) : 'N/A'}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="flex justify-end">
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/stock/${stock.symbol}`}>
                    View Full Details <ChevronRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </TabsContent>

            {/* Financials Tab */}
            <TabsContent value="financials" className="space-y-4">
              <Card>
                <CardContent className="p-4">
                  <h3 className="text-sm font-medium mb-3 flex items-center gap-1">
                    <BarChart3 className="h-4 w-4 text-muted-foreground" /> Financial Metrics
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-xs text-muted-foreground mb-2">Valuation</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm">P/E Ratio</span>
                          <span className="text-sm font-medium">{stock.peRatio > 0 ? stock.peRatio.toFixed(1) : 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Price to Sales</span>
                          <span className="text-sm font-medium">{stock.priceToSales > 0 ? stock.priceToSales.toFixed(2) : 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Price to Book</span>
                          <span className="text-sm font-medium">{stock.priceToBook > 0 ? stock.priceToBook.toFixed(2) : 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">EPS (TTM)</span>
                          <span className="text-sm font-medium">${stock.eps > 0 ? stock.eps.toFixed(2) : 'N/A'}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-xs text-muted-foreground mb-2">Profitability</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm">Profit Margin</span>
                          <span className="text-sm font-medium">{stock.profitMargin > 0 ? `${stock.profitMargin.toFixed(2)}%` : 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Return on Equity</span>
                          <span className="text-sm font-medium">{stock.returnOnEquity > 0 ? `${stock.returnOnEquity.toFixed(2)}%` : 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Dividend Yield</span>
                          <span className="text-sm font-medium">{stock.dividendYield > 0 ? `${stock.dividendYield.toFixed(2)}%` : 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Beta</span>
                          <span className="text-sm font-medium">{stock.beta > 0 ? stock.beta.toFixed(2) : 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="text-center text-sm text-muted-foreground">
                Additional financial information available in full details view
              </div>
            </TabsContent>

            {/* News Tab */}
            <TabsContent value="news" className="space-y-4">
              <Card>
                <CardContent className="p-4">
                  <h3 className="text-sm font-medium mb-3 flex items-center gap-1">
                    <Globe className="h-4 w-4 text-muted-foreground" /> Recent News
                  </h3>

                  <div className="space-y-4">
                    {stock.news.length > 0 ? stock.news.map((item: any, index: number) => (
                      <div key={index} className="border-b pb-4 last:border-0 last:pb-0">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>{item.date}</span>
                          <span className="px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground text-[10px]">
                            {item.source}
                          </span>
                        </div>
                        <h3 className="text-sm font-medium">{item.title}</h3>
                        {item.url && (
                          <Button variant="link" className="p-0 h-auto text-xs mt-1" onClick={() => window.open(item.url, '_blank')}>
                            Read more <ArrowRight className="ml-1 h-3 w-3" />
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
            </TabsContent>

            {/* Analysis Tab */}
            <TabsContent value="analysis" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardContent className="p-4">
                    <h3 className="text-sm font-medium mb-3 flex items-center gap-1">
                      <TrendingUp className="h-4 w-4 text-muted-foreground" /> Analyst Recommendations
                    </h3>

                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs text-muted-foreground">Consensus Rating</span>
                          <span className={`text-sm font-medium ${getAnalystColor(stock.analystRating)}`}>
                            {stock.analystRating.replace('_', ' ')}
                          </span>
                        </div>
                        <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full ${stock.analystRating.includes('BUY') ? 'bg-emerald-600' :
                              stock.analystRating.includes('HOLD') ? 'bg-amber-500' : 'bg-red-600'}`}
                            style={{ width: stock.analystRating.includes('STRONG_BUY') ? '90%' :
                                    stock.analystRating.includes('BUY') ? '75%' :
                                    stock.analystRating.includes('HOLD') ? '50%' : '25%' }}
                          ></div>
                        </div>
                      </div>

                      {stock.analystTargetPrice > 0 && (
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs text-muted-foreground">Price Target</span>
                            <span className="text-sm font-medium">${stock.analystTargetPrice.toFixed(2)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs">${stock.price.toFixed(2)}</span>
                            <div className="h-2 flex-1 bg-muted rounded-full overflow-hidden">
                              <div
                                className={`h-full ${stock.analystTargetPrice > stock.price ? 'bg-emerald-600' : 'bg-red-600'}`}
                                style={{ width: `${Math.min(100, (stock.price / stock.analystTargetPrice) * 100)}%` }}
                              ></div>
                            </div>
                            <span className="text-xs">${stock.analystTargetPrice.toFixed(2)}</span>
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {stock.analystTargetPrice > stock.price
                              ? `Upside potential: ${((stock.analystTargetPrice / stock.price - 1) * 100).toFixed(2)}%`
                              : `Downside risk: ${((1 - stock.analystTargetPrice / stock.price) * 100).toFixed(2)}%`
                            }
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <h3 className="text-sm font-medium mb-3 flex items-center gap-1">
                      <LineChart className="h-4 w-4 text-muted-foreground" /> Performance Metrics
                    </h3>

                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Today's Change</span>
                        <span className={`text-sm font-medium ${stock.change >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                          {stock.change > 0 ? '+' : ''}{stock.change.toFixed(2)} ({stock.changePercent.toFixed(2)}%)
                        </span>
                      </div>

                      {stock.yearHigh > 0 && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm">52-Week Range</span>
                          <span className="text-sm font-medium">
                            ${stock.yearLow.toFixed(2)} - ${stock.yearHigh.toFixed(2)}
                          </span>
                        </div>
                      )}

                      {stock.avgVolume > 0 && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Volume vs Avg</span>
                          <span className={`text-sm font-medium ${stock.volume > stock.avgVolume ? 'text-emerald-600' : 'text-amber-500'}`}>
                            {stock.volume > stock.avgVolume
                              ? `+${((stock.volume / stock.avgVolume - 1) * 100).toFixed(0)}%`
                              : `-${((1 - stock.volume / stock.avgVolume) * 100).toFixed(0)}%`}
                          </span>
                        </div>
                      )}

                      <div className="flex justify-between items-center">
                        <span className="text-sm">Volatility (Beta)</span>
                        <span className="text-sm font-medium">
                          {stock.beta > 0 ? stock.beta.toFixed(2) : 'N/A'}
                          {stock.beta > 0 && (
                            <span className="text-xs text-muted-foreground ml-1">
                              ({stock.beta > 1 ? 'Higher' : 'Lower'} than market)
                            </span>
                          )}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
