import { NextResponse } from 'next/server';
import yahooFinance from 'yahoo-finance2';

// Cache structure
type CacheEntry<T> = {
  data: T;
  timestamp: number;
  expiresAt: number;
};

type CacheStore = {
  [key: string]: CacheEntry<any>;
};

// Configure cache expiry times (in milliseconds)
const CACHE_TTL = {
  QUOTE: 5 * 1000, // 5 seconds for real-time quote data
  CHART: 60 * 1000, // 1 minute for chart data
  SEARCH: 60 * 1000, // 1 minute for search results
  MARKET_DATA: 5 * 1000, // 5 seconds for real-time market data
  TRENDING: 10 * 1000, // 10 seconds for trending data
  STOCK_DETAILS: 15 * 1000, // 15 seconds for detailed stock info
  NEWS: 60 * 1000, // 1 minute for news
  SCREENER: 15 * 1000, // 15 seconds for screener data
  QUOTE_SUMMARY: 30 * 1000, // 30 seconds for quote summary
  HISTORICAL: 5 * 60 * 1000, // 5 minutes for historical data
  INSIGHTS: 2 * 60 * 1000, // 2 minutes for insights data
  OPTIONS: 60 * 1000, // 1 minute for options data
};

// Helper function to format percentages
function formatPercentage(value: number): string {
  return `${value.toFixed(2)}%`;
}

// Helper function to format numbers with commas
function formatNumberWithCommas(value: number): string {
  return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// Global cache object
const cache: CacheStore = {};

/**
 * Get data from the cache if valid, or fetch from the source and cache
 */
async function cachedFetch<T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttl: number = CACHE_TTL.QUOTE
): Promise<T> {
  const now = Date.now();
  const cacheEntry = cache[key];

  // If cache entry exists and hasn't expired
  if (cacheEntry && now < cacheEntry.expiresAt) {
    console.log(`Cache hit for ${key}`);
    return cacheEntry.data;
  }

  // Fetch fresh data
  console.log(`Cache miss for ${key}, fetching fresh data`);
  const data = await fetchFn();

  // Store in cache
  cache[key] = {
    data,
    timestamp: now,
    expiresAt: now + ttl
  };

  return data;
}

/**
 * Clear cache entries related to a symbol
 */
function clearSymbolCache(symbol: string): void {
  const symbolKey = symbol.toUpperCase();
  Object.keys(cache).forEach(key => {
    if (key.includes(symbolKey)) {
      delete cache[key];
    }
  });
}

/**
 * Clear all cache
 */
function clearAllCache(): void {
  Object.keys(cache).forEach(key => {
    delete cache[key];
  });
}

/**
 * Get quote for a symbol with caching
 */
export async function getQuote(symbol: string) {
  const cacheKey = `QUOTE_${symbol.toUpperCase()}`;
  return cachedFetch(
    cacheKey,
    () => yahooFinance.quote(symbol),
    CACHE_TTL.QUOTE
  );
}

/**
 * Get stock details with caching
 */
export async function getStockDetails(symbol: string) {
  const cacheKey = `DETAILS_${symbol.toUpperCase()}`;

  return cachedFetch(
    cacheKey,
    async () => {
      // Fetch detailed quote information
      const quote = await yahooFinance.quote(symbol);

      // Fetch additional info - company profile
      let profile = null;
      try {
        profile = await yahooFinance.quoteSummary(symbol, { modules: ["assetProfile"] });
      } catch (err) {
        console.error(`Error fetching profile for ${symbol}:`, err);
      }

      // Fetch news
      let news = [];
      try {
        const newsResults = await yahooFinance.search(symbol, { newsCount: 5 });
        news = newsResults.news || [];
      } catch (err) {
        console.error(`Error fetching news for ${symbol}:`, err);
      }

      return {
        quote,
        profile: profile?.assetProfile || null,
        news
      };
    },
    CACHE_TTL.STOCK_DETAILS
  );
}

/**
 * Get quote summary with caching
 */
export async function getQuoteSummary(symbol: string, modules: string[]) {
  const moduleKey = modules.sort().join(',');
  const cacheKey = `QUOTE_SUMMARY_${symbol.toUpperCase()}_${moduleKey}`;

  return cachedFetch(
    cacheKey,
    () => yahooFinance.quoteSummary(symbol, { modules }),
    CACHE_TTL.QUOTE_SUMMARY
  );
}

/**
 * Get chart data with caching
 */
