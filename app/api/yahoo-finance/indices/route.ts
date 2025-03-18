import { NextResponse } from 'next/server';
import yahooFinance from 'yahoo-finance2';

// List of major indices to fetch
const INDICES = [
  '^GSPC',   // S&P 500
  '^DJI',    // Dow Jones Industrial Average
  '^IXIC',   // NASDAQ Composite
  '^RUT',    // Russell 2000
  '^FTSE',   // FTSE 100
  '^N225',   // Nikkei 225
  '^HSI',    // Hang Seng
  '^GDAXI',  // DAX
];

export async function GET() {
  try {
    // Fetch quotes for all indices
    const quotes = [];

    for (const symbol of INDICES) {
      try {
        const quote = await yahooFinance.quote(symbol);
        quotes.push(quote);
      } catch (err) {
        console.error(`Error fetching quote for ${symbol}:`, err);
      }
    }

    return NextResponse.json({ quotes });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch market indices' },
      { status: 500 }
    );
  }
}
