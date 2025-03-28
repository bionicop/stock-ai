import { NextResponse } from 'next/server';
import { getStockDetails } from '@/lib/yahoo/yahooFinanceCache';

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

    const data = await getStockDetails(symbol);

    return NextResponse.json(data);
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stock details' },
      { status: 500 }
    );
  }
}