export async function getChartData(symbol: string, range = '3mo', interval = '1d') {
  const cacheKey = `CHART_${symbol.toUpperCase()}_${range}_${interval}`;

  return cachedFetch(
    cacheKey,
    async () => {
      // Calculate date range based on the requested range
      const endDate = new Date();
      const startDate = new Date();

      // Set start date based on range parameter
      switch (range) {
        case '1mo':
          startDate.setMonth(endDate.getMonth() - 1);
          break;
        case '3mo':
          startDate.setMonth(endDate.getMonth() - 3);
          break;
        case '6mo':
          startDate.setMonth(endDate.getMonth() - 6);
          break;
        case '1y':
          startDate.setFullYear(endDate.getFullYear() - 1);
          break;
        case '2y':
          startDate.setFullYear(endDate.getFullYear() - 2);
          break;
        case '5y':
          startDate.setFullYear(endDate.getFullYear() - 5);
          break;
        default:
          startDate.setMonth(endDate.getMonth() - 3); // Default to 3 months
      }

      // Configure the query options
      const queryOptions = {
        interval,
        period1: startDate,
        period2: endDate
      };

      return yahooFinance.chart(symbol, queryOptions);
    },
    CACHE_TTL.CHART
  );
}

/**
 * Get search results with caching
 */
export async function getSearch(query: string, category = 'stocks', newsCount = 5) {
  const cacheKey = `SEARCH_${query.toLowerCase()}_${category}_${newsCount}`;

  return cachedFetch(
    cacheKey,
    async () => {
      // For crypto, modify query if needed
      let searchQuery = query;
      if (category === 'crypto' &&
          !query.toUpperCase().includes('-USD') &&
          !query.toUpperCase().endsWith('USD')) {
        searchQuery = `${query}-USD`;
      }

      const options = category === 'news' ? { newsCount } : undefined;
      return yahooFinance.search(searchQuery, options);
    },
    CACHE_TTL.SEARCH
  );
}

/**
 * Get screener results with caching
 */
export async function getScreener(screnerId = 'most_actives', count = 40) {
  const cacheKey = `SCREENER_${screnerId}_${count}`;

  return cachedFetch(
    cacheKey,
    async () => {
      const queryOptions = {
        scrIds: screnerId,
        count: count,
        region: "US",
        lang: "en-US",
      };

      return yahooFinance.screener(queryOptions, {
        validateResult: false,
      });
    },
    CACHE_TTL.SCREENER
  );
}

/**
 * Get market data with caching
 */
export async function getMarketData() {
  const cacheKey = `MARKET_DATA`;

  return cachedFetch(
    cacheKey,
    async () => {
      // Major market indices to track
      const indices = ['^GSPC', '^DJI', '^IXIC', '^RUT']; // S&P 500, Dow Jones, NASDAQ, Russell 2000

      // Popular stocks to track
      const trendingStocks = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'NVDA', 'TSLA'];

      // Fetch indices data
      const indicesData = await Promise.all(
        indices.map(async (symbol) => {
          try {
            const quote = await yahooFinance.quote(symbol);
            return {
              symbol: quote.symbol,
              shortName: quote.shortName || quote.symbol,
              price: quote.regularMarketPrice || 0,
              change: quote.regularMarketChange || 0,
              changePercent: quote.regularMarketChangePercent || 0,
            };
          } catch (error) {
            console.error(`Error fetching index ${symbol}:`, error);
            return null;
          }
        })
      );

      // Fetch trending stocks data
      const trendingData = await Promise.all(
        trendingStocks.map(async (symbol) => {
          try {
            const quote = await yahooFinance.quote(symbol);
            return {
              symbol: quote.symbol,
              shortName: quote.shortName || quote.symbol,
              price: quote.regularMarketPrice || 0,
              change: quote.regularMarketChange || 0,
              changePercent: quote.regularMarketChangePercent || 0,
            };
          } catch (error) {
            console.error(`Error fetching stock ${symbol}:`, error);
            return null;
          }
        })
      );

      // Fetch market news
      let newsData = [];
      try {
        const searchResults = await yahooFinance.search('market', { newsCount: 5 });
        newsData = (searchResults.news || []).map(item => ({
          title: item.title,
          publisher: item.publisher,
          link: item.link,
          time: new Date(item.providerPublishTime).toLocaleDateString()
        }));
      } catch (error) {
        console.error('Error fetching news:', error);
      }

      return {
        indices: indicesData.filter(item => item !== null),
        trending: trendingData.filter(item => item !== null),
        news: newsData
      };
    },
    CACHE_TTL.MARKET_DATA
  );
}

