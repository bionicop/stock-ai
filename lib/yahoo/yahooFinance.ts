/**
 * Fetch detailed stock information
 */
export async function fetchStockDetails(symbol: string) {
  try {
    const response = await fetch(`/api/yahoo-finance/stock-details?symbol=${encodeURIComponent(symbol)}`);

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    return {
      // Basic Information
      symbol: data.quote.symbol,
      name: data.quote.longName || data.quote.shortName || data.quote.symbol,
      price: data.quote.regularMarketPrice,
      change: data.quote.regularMarketChange || 0,
      changePercent: data.quote.regularMarketChangePercent || 0,

      // Volume Metrics
      volume: (data.quote.regularMarketVolume || 0) / 1000000,
      avgVolume: (data.quote.averageDailyVolume10Day || 0) / 1000000,
      avgVolume3Month: (data.quote.averageDailyVolume3Month || 0) / 1000000,

      // Valuation Metrics
      marketCap: (data.quote.marketCap || 0) / 1000000000000,
      peRatio: data.quote.trailingPE || 0,
      forwardPE: data.quote.forwardPE || 0,
      priceToBook: data.quote.priceToBook || 0,
      priceToSales: data.quote.priceToSales || 0,

      // Financial Metrics
      eps: data.quote.epsTrailingTwelveMonths || 0,
      forwardEps: data.quote.forwardEps || 0,
      epsGrowth: data.quote.epsCurrentYear || 0,
      revenue: (data.quote.totalRevenue || 0) / 1000000000,
      profitMargin: data.quote.profitMargins || 0,

      // Technical Indicators
      beta: data.quote.beta || 0,
      rsi: data.quote.rsi || 0,
      fiftyDayAverage: data.quote.fiftyDayAverage || 0,
      twoHundredDayAverage: data.quote.twoHundredDayAverage || 0,

      // Price Ranges
      yearHigh: data.quote.fiftyTwoWeekHigh || 0,
      yearLow: data.quote.fiftyTwoWeekLow || 0,
      dayHigh: data.quote.regularMarketDayHigh || 0,
      dayLow: data.quote.regularMarketDayLow || 0,

      // Dividend Information
      dividendYield: data.quote.dividendYield ? data.quote.dividendYield * 100 : 0,
      dividendRate: data.quote.dividendRate || 0,
      exDividendDate: data.quote.exDividendDate || null,

      // Company Information
      sector: data.profile?.sector || 'Unknown',
      industry: data.profile?.industry || 'Unknown',
      description: data.profile?.longBusinessSummary || '',
      employees: data.profile?.fullTimeEmployees || 0,
      country: data.profile?.country || 'Unknown',

      // Analyst Ratings
      recommendationMean: data.quote.recommendationMean || 0,
      numberOfAnalystOpinions: data.quote.numberOfAnalystOpinions || 0,
      targetHighPrice: data.quote.targetHighPrice || 0,
      targetLowPrice: data.quote.targetLowPrice || 0,
      targetMedianPrice: data.quote.targetMedianPrice || 0
    };
  } catch (error) {
    console.error('Error fetching stock details:', error);
    throw error;
  }
}

// Add this helper function
function formatChartDate(timestamp: Date | string | number): string {
  try {
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) {
      throw new Error('Invalid date');
    }
    return date.toLocaleDateString();
  } catch (error) {
    console.warn('Invalid timestamp:', timestamp);
    return '';
  }
}

/**
 * Fetch chart data for a stock
 */
export async function fetchStockChartData(symbol: string, range = '3mo', interval = '1d') {
  try {
    const response = await fetch(`/api/yahoo-finance/chart?symbol=${encodeURIComponent(symbol)}&range=${range}&interval=${interval}`);

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();

    // Handle the new API response structure
    if (data.quotes && Array.isArray(data.quotes)) {
      return data.quotes
        .map((quote: any) => {
          if (!quote.date || !quote.close) return null;
          return {
            date: formatChartDate(quote.date),
            high: quote.high || quote.close,
            low: quote.low || quote.close,
            close: quote.close,
            volume: quote.volume ? quote.volume / 1000000 : 0
          };
        })
        .filter((item: any) => item && item.date && item.close != null);
    }

    // Fallback to the old structure if available
    if (data.chart?.result?.[0]) {
      const result = data.chart.result[0];
      const timestamps = result.timestamp || [];
      const quotes = result.indicators.quote[0] || {};

      if (!timestamps.length || !quotes.close) {
        console.error('Missing required chart data');
        return [];
      }

      return timestamps
        .map((timestamp: number, i: number) => {
          if (!timestamp || !quotes.close[i]) return null;
          return {
            date: formatChartDate(timestamp),
            timestamp,
            high: quotes.high?.[i] || quotes.close[i],
            low: quotes.low?.[i] || quotes.close[i],
            close: quotes.close[i],
            volume: quotes.volume?.[i] ? quotes.volume[i] / 1000000 : 0
          };
        })
        .filter((item: any) => item && item.date && item.close != null);
    }

    console.error('Invalid chart data structure:', data);
    return [];
  } catch (error) {
    console.error('Error fetching stock chart data:', error);
    return [];
  }
}

/**
 * Fetch news for a stock
 */
export async function fetchStockNews(symbol: string, count = 5) {
  try {
    const response = await fetch(`/api/yahoo-finance/stock-details?symbol=${encodeURIComponent(symbol)}`);

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    const news = data.news || [];

    // Format news data
    return news.slice(0, count).map((item: any) => ({
      title: item.title,
      time: new Date(item.providerPublishTime * 1000).toLocaleDateString(),
      url: item.link,
      publisher: item.publisher,
      impact: getNewsImpact(item.title)
    }));
  } catch (error) {
    console.error('Error fetching stock news:', error);
    return [];
  }
}

// Helper function to determine news impact based on keywords in title
function getNewsImpact(title: string) {
  const lowercaseTitle = title.toLowerCase();

  // High impact keywords
  const highImpactKeywords = ['crash', 'surge', 'plunge', 'soars', 'tumbles', 'bankruptcy', 'scandal', 'investigation', 'lawsuit'];
  // Medium impact keywords
  const mediumImpactKeywords = ['earnings', 'reports', 'announces', 'dividend', 'guidance', 'forecast', 'outlook', 'acquisition'];

  if (highImpactKeywords.some(keyword => lowercaseTitle.includes(keyword))) {
    return 'high';
  } else if (mediumImpactKeywords.some(keyword => lowercaseTitle.includes(keyword))) {
    return 'medium';
  } else {
    return 'low';
  }
}
