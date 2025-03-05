import { NextResponse } from 'next/server';
import yahooFinance from 'yahoo-finance2';
import { SCREENER_OPTIONS, DEFAULT_SCREENER } from '@/lib/yahoo/constants';

export async function POST(request: Request) {
  try {
    const { screenerId, favorites = [] } = await request.json();

    let result;
    if (screenerId === "favorites" && favorites.length > 0) {
      // Fetch data for favorite symbols
      const quotes = [];
      for (const symbol of favorites) {
        try {
          const quote = await yahooFinance.quote(symbol);
          quotes.push(quote);
        } catch (err) {
          console.error(`Error fetching quote for ${symbol}:`, err);
        }
      }
      result = { quotes };
    } else {
      // Use screener for other filters
      const actualScreenerId = screenerId === "favorites" ? DEFAULT_SCREENER : screenerId;
      const queryOptions = {
        scrIds: actualScreenerId,
        count: 40,
        region: "US",
        lang: "en-US",
      };

      result = await yahooFinance.screener(queryOptions, {
        validateResult: false,
      });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Failed to fetch stock data' }, { status: 500 });
  }
}
