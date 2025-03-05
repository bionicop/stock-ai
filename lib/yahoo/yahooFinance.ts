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

    // Format the stock details
    return {
      symbol: data.quote.symbol,
      name: data.quote.longName || data.quote.shortName || data.quote.symbol,
      price: data.quote.regularMarketPrice,
      change: data.quote.regularMarketChange || 0,
      changePercent: data.quote.regularMarketChangePercent || 0,
      volume: (data.quote.regularMarketVolume || 0) / 1000000,
      marketCap: (data.quote.marketCap || 0) / 1000000000000,
      peRatio: data.quote.trailingPE || 0,
      sector: data.profile?.sector || 'Unknown',
      industry: data.profile?.industry || 'Unknown',
      beta: data.quote.beta || 0,
      avgVolume: (data.quote.averageDailyVolume10Day || 0) / 1000000,
      yearHigh: data.quote.fiftyTwoWeekHigh || 0,
      yearLow: data.quote.fiftyTwoWeekLow || 0,
      dividendYield: data.quote.dividendYield ? data.quote.dividendYield * 100 : 0,
      eps: data.quote.epsTrailingTwelveMonths || 0,
      description: data.profile?.longBusinessSummary || ''
    };
  } catch (error) {
    console.error('Error fetching stock details:', error);
    throw error;
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

    // Format chart data
    if (!data.chart || !data.chart.result || data.chart.result.length === 0) {
      return [];
    }

    const result = data.chart.result[0];
    const timestamps = result.timestamp || [];
    const quotes = result.indicators.quote[0] || {};
    const chartData = [];

    for (let i = 0; i < timestamps.length; i++) {
      if (!quotes.close || quotes.close[i] === null) continue;

      chartData.push({
        date: new Date(timestamps[i] * 1000).toLocaleDateString(),
        timestamp: timestamps[i],
        open: quotes.open[i],
        high: quotes.high[i],
        low: quotes.low[i],
        close: quotes.close[i],
        volume: quotes.volume ? quotes.volume[i] / 1000000 : 0 // Convert to millions
      });
    }

    return chartData;
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
