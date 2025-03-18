import { NextResponse } from 'next/server';
import yahooFinance from 'yahoo-finance2';

interface MarketQuote {
  symbol: string;
  shortName: string;
  regularMarketPrice: number;
  regularMarketChange: number;
  regularMarketChangePercent: number;
}

export async function GET() {
  try {
    const trendingSymbols = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'NVDA'];

    // Fetch trending stocks
    const trendingStocks = await Promise.all(
      trendingSymbols.map(async (symbol) => {
        try {
          const quote = await yahooFinance.quote(symbol);
          return {
            symbol: quote.symbol,
            shortName: quote.shortName || quote.symbol,
            regularMarketPrice: quote.regularMarketPrice || 0,
            regularMarketChange: quote.regularMarketChange || 0,
            regularMarketChangePercent: quote.regularMarketChangePercent || 0,
          } as MarketQuote;
        } catch (error) {
          console.error(`Error fetching stock ${symbol}:`, error);
          return null;
        }
      })
    );

    // Fetch major market indices
    const indices = await Promise.all([
      '^GSPC', // S&P 500
      '^DJI',  // Dow Jones
      '^IXIC'  // NASDAQ
    ].map(async (symbol) => {
      try {
        const quote = await yahooFinance.quote(symbol);
        return {
          symbol: quote.symbol,
          shortName: quote.shortName || quote.symbol,
          regularMarketPrice: quote.regularMarketPrice || 0,
          regularMarketChange: quote.regularMarketChange || 0,
          regularMarketChangePercent: quote.regularMarketChangePercent || 0,
        } as MarketQuote;
      } catch (error) {
        console.error(`Error fetching index ${symbol}:`, error);
        return null;
      }
    }));

    // Fetch top cryptocurrencies
    const cryptos = await Promise.all([
      'BTC-USD',
      'ETH-USD'
    ].map(async (symbol) => {
      try {
        const quote = await yahooFinance.quote(symbol);
        return {
          symbol: quote.symbol,
          shortName: quote.shortName || quote.symbol,
          regularMarketPrice: quote.regularMarketPrice || 0,
          regularMarketChange: quote.regularMarketChange || 0,
          regularMarketChangePercent: quote.regularMarketChangePercent || 0,
        } as MarketQuote;
      } catch (error) {
        console.error(`Error fetching crypto ${symbol}:`, error);
        return null;
      }
    }));

    return NextResponse.json({
      trending: trendingStocks.filter((stock): stock is MarketQuote => stock !== null),
      indices: indices.filter((index): index is MarketQuote => index !== null),
      crypto: cryptos.filter((crypto): crypto is MarketQuote => crypto !== null),
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trending data' },
      { status: 500 }
    );
  }
}
