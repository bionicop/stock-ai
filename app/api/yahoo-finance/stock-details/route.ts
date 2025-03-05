import { NextResponse } from 'next/server';
import yahooFinance from 'yahoo-finance2';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const symbol = url.searchParams.get('symbol');

    if (!symbol) {
      return NextResponse.json(
        { error: 'Symbol parameter is required' },
        { status: 400 }
      );
    }

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

    return NextResponse.json({
      quote,
      profile: profile?.assetProfile || null,
      news
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stock details' },
      { status: 500 }
    );
  }
}
