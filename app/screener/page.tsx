'use client';

import { useState, useEffect } from 'react';
import {
  Button
} from "@/components/ui/button";
import { Card, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, Star, StarOff, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import StockDetailDialog from "@/components/ui/StockDetail";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

// Interface for quote data
interface Ticker {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap: number;
  peRatio: number;
  favorite: boolean;
}

// Mapping from our filterTypes to Yahoo's screener modules
const filterTypeToScreenerModule = {
  all: "most_actives",
  favorites: "favorites",
  gainers: "day_gainers",
  losers: "day_losers",
  mostActive: "most_actives"
};

export default function Screener() {
  const supabase = createClientComponentClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [tickers, setTickers] = useState<Ticker[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(15);
  const [filterType, setFilterType] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [visibleColumns, setVisibleColumns] = useState({
    symbol: true,
    name: true,
    price: true,
    change: true,
    changePercent: true,
    volume: true,
    marketCap: true,
    peRatio: true,
    favorite: true
  });

  // State for the stock detail dialog
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedSymbol, setSelectedSymbol] = useState("");

  // Replace localStorage with regular state
  const [favorites, setFavorites] = useState<string[]>([]);

  // Function to fetch stock data
  const fetchStockData = async (screenerId: string) => {
    try {
      setIsLoading(true);

      // Call our server API endpoint instead of yahoo-finance2 directly
      const response = await fetch('/api/yahoo-finance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          screenerId,
          favorites: filterType === "favorites" ? favorites : []
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const result = await response.json();

      // Transform the data to our format
      const fetchedTickers: Ticker[] = result.quotes.map((quote: any) => ({
        symbol: quote.symbol,
        name: quote.shortName || quote.longName || quote.symbol,
        price: quote.regularMarketPrice || 0,
        change: quote.regularMarketChange || 0,
        changePercent: quote.regularMarketChangePercent || 0,
        volume: (quote.regularMarketVolume || 0) / 1000000, // Convert to millions
        marketCap: (quote.marketCap || 0) / 1000000000000, // Convert to trillions
        peRatio: calculatePE(quote.regularMarketPrice, quote.epsTrailingTwelveMonths),
        favorite: favorites.includes(quote.symbol)
      }));

      setTickers(fetchedTickers);
    } catch (error) {
      console.error('Error fetching stock data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate PE ratio
  const calculatePE = (price?: number, eps?: number) => {
    if (!price || !eps || eps <= 0) return 0;
    return price / eps;
  };

  // Function to fetch favorites from Supabase
  const fetchFavorites = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('user_favorites')
        .select('symbols')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "no rows" error
      setFavorites(data?.symbols || []);
    } catch (error) {
      console.error('Error fetching favorites:', error);
    }
  };

  // Function to toggle favorite status in Supabase
  const toggleFavorite = async (symbol: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: existing } = await supabase
        .from('user_favorites')
        .select('symbols')
        .eq('user_id', user.id)
        .single();

      if (!existing) {
        // First favorite for this user
        await supabase
          .from('user_favorites')
          .insert([{ user_id: user.id, symbols: [symbol] }]);

        setFavorites([symbol]);
      } else {
        // Update existing favorites
        const newSymbols = favorites.includes(symbol)
          ? existing.symbols.filter((s: string) => s !== symbol)
          : [...existing.symbols, symbol];

        await supabase
          .from('user_favorites')
          .update({ symbols: newSymbols })
          .eq('user_id', user.id);

        setFavorites(newSymbols);
      }

      // Update local ticker state
      setTickers(tickers.map(ticker =>
        ticker.symbol === symbol ? { ...ticker, favorite: !ticker.favorite } : ticker
      ));
    } catch (error) {
      console.error('Error updating favorites:', error);
    }
  };

  // Function to open the stock detail dialog
  const openStockDetail = (symbol: string) => {
    setSelectedSymbol(symbol);
    setIsDialogOpen(true);
  };

  // Add favorites fetch to initial load
  useEffect(() => {
    fetchFavorites();
  }, []);

  // Modify existing useEffect to depend on favorites
  useEffect(() => {
    const screenerId = filterTypeToScreenerModule[filterType as keyof typeof filterTypeToScreenerModule];
    fetchStockData(screenerId);
  }, [filterType, favorites]);

  // Filter tickers based on search and filter type
  let filteredTickers = tickers.filter(ticker =>
    ticker.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ticker.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Additional filtering logic
  if (filterType === "favorites") {
    filteredTickers = filteredTickers.filter(ticker => ticker.favorite);
  } else if (filterType === "all") {
    filteredTickers = [...filteredTickers].sort((a, b) => {
      if (a.favorite && !b.favorite) return -1;
      if (!a.favorite && b.favorite) return 1;
      return 0;
    });
  }

  // Calculate pagination
  const totalPages = Math.ceil(filteredTickers.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const paginatedTickers = filteredTickers.slice(startIndex, startIndex + rowsPerPage);

  // Toggle column visibility
  const toggleColumn = (column: string) => {
    setVisibleColumns({ ...visibleColumns, [column]: !visibleColumns[column as keyof typeof visibleColumns] });
  };

  return (
    <div className="p-4 w-full">
      <div className="max-w-[1600px] mx-auto space-y-4">
        {/* Ticker section */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-center space-y-2 sm:space-y-0">
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
          </div>
        </div>

        <Card>
          <CardContent className='p-4'>
            {/* Filter options */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground mb-1">Filter stocks by category</p>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="favorites">Favorites</SelectItem>
                    <SelectItem value="mostActive">Most Active</SelectItem>
                    <SelectItem value="gainers">Gainers</SelectItem>
                    <SelectItem value="losers">Losers</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-muted-foreground mb-1">Customize visible data</p>
                <Select value="columns">
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Columns" />
                  </SelectTrigger>
                  <SelectContent className="min-w-[200px]">
                    <div className="p-2 space-y-2">
                      {Object.keys(visibleColumns).map((column) => (
                        <div key={column} className="flex items-center space-x-2">
                          <Checkbox
                            id={column}
                            checked={visibleColumns[column as keyof typeof visibleColumns]}
                            onCheckedChange={() => toggleColumn(column)}
                          />
                          <Label htmlFor={column} className="capitalize">
                            {column === "changePercent" ? "% Change" :
                              column === "marketCap" ? "Market Cap (T)" :
                                column === "peRatio" ? "P/E Ratio" :
                                  column === "volume" ? "Volume (M)" :
                                    column}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                {isLoading ? (
                  <div className="flex justify-center items-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    <span className="ml-2 text-muted-foreground">Loading stock data...</span>
                  </div>
                ) : (
                  <table className="w-full">
                    <thead>
                      <tr className="bg-muted/50">
                        {visibleColumns.symbol && <th className="p-2 text-left text-xs font-medium text-muted-foreground">Symbol</th>}
                        {visibleColumns.name && <th className="p-2 text-left text-xs font-medium text-muted-foreground">Name</th>}
                        {visibleColumns.price && <th className="p-2 text-right text-xs font-medium text-muted-foreground">Price</th>}
                        {visibleColumns.change && <th className="p-2 text-right text-xs font-medium text-muted-foreground">Change</th>}
                        {visibleColumns.changePercent && <th className="p-2 text-right text-xs font-medium text-muted-foreground">% Change</th>}
                        {visibleColumns.volume && <th className="p-2 text-right text-xs font-medium text-muted-foreground">Volume (M)</th>}
                        {visibleColumns.marketCap && <th className="p-2 text-right text-xs font-medium text-muted-foreground">Market Cap (T)</th>}
                        {visibleColumns.peRatio && <th className="p-2 text-right text-xs font-medium text-muted-foreground">P/E Ratio</th>}
                        {visibleColumns.favorite && <th className="p-2 text-center text-xs font-medium text-muted-foreground">Favorite</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {paginatedTickers.map((ticker) => (
                        <tr key={ticker.symbol} className="hover:bg-muted/50">
                          {visibleColumns.symbol && (
                            <td className="p-2 text-left font-medium text-sm">
                              <Button
                                variant="link"
                                className="p-0 h-auto font-medium"
                                onClick={() => openStockDetail(ticker.symbol)}
                              >
                                {ticker.symbol}
                              </Button>
                            </td>
                          )}
                          {visibleColumns.name && <td className="p-2 text-left text-muted-foreground text-sm">{ticker.name}</td>}
                          {visibleColumns.price && <td className="p-2 text-right font-medium text-sm">${ticker.price.toFixed(2)}</td>}
                          {visibleColumns.change && (
                            <td className={`p-2 text-right text-sm ${ticker.change >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                              {ticker.change > 0 ? '+' : ''}{ticker.change.toFixed(2)}
                            </td>
                          )}
                          {visibleColumns.changePercent && (
                            <td className="p-2 text-right text-sm">
                              <span className={`px-2 py-1 rounded-md text-white ${ticker.changePercent >= 0 ? 'bg-emerald-600' : 'bg-red-600'}`}>
                                {ticker.changePercent > 0 ? '+' : ''}{ticker.changePercent.toFixed(2)}%
                              </span>
                            </td>
                          )}
                          {visibleColumns.volume && <td className="p-2 text-right text-sm">{ticker.volume.toFixed(1)}</td>}
                          {visibleColumns.marketCap && <td className="p-2 text-right text-sm">{ticker.marketCap.toFixed(2)}</td>}
                          {visibleColumns.peRatio && <td className="p-2 text-right text-sm">{ticker.peRatio > 0 ? ticker.peRatio.toFixed(1) : 'N/A'}</td>}
                          {visibleColumns.favorite && (
                            <td className="p-2 text-center">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => toggleFavorite(ticker.symbol)}
                                className={ticker.favorite ? 'text-amber-400 hover:text-amber-500' : 'text-muted-foreground hover:text-foreground'}
                              >
                                {ticker.favorite ? <Star className="h-4 w-4 fill-current" /> : <StarOff className="h-4 w-4" />}
                              </Button>
                            </td>
                          )}
                        </tr>
                      ))}
                      {paginatedTickers.length === 0 && (
                        <tr>
                          <td colSpan={Object.values(visibleColumns).filter(Boolean).length} className="p-4 text-center text-muted-foreground">
                            No tickers found. Try adjusting your search.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Rows per page:</span>
                <Select
                  value={rowsPerPage.toString()}
                  onValueChange={(value) => {
                    const newRowsPerPage = parseInt(value);
                    setRowsPerPage(newRowsPerPage);
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="w-[70px] h-8">
                    <SelectValue placeholder={rowsPerPage.toString()} />
                  </SelectTrigger>
                  <SelectContent>
                    {[10, 15, 25, 50, 100].map(size => (
                      <SelectItem key={size} value={size.toString()}>
                        {size}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="text-sm text-muted-foreground">
                Showing {filteredTickers.length > 0 ? startIndex + 1 : 0}-{Math.min(startIndex + rowsPerPage, filteredTickers.length)} of {filteredTickers.length}
              </div>

              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages || totalPages === 0}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stock Detail Dialog */}
      <StockDetailDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        symbol={selectedSymbol}
      />
    </div>
  );
}