/**
 * Get trending data with caching
 */
export async function getTrendingData() {
  const cacheKey = `TRENDING_DATA`;

  return cachedFetch(
    cacheKey,
    async () => {
      // Use trendingSymbols from API instead of hardcoded list
      let dynamicTrendingSymbols = [];
      try {
        // This pulls actual trending symbols from Yahoo
        const trendingResults = await yahooFinance.trendingSymbols('US');
        if (trendingResults && trendingResults.quotes && trendingResults.quotes.length > 0) {
          dynamicTrendingSymbols = trendingResults.quotes.slice(0, 6).map(q => q.symbol);
        }
      } catch (error) {
        console.warn('Could not fetch dynamic trending symbols, using default list:', error);
      }

      // Fallback list if API fails
      const fallbackTrendingSymbols = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'NVDA'];

      // Use dynamic list if available, otherwise fall back to default
      const symbolsToFetch = dynamicTrendingSymbols.length > 0 ? dynamicTrendingSymbols : fallbackTrendingSymbols;

      // Fetch trending stocks using the dynamic or fallback list
      const trendingStocks = await Promise.all(
        symbolsToFetch.map(async (symbol) => {
          try {
            const quote = await yahooFinance.quote(symbol);
            return {
              symbol: quote.symbol,
              shortName: quote.shortName || quote.symbol,
              regularMarketPrice: quote.regularMarketPrice || 0,
              formattedPrice: formatNumberWithCommas(quote?.regularMarketPrice || 0),
              regularMarketChange: quote.regularMarketChange || 0,
              regularMarketChangePercent: quote.regularMarketChangePercent || 0,
              formattedChangePercent: formatPercentage(quote.regularMarketChangePercent),
              trending: true, // Flag as trending for UI
            };
          } catch (error) {
            console.error(`Error fetching stock ${symbol}:`, error);
            return null;
          }
        })
      );

      // Get dynamic list of market indices based on region
      const indicesMap = {
        'US': ['^GSPC', '^DJI', '^IXIC'], // S&P 500, Dow Jones, NASDAQ
        'EU': ['^STOXX50E', '^GDAXI', '^FTSE'], // Euro STOXX 50, DAX, FTSE 100
        'ASIA': ['^N225', '^HSI', '^SSEC'], // Nikkei, Hang Seng, Shanghai
      };

      // Default to US indices, but could be region-aware in the future
      const region = 'US';
      const indicesToFetch = indicesMap[region];

      // Fetch major market indices
      const indices = await Promise.all(
        indicesToFetch.map(async (symbol) => {
          try {
            const quote = await yahooFinance.quote(symbol);
            return {
              symbol: quote.symbol,
              shortName: quote.shortName || quote.symbol,
              regularMarketPrice: quote.regularMarketPrice || 0,
              formattedPrice: formatNumberWithCommas(quote.regularMarketPrice),
              regularMarketChange: quote.regularMarketChange || 0,
              regularMarketChangePercent: quote.regularMarketChangePercent || 0,
              formattedChangePercent: formatPercentage(quote.regularMarketChangePercent),
            };
          } catch (error) {
            console.error(`Error fetching index ${symbol}:`, error);
            return null;
          }
        })
      );

      // Dynamic list of top cryptocurrencies - could be expanded
      const cryptosToFetch = ['BTC-USD', 'ETH-USD', 'SOL-USD', 'XRP-USD'].slice(0, 3);

      // Fetch top cryptocurrencies
      const cryptos = await Promise.all(
        cryptosToFetch.map(async (symbol) => {
          try {
            const quote = await yahooFinance.quote(symbol);
            return {
              symbol: quote.symbol,
              shortName: quote.shortName || quote.symbol,
              regularMarketPrice: quote.regularMarketPrice || 0,
              formattedPrice: formatNumberWithCommas(quote.regularMarketPrice),
              regularMarketChange: quote.regularMarketChange || 0,
              regularMarketChangePercent: quote.regularMarketChangePercent || 0,
              formattedChangePercent: formatPercentage(quote.regularMarketChangePercent),
            };
          } catch (error) {
            console.error(`Error fetching crypto ${symbol}:`, error);
            return null;
          }
        })
      );

      return {
        trending: trendingStocks.filter(stock => stock !== null),
        indices: indices.filter(index => index !== null),
        crypto: cryptos.filter(crypto => crypto !== null),
      };
    },
    CACHE_TTL.TRENDING
  );
}

export {
  clearSymbolCache,
  clearAllCache,
  CACHE_TTL
};
