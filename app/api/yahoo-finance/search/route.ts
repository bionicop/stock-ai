import { NextResponse } from 'next/server';
import yahooFinance from 'yahoo-finance2';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const query = url.searchParams.get('query');
    const category = url.searchParams.get('category') || 'stocks';

    if (!query) {
      return NextResponse.json(
        { error: 'Query parameter is required' },
        { status: 400 }
      );
    }

    // Search for stocks, ETFs, indices, etc.
    const searchResults = await yahooFinance.search(query);

    let filteredResults = [];

    // Filter based on category
    switch (category) {
      case 'stocks':
        filteredResults = searchResults.quotes?.filter(q =>
          q.quoteType === 'EQUITY' || q.quoteType === 'ETF'
        ) || [];
        break;

      case 'news':
        // Fetch news related to the search query with increased count
        const newsResults = await yahooFinance.search(query, { newsCount: 30 });
        filteredResults = newsResults.news?.map(item => ({
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
        // Try to get cryptocurrency results
        // First, add common crypto suffix if not present
        let cryptoQuery = query;
        if (!cryptoQuery.toUpperCase().includes('-USD') &&
            !cryptoQuery.toUpperCase().endsWith('USD')) {
          cryptoQuery = `${cryptoQuery}-USD`;
        }

        try {
          // Try direct lookup for popular cryptos
          const cryptoResults = await yahooFinance.search(cryptoQuery);
          const cryptoQuotes = cryptoResults.quotes?.filter(q =>
            q.quoteType === 'CRYPTOCURRENCY'
          ) || [];

          if (cryptoQuotes.length > 0) {
            filteredResults = cryptoQuotes;
          } else {
            // If no direct match, search for general crypto results
            const generalCryptoResults = await yahooFinance.search('crypto');
            filteredResults = generalCryptoResults.quotes?.filter(q =>
              q.quoteType === 'CRYPTOCURRENCY'
            ).slice(0, 10) || [];
          }
        } catch (error) {
          console.error('Crypto search error:', error);
          filteredResults = [];
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
