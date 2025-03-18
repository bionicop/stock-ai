import { NextResponse } from 'next/server';
import yahooFinance from 'yahoo-finance2';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol');
    const range = searchParams.get('range') || '3mo';
    const interval = searchParams.get('interval') || '1d';

    if (!symbol) {
      return NextResponse.json({ error: 'Symbol is required' }, { status: 400 });
    }

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
      default:
        startDate.setMonth(endDate.getMonth() - 3);
    }

    // Configure the query options with required period1 and period2 parameters
    const queryOptions = {
      interval,
      period1: startDate,
      period2: endDate
    };

    const result = await yahooFinance.chart(symbol, queryOptions);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching chart data:', error);
    return NextResponse.json({ error: 'Failed to fetch chart data' }, { status: 500 });
  }
}
