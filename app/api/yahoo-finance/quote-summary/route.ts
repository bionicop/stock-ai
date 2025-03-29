import { NextResponse } from 'next/server';
import { getQuoteSummary } from '@/lib/yahoo/yahooFinanceCache';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const symbol = url.searchParams.get('symbol');
    const modules = url.searchParams.get('modules') || 'price';

    if (!symbol) {
      return NextResponse.json(
        { error: 'Symbol parameter is required' },
        { status: 400 }
      );
    }

    // Parse modules parameter - can be comma-separated string
    const modulesList = modules.split(',').map(module => module.trim());

    const data = await getQuoteSummary(symbol, modulesList);

    return NextResponse.json(data);
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch quote summary' },
      { status: 500 }
    );
  }
}
