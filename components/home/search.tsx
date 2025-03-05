"use client";

import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search as SearchIcon, X, Clock, ChevronLeft, ChevronRight, TrendingUp, BarChart2, Globe, History, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Skeleton } from "@/components/ui/skeleton";
import { useDebounce } from "@/hooks/use-debounce";
import { useSearchHistory } from "@/hooks/use-search-history";

type SearchResult = {
  symbol: string;
  name: string;
  type: string;
  url?: string;
  time?: string;
};

interface SearchProps {
  expanded?: boolean;
  onSearchStateChange?: (isSearching: boolean) => void;
}

export default function Search({ expanded = false, onSearchStateChange }: SearchProps) {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 300);
  const [activeTab, setActiveTab] = useState("stocks");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(expanded);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showHistory, setShowHistory] = useState(false);
  const resultsPerPage = 5;
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { history, addToHistory, removeFromHistory, clearHistory, getRecentSearches } = useSearchHistory();

  // Focus the input when expanded
  useEffect(() => {
    if (isExpanded && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isExpanded]);

  // Notify parent component when search state changes
  useEffect(() => {
    if (onSearchStateChange) {
      onSearchStateChange(isExpanded);
    }
  }, [isExpanded, onSearchStateChange]);

  // Auto-search when debounced query changes
  useEffect(() => {
    if (debouncedQuery) {
      performSearch(debouncedQuery, activeTab);
    } else {
      setResults([]);
    }
  }, [debouncedQuery, activeTab]);

  // Reset to page 1 when query or tab changes
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedQuery, activeTab]);

  // Function to handle search
  const performSearch = async (searchQuery: string, category: string) => {
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    setIsExpanded(true);
    setShowHistory(false);

    try {
      // Add to search history
      addToHistory(searchQuery, category);

      // First, search for results based on the query and active tab
      const searchResponse = await fetchSearchResults(searchQuery, category);

      if (searchResponse && searchResponse.length > 0) {
        // If we have search results, display them
        setResults(searchResponse);
        setTotalPages(Math.ceil(searchResponse.length / resultsPerPage));
      } else {
        // If no search results, try a direct symbol lookup
        try {
          const response = await axios.get(`/api/yahoo-finance/stock-details?symbol=${searchQuery}`);

          if (response.data && !response.data.error && response.data.quote) {
            // If it's a valid symbol and has quote data, create a search result for it
            setResults([{
              symbol: response.data.quote.symbol || searchQuery,
              name: response.data.quote.shortName || response.data.quote.longName || 'Unknown',
              type: response.data.quote.quoteType || 'Stock'
            }]);
            setTotalPages(1);
          } else {
            // No results found
            setResults([]);
            setTotalPages(0);
          }
        } catch (error) {
          console.error('Error fetching stock details:', error);
          setResults([]);
          setTotalPages(0);
        }
      }
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
      setTotalPages(0);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to fetch search results based on tab
  const fetchSearchResults = async (searchQuery: string, category: string) => {
    try {
      // Call the Yahoo Finance search API with query and category
      const response = await axios.get(`/api/yahoo-finance/search?query=${encodeURIComponent(searchQuery)}&category=${category}`);
      return response.data || [];
    } catch (error) {
      console.error('Error fetching search results:', error);
      return [];
    }
  };

  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  // Handle expanding the search
  const handleExpandSearch = () => {
    setIsExpanded(true);
  };

  // Handle item selection
  const handleItemSelect = (item: SearchResult) => {
    if (item.url) {
      // For news items with URLs, open in a new tab
      window.open(item.url, '_blank');
    } else {
      // For stocks and other items, navigate to the stock page
      router.push(`/stock/${item.symbol}`);
    }
  };

  // Handle history item click
  const handleHistoryItemClick = (item: { query: string; category: string }) => {
    setQuery(item.query);
    setActiveTab(item.category);
    performSearch(item.query, item.category);
  };

  // Handle removing history item
  const handleRemoveHistoryItem = (e: React.MouseEvent, item: { query: string; category: string }) => {
    e.stopPropagation();
    removeFromHistory(item.query, item.category);
  };

  // Get current page items
  const getCurrentPageItems = () => {
    const startIndex = (currentPage - 1) * resultsPerPage;
    const endIndex = startIndex + resultsPerPage;
    return results.slice(startIndex, endIndex);
  };

  // Format timestamp
  const formatTime = (timestamp: string | undefined) => {
    if (!timestamp) return '';

    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.round(diffMs / 60000);
      const diffHours = Math.round(diffMs / 3600000);
      const diffDays = Math.round(diffMs / 86400000);

      if (diffMins < 60) {
        return `${diffMins}m ago`;
      } else if (diffHours < 24) {
        return `${diffHours}h ago`;
      } else {
        return `${diffDays}d ago`;
      }
    } catch (e) {
      return '';
    }
  };

  // Format relative time for history items
  const formatRelativeTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor(diff / (1000 * 60));

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    return `${minutes}m ago`;
  };

  // Get appropriate icon for result type
  const getIconForType = (type: string) => {
    switch (type.toLowerCase()) {
      case 'equity':
        return <TrendingUp className="h-4 w-4" />;
      case 'etf':
        return <BarChart2 className="h-4 w-4" />;
      case 'index':
        return <Globe className="h-4 w-4" />;
      default:
        return null;
    }
  };

  return (
    <div className={`mx-auto w-full transition-all duration-300 ${isExpanded ? 'max-w-3xl' : 'max-w-2xl'}`}>
      <div className="relative">
        <div className="relative rounded-full border shadow-sm">
          <Input
            ref={inputRef}
            type="text"
            placeholder="Search for stocks, news, or market data..."
            className="h-14 rounded-full border-none pl-12 pr-12 text-lg"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setShowHistory(!e.target.value);
            }}
            onFocus={() => setShowHistory(!query)}
            onClick={handleExpandSearch}
          />
          <SearchIcon className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          {query && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-14 top-1/2 -translate-y-1/2"
              onClick={() => {
                setQuery("");
                setShowHistory(true);
              }}
            >
              <X className="h-5 w-5" />
            </Button>
          )}
          <Button
            className="absolute right-1 top-1/2 h-12 w-12 -translate-y-1/2 rounded-full"
            onClick={() => performSearch(query, activeTab)}
          >
            <SearchIcon className="h-5 w-5" />
          </Button>
        </div>

        {isExpanded && (showHistory ? (
          // Search History View
          <Card className="mt-4 w-full overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <History className="h-5 w-5 text-muted-foreground" />
                  <h3 className="font-medium">Recent Searches</h3>
                </div>
                {history.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearHistory}
                    className="text-xs text-muted-foreground hover:text-destructive"
                  >
                    Clear All
                  </Button>
                )}
              </div>
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {getRecentSearches(activeTab).length > 0 ? (
                  getRecentSearches(activeTab).map((item, index) => (
                    <div
                      key={index}
                      onClick={() => handleHistoryItemClick(item)}
                      className="flex items-center justify-between p-3 rounded-md hover:bg-accent cursor-pointer group"
                    >
                      <div className="flex items-center gap-3">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{item.query}</p>
                          <p className="text-xs text-muted-foreground">
                            {item.category} • {formatRelativeTime(item.timestamp)}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => handleRemoveHistoryItem(e, item)}
                      >
                        <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                      </Button>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No recent searches
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          // Regular Search Results View
          <Card className="mt-4 w-full overflow-hidden">
            <Tabs defaultValue={activeTab} onValueChange={handleTabChange}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="stocks">Stocks</TabsTrigger>
                <TabsTrigger value="news">News</TabsTrigger>
                <TabsTrigger value="markets">Indices</TabsTrigger>
                <TabsTrigger value="crypto">Crypto</TabsTrigger>
              </TabsList>

              <CardContent className="p-4">
                <div className="max-h-[400px] overflow-y-auto">
                  {isLoading ? (
                    <div className="space-y-2">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-center space-x-4 p-3">
                          <div className="space-y-2">
                            <Skeleton className="h-4 w-[100px]" />
                            <Skeleton className="h-4 w-[200px]" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : getCurrentPageItems().length > 0 ? (
                    <div className="space-y-2">
                      {getCurrentPageItems().map((item, index) => (
                        <div
                          key={index}
                          className="cursor-pointer rounded-md p-3 hover:bg-accent"
                          onClick={() => handleItemSelect(item)}
                        >
                          {activeTab === 'news' ? (
                            // News layout - more space for title and publisher with timestamp
                            <div>
                              <p className="font-medium line-clamp-2">{item.name}</p>
                              <div className="mt-1 flex items-center justify-between">
                                <p className="text-sm text-muted-foreground">
                                  {item.symbol}
                                </p>
                                {item.time && (
                                  <div className="flex items-center text-xs text-muted-foreground">
                                    <Clock className="mr-1 h-3 w-3" />
                                    <span>{formatTime(item.time)}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          ) : (
                            // Stocks/Markets layout
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                {getIconForType(item.type) && (
                                  <div className="mr-2 text-muted-foreground">
                                    {getIconForType(item.type)}
                                  </div>
                                )}
                                <div>
                                  <p className="font-medium">{item.symbol}</p>
                                  <p className="text-sm text-muted-foreground line-clamp-1">
                                    {item.name}
                                  </p>
                                </div>
                              </div>
                              {activeTab !== 'news' && (
                                <span className="ml-2 text-xs text-muted-foreground whitespace-nowrap">
                                  {item.type}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : query ? (
                    <div className="py-8 text-center">
                      <p className="text-muted-foreground">No results found for "{query}"</p>
                    </div>
                  ) : (
                    <div className="py-8 text-center">
                      <p className="text-muted-foreground">
                        {activeTab === 'news' ? 'Search for the latest news' :
                         activeTab === 'markets' ? 'Search for market indices like S&P 500' :
                         activeTab === 'crypto' ? 'Search for cryptocurrencies like Bitcoin' :
                         'Try searching for a stock symbol or company name'}
                      </p>
                    </div>
                  )}
                </div>

                {/* Pagination controls */}
                {totalPages > 1 && (
                  <div className="mt-4 flex items-center justify-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Tabs>
          </Card>
        ))}
      </div>
    </div>
  );
}
