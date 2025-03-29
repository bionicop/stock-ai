import { NextResponse } from 'next/server';
import { getSearch } from '@/lib/yahoo/yahooFinanceCache';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const query = url.searchParams.get('query');
    const category = url.searchParams.get('category') || 'stocks';
    const newsCount = parseInt(url.searchParams.get('newsCount') || '5', 10);

    if (!query) {
      return NextResponse.json(
        { error: 'Query parameter is required' },
        { status: 400 }
      );
    }

    // Use our caching service to get search results
    const searchResults = await getSearch(query, category, newsCount);

    let filteredResults = [];

    // Filter based on category
    switch (category) {
      case 'stocks':
        filteredResults = searchResults.quotes?.filter(q =>
          q.quoteType === 'EQUITY' || q.quoteType === 'ETF'
        ) || [];
        break;

      case 'news':
        filteredResults = searchResults.news?.map(item => ({
          symbol: item.publisher,
          name: item.title,
          type: 'News',
          url: item.link,
          time: item.providerPublishTime * 1000 // Convert to milliseconds for JS Date
        })) || [];
        break;

      case 'markets':
        filteredResults = searchResults.quotes?.filter(q =>
          q.quoteType === 'INDEX' || q.quoteType === 'MUTUALFUND'
        ) || [];
        break;

      case 'crypto':
        filteredResults = searchResults.quotes?.filter(q =>
          q.quoteType === 'CRYPTOCURRENCY'
        ) || [];

        // If no results, try to get general crypto results
        if (filteredResults.length === 0) {
          try {
            const generalCryptoResults = await getSearch('crypto', 'stocks');
            filteredResults = generalCryptoResults.quotes?.filter(q =>
              q.quoteType === 'CRYPTOCURRENCY'
            ).slice(0, 10) || [];
          } catch (error) {
            console.error('Crypto search error:', error);
          }
        }
        break;

      default:
        filteredResults = searchResults.quotes || [];
    }

    // Format the results consistently
    const formattedResults = filteredResults.map(item => {
      if (item.type === 'News') {
        return {
          symbol: item.symbol || '',
          name: item.name || 'Unknown',
          type: item.type || 'News',
          url: item.url || '',
          time: item.time || null
        };
      } else {
        return {
          symbol: item.symbol || '',
          name: item.shortname || item.longname || item.name || 'Unknown',
          type: item.quoteType || item.type || 'Unknown'
        };
      }
    });

    return NextResponse.json(formattedResults);
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch search results' },
      { status: 500 }
    );
  }
}
