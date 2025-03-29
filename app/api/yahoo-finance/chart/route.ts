import { NextResponse } from 'next/server';
import { getChartData } from '@/lib/yahoo/yahooFinanceCache';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol');
    const range = searchParams.get('range') || '3mo';
    const interval = searchParams.get('interval') || '1d';

    if (!symbol) {
      return NextResponse.json({ error: 'Symbol is required' }, { status: 400 });
    }

    const result = await getChartData(symbol, range, interval);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching chart data:', error);
    return NextResponse.json({ error: 'Failed to fetch chart data' }, { status: 500 });
  }
}
