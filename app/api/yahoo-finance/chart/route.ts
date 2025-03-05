import { NextResponse } from 'next/server';
import yahooFinance from 'yahoo-finance2';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const symbol = url.searchParams.get('symbol');
    const range = url.searchParams.get('range') || '3mo';
    const interval = url.searchParams.get('interval') || '1d';

    if (!symbol) {
      return NextResponse.json(
        { error: 'Symbol parameter is required' },
        { status: 400 }
      );
    }

    // Fetch chart data
    const chartData = await yahooFinance.chart(symbol, {
      period1: getStartDate(range),
      interval: interval as '1d' | '1wk' | '1mo',
      includePrePost: false
    });

    return NextResponse.json(chartData);
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch chart data' },
      { status: 500 }
    );
  }
}

// Helper function to calculate start date based on range
function getStartDate(range: string): string {
  const now = new Date();

  switch(range) {
    case '1d':
      now.setDate(now.getDate() - 1);
      break;
    case '5d':
      now.setDate(now.getDate() - 5);
      break;
    case '1mo':
      now.setMonth(now.getMonth() - 1);
      break;
    case '3mo':
      now.setMonth(now.getMonth() - 3);
      break;
    case '6mo':
      now.setMonth(now.getMonth() - 6);
      break;
    case '1y':
      now.setFullYear(now.getFullYear() - 1);
      break;
    case '2y':
      now.setFullYear(now.getFullYear() - 2);
      break;
    case '5y':
      now.setFullYear(now.getFullYear() - 5);
      break;
    default:
      now.setMonth(now.getMonth() - 3);
  }

  return now.toISOString().split('T')[0];
}
