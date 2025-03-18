import { NextResponse } from 'next/server';
import yahooFinance from 'yahoo-finance2';

interface MarketData {
  indices: MarketQuote[];
  trending: MarketQuote[];
  news: NewsItem[];
}

interface MarketQuote {
  symbol: string;
  shortName: string;
  price: number;
  change: number;
  changePercent: number;
}

interface NewsItem {
  title: string;
  publisher: string;
  link: string;
  time: string;
}

interface YahooNewsItem {
  title: string;
  publisher: string;
  link: string;
  providerPublishTime: Date;
}

export async function GET() {
  try {
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
    let newsData: NewsItem[] = [];
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

    const marketData: MarketData = {
      indices: indicesData.filter((quote): quote is MarketQuote => quote !== null),
      trending: trendingData.filter((quote): quote is MarketQuote => quote !== null),
      news: newsData
    };

    return NextResponse.json(marketData);
  } catch (error) {
    console.error('Market API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch market data' },
      { status: 500 }
    );
  }
}
