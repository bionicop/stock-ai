import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { getQuoteSummary, getStockDetails, getChartData } from '@/lib/yahoo/yahooFinanceCache';

interface StockInfo {
  symbol: string;
  name: string;
  price: number | string;
  change: number;
  changePercent: number;
  pe: number | string;
  marketCap: string;
  sector: string;
  industry: string;
  fiftyTwoWeekLow: number | string;
  fiftyTwoWeekHigh: number | string;
  averageVolume: string;
  dividend: number | string;
  dividendYield: string;
  beta: string;
  targetPrice: number | string;
  analystRating: string;
  shortRatio: number | string;
  earningsDate: string;
  eps: number | string;
  forwardEps: number | string;
  priceToBook: number | string;
  revenuePerShare: number | string;
}

interface NewsItem {
  title: string;
  date: string;
}

interface AnalystOpinion {
  firm: string;
  toGrade: string;
  fromGrade?: string;
  date: string;
}

interface DetailedData {
  fundamentals: {
    returnOnEquity?: string;
    profitMargins?: string;
    revenueGrowth?: string;
    earningsGrowth?: string;
    debtToEquity?: string;
    currentRatio?: string;
    quickRatio?: string;
    priceToBook?: string;
    priceToSales?: string;
    forwardPE?: string;
  };
  technicals: {
    fiftyDayMA?: string | number;
    twoHundredDayMA?: string | number;
    relativeStrengthIndex?: string;
    macdSignal?: string;
    supportLevels?: string;
    resistanceLevels?: string;
  };
  sentiment: Record<string, string | number | {
    current: string | number;
    sevenDaysAgo: string | number;
    thirtyDaysAgo: string | number;
    sixtyDaysAgo: string | number;
    ninetyDaysAgo: string | number;
  }>;
  news: NewsItem[];
  insiderActivity: Record<string, unknown>[];
  analystOpinions: AnalystOpinion[];
  peerComparison: Record<string, unknown>[];
  historicalTrend?: HistoricalDataItem[];
  priceTargets: {
    mean: number | string;
    high: number | string;
    low: number | string;
    numberOfAnalysts: number;
  };
  financialMetrics: {
    revenueGrowth: string;
    profitGrowth: string;
    cashFlow: string;
    debtLevel: string;
  };
}

interface HistoricalDataItem {
  date: string;
  close: number;
  volume: number;
}

interface AnalysisParams {
  stockInfo: StockInfo;
  detailedData: DetailedData;
  horizon: string;
  risk: string;
  investmentAmount: string;
  tradingStyle: string;
}

interface QuoteSummaryResponse {
  price?: {
    symbol?: string;
    longName?: string;
    shortName?: string;
    regularMarketPrice?: number;
    regularMarketChange?: number;
    regularMarketChangePercent?: number;
    marketCap?: number;
    sector?: string;
    industry?: string;
  };
  summaryDetail?: {
    trailingPE?: number;
    fiftyTwoWeekLow?: number;
    fiftyTwoWeekHigh?: number;
    averageVolume?: number;
    dividendRate?: number;
    dividendYield?: number;
    beta?: number;
    forwardPE?: number;
    priceToSalesTrailing12Months?: number;
    fiftyDayAverage?: number;
    twoHundredDayAverage?: number;
  };
  defaultKeyStatistics?: {
    trailingPE?: number;
    targetPrice?: number;
    targetMeanPrice?: number;
    targetHighPrice?: number;
    targetLowPrice?: number;
    numberOfAnalystOpinions?: number;
    shortRatio?: number;
    earningsDate?: number;
    trailingEps?: number;
    forwardEps?: number;
    priceToBook?: number;
    revenuePerShare?: number;
    returnOnEquity?: number;
    profitMargins?: number;
    revenueGrowth?: number;
    earningsGrowth?: number;
    debtToEquity?: number;
    currentRatio?: number;
    quickRatio?: number;
  };
  recommendationTrend?: {
    trend?: Array<{
      strongBuy?: string;
    }>;
  };
  upgradeDowngradeHistory?: {
    history?: UpgradeHistoryItem[];
  };
  earningsTrend?: {
    trend?: Array<{
      earningsEstimate?: {
        avg?: number;
      };
      revenueEstimate?: {
        avg?: number;
      };
      epsTrend?: {
        current?: number;
        '7daysAgo'?: number;
        '30daysAgo'?: number;
        '60daysAgo'?: number;
        '90daysAgo'?: number;
      };
    }>;
  };
  financialData?: {
    revenueGrowth?: number;
    profitGrowth?: number;
    freeCashflow?: number;
    totalDebt?: number;
  };
}

// Create OpenAI client with OpenRouter base URL
const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: 'https://openrouter.ai/api/v1',
  defaultHeaders: {
    'HTTP-Referer': '',
    'X-Title': 'Stock AI Analysis'
  },
});

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const symbol = url.searchParams.get('symbol');
    const horizon = url.searchParams.get('horizon') || 'medium';
    const risk = url.searchParams.get('risk') || 'moderate';
    const investmentAmount = url.searchParams.get('amount') || 'unspecified';
    const tradingStyle = url.searchParams.get('tradingStyle') || 'any';

    // Parameter validation
    if (!symbol) {
      return NextResponse.json({ error: 'Symbol parameter is required' }, { status: 400 });
    }

    let stockInfo = {
      symbol: symbol,
      name: symbol,
      price: 'N/A',
      change: 0,
      changePercent: 0,
      pe: 'N/A',
      marketCap: 'N/A',
      sector: 'Unknown',
      industry: 'Unknown',
      fiftyTwoWeekLow: 'N/A',
      fiftyTwoWeekHigh: 'N/A',
      averageVolume: 'N/A',
      dividend: 'N/A',
      dividendYield: 'N/A',
      beta: 'N/A',
      targetPrice: 'N/A',
      analystRating: 'N/A',
      shortRatio: 'N/A',
      earningsDate: 'N/A',
      eps: 'N/A',
      forwardEps: 'N/A',
      priceToBook: 'N/A',
      revenuePerShare: 'N/A'
    } as StockInfo;

    const detailedData: DetailedData = {
      fundamentals: {},
      technicals: {},
      sentiment: {},
      news: [],
      insiderActivity: [],
      analystOpinions: [],
      peerComparison: [],
      priceTargets: {
        mean: 'N/A',
        high: 'N/A',
        low: 'N/A',
        numberOfAnalysts: 0
      },
      financialMetrics: {
        revenueGrowth: 'N/A',
        profitGrowth: 'N/A',
        cashFlow: 'N/A',
        debtLevel: 'N/A'
      }
    };

    try {
      const quoteSummaryData = await getQuoteSummary(symbol, [
        'price',
        'summaryDetail',
        'defaultKeyStatistics',
        'recommendationTrend',
        'upgradeDowngradeHistory',
        'earningsTrend',
        'financialData'
      ]);

      if (quoteSummaryData) {
        const { price, summaryDetail, defaultKeyStatistics, recommendationTrend, upgradeDowngradeHistory, earningsTrend, financialData } = quoteSummaryData;

        stockInfo = {
          symbol: price?.symbol || symbol,
          name: price?.longName || price?.shortName || symbol,
          price: price?.regularMarketPrice || 'N/A',
          change: price?.regularMarketChange || 0,
          changePercent: price?.regularMarketChangePercent || 0,
          pe: summaryDetail?.trailingPE || defaultKeyStatistics?.trailingPE || 'N/A',
          marketCap: price?.marketCap ? formatMarketCap(price.marketCap) : 'N/A',
          sector: price?.sector || 'Unknown',
          industry: price?.industry || 'Unknown',
          fiftyTwoWeekLow: summaryDetail?.fiftyTwoWeekLow || 'N/A',
          fiftyTwoWeekHigh: summaryDetail?.fiftyTwoWeekHigh || 'N/A',
          averageVolume: summaryDetail?.averageVolume ? formatVolume(summaryDetail.averageVolume) : 'N/A',
          dividend: summaryDetail?.dividendRate || 'N/A',
          dividendYield: summaryDetail?.dividendYield ? (summaryDetail.dividendYield * 100).toFixed(2) + '%' : 'N/A',
          beta: summaryDetail?.beta?.toFixed(2) || 'N/A',
          targetPrice: defaultKeyStatistics?.targetPrice || 'N/A',
          analystRating: recommendationTrend?.trend?.[0]?.strongBuy || 'N/A',
          shortRatio: defaultKeyStatistics?.shortRatio || 'N/A',
          earningsDate: defaultKeyStatistics?.earningsDate ? new Date(defaultKeyStatistics.earningsDate * 1000).toLocaleDateString() : 'N/A',
          eps: defaultKeyStatistics?.trailingEps || 'N/A',
          forwardEps: defaultKeyStatistics?.forwardEps || 'N/A',
          priceToBook: defaultKeyStatistics?.priceToBook || 'N/A',
          revenuePerShare: defaultKeyStatistics?.revenuePerShare || 'N/A'
        };

        detailedData.fundamentals = {
          returnOnEquity: defaultKeyStatistics?.returnOnEquity ? (defaultKeyStatistics.returnOnEquity * 100).toFixed(2) + '%' : 'N/A',
          profitMargins: defaultKeyStatistics?.profitMargins ? (defaultKeyStatistics.profitMargins * 100).toFixed(2) + '%' : 'N/A',
          revenueGrowth: defaultKeyStatistics?.revenueGrowth ? (defaultKeyStatistics.revenueGrowth * 100).toFixed(2) + '%' : 'N/A',
          earningsGrowth: defaultKeyStatistics?.earningsGrowth ? (defaultKeyStatistics.earningsGrowth * 100).toFixed(2) + '%' : 'N/A',
          debtToEquity: defaultKeyStatistics?.debtToEquity?.toFixed(2) || 'N/A',
          currentRatio: defaultKeyStatistics?.currentRatio?.toFixed(2) || 'N/A',
          quickRatio: defaultKeyStatistics?.quickRatio?.toFixed(2) || 'N/A',
          priceToBook: defaultKeyStatistics?.priceToBook?.toFixed(2) || 'N/A',
          priceToSales: summaryDetail?.priceToSalesTrailing12Months?.toFixed(2) || 'N/A',
          forwardPE: summaryDetail?.forwardPE?.toFixed(2) || 'N/A'
        };

        detailedData.technicals = {
          fiftyDayMA: summaryDetail?.fiftyDayAverage || 'N/A',
          twoHundredDayMA: summaryDetail?.twoHundredDayAverage || 'N/A',
          relativeStrengthIndex: 'N/A',
          macdSignal: 'N/A',
          supportLevels: 'N/A',
          resistanceLevels: 'N/A'
        };

        detailedData.analystOpinions = upgradeDowngradeHistory?.history?.slice(0, 5).map((item: UpgradeHistoryItem) => ({
          firm: item.firm,
          toGrade: item.toGrade,
          fromGrade: item.fromGrade,
          date: new Date(item.epochGradeDate * 1000).toLocaleDateString()
        })) || [];

        if (earningsTrend?.trend) {
          detailedData.sentiment = {
            earningsEstimate: earningsTrend.trend[0]?.earningsEstimate?.avg || 'N/A',
            revenueEstimate: earningsTrend.trend[0]?.revenueEstimate?.avg || 'N/A',
            epsTrend: {
              current: earningsTrend.trend[0]?.epsTrend?.current || 'N/A',
              sevenDaysAgo: earningsTrend.trend[0]?.epsTrend?.['7daysAgo'] || 'N/A',
              thirtyDaysAgo: earningsTrend.trend[0]?.epsTrend?.['30daysAgo'] || 'N/A',
              sixtyDaysAgo: earningsTrend.trend[0]?.epsTrend?.['60daysAgo'] || 'N/A',
              ninetyDaysAgo: earningsTrend.trend[0]?.epsTrend?.['90daysAgo'] || 'N/A'
            }
          };
        }

        detailedData.priceTargets = {
          mean: defaultKeyStatistics?.targetMeanPrice || 'N/A',
          high: defaultKeyStatistics?.targetHighPrice || 'N/A',
          low: defaultKeyStatistics?.targetLowPrice || 'N/A',
          numberOfAnalysts: defaultKeyStatistics?.numberOfAnalystOpinions || 0
        };

        detailedData.financialMetrics = {
          revenueGrowth: financialData?.revenueGrowth ? (financialData.revenueGrowth * 100).toFixed(2) + '%' : 'N/A',
          profitGrowth: financialData?.profitGrowth ? (financialData.profitGrowth * 100).toFixed(2) + '%' : 'N/A',
          cashFlow: financialData?.freeCashflow ? formatFinancialValue(financialData.freeCashflow) : 'N/A',
          debtLevel: financialData?.totalDebt ? formatFinancialValue(financialData.totalDebt) : 'N/A'
        };
      }

      // Fetch historical data for price trends using our cached chart data
      try {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setMonth(endDate.getMonth() - 12);

        const chartData = await getChartData(symbol, '1y', '1mo');

        if (chartData && chartData.quotes) {
          detailedData.historicalTrend = chartData.quotes.map((quote: any) => ({
            date: String(quote.date),
            close: Number(quote.close),
            volume: Number(quote.volume || 0)
          }));
        }
      } catch (error) {
        console.error('Error fetching historical data:', error);
      }

      // Fetch stock details for news
      try {
        const stockDetails = await getStockDetails(symbol);
        if (stockDetails && stockDetails.news) {
          detailedData.news = stockDetails.news.slice(0, 10).map((item: any) => ({
            title: item.title,
            date: new Date(item.providerPublishTime * 1000).toLocaleDateString()
          }));
        }
      } catch (error) {
        console.error('Error fetching stock details:', error);
      }

    } catch (error) {
      // If fetching stock data fails, continue with the default values
      console.error('Error fetching detailed stock data:', error);
      console.log('Continuing with basic stock information');
    }

    console.log(`Calling OpenRouter API for stock analysis of ${stockInfo.symbol}...`);

    // Create a more comprehensive prompt for the AI
    const prompt = createAnalysisPrompt({
      stockInfo,
      detailedData,
      horizon,
      risk,
      investmentAmount,
      tradingStyle,
    });

    try {
      const completion = await openai.chat.completions.create({
        model: "deepseek/deepseek-r1:free",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 4500,
        temperature: 0.5,
        response_format: { type: "json_object" },
      });

      // Extract the generated JSON and handle markdown formatting
      let analysisText = completion.choices[0]?.message?.content?.trim() || '{"error": "Analysis not available at this time."}';

      // Remove markdown code block if present
      if (analysisText.startsWith('```json\n')) {
        analysisText = analysisText.replace(/^```json\n/, '').replace(/\n```$/, '');
      }

      // Parse JSON response
      let analysisData;
      try {
        analysisData = JSON.parse(analysisText.trim());
      } catch (jsonError) {
        console.error('Error parsing JSON response:', jsonError);
        // Fall back to text format and parse manually
        const sections = formatAnalysisIntoSections(analysisText);
        analysisData = {
          summary: {
            title: sections.summary.title,
            content: sections.summary.content
          },
          valueProposition: "Analysis not available at this time",
          buyRecommendation: "HOLD",
          targetPrice: {
            value: "N/A",
            timeframe: "N/A",
            potential: "N/A"
          },
          investmentThesis: sections.recommendation.content,
          strengths: Array.isArray(sections.strengths.content) ? sections.strengths.content : [],
          risks: Array.isArray(sections.risks.content) ? sections.risks.content : [],
          catalysts: ["No catalysts identified"],
          technicalAnalysis: "Technical analysis not available",
          fundamentalAnalysis: "Fundamental analysis not available",
          tradingStrategy: {
            recommendation: sections.recommendation.content,
            entryPoints: "Entry points not available",
            exitStrategy: "Exit strategy not available",
            positionSizing: "Position sizing not available"
          },
          keyMetrics: Array.isArray(sections.metrics.content) ? sections.metrics.content : [],
          sectorOutlook: "Sector outlook not available"
        };
      }

      // Return the complete analysis
      return NextResponse.json({
        symbol,
        companyName: stockInfo.name,
        currentPrice: stockInfo.price,
        priceChange: {
          value: stockInfo.change,
          percent: stockInfo.changePercent
        },
        horizonType: horizon,
        riskLevel: risk,
        investmentAmount: investmentAmount,
        tradingStyle: tradingStyle,
        analysis: analysisData,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      const openaiError = error as OpenAIError;
      console.error('OpenRouter API error:', openaiError);
      return NextResponse.json({
        error: 'Failed to communicate with AI service',
        details: openaiError.message || String(openaiError),
      }, { status: 503 });
    }
  } catch (error: unknown) {
    console.error('AI Stock Analysis error:', error);
    return NextResponse.json({
      error: 'Failed to generate stock analysis',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

// Helper function to create a comprehensive analysis prompt
function createAnalysisPrompt({
  stockInfo,
  detailedData,
  horizon,
  risk,
  investmentAmount,
  tradingStyle,
}: AnalysisParams): string {
  // Map horizon to time frame
  const horizonMap: Record<string, string> = {
    'short': 'within 1-3 months',
    'medium': 'within 6-12 months',
    'long': 'over 1-5 years'
  };

  // Trading style guidance
  const tradingStyleGuidance: Record<string, string> = {
    'day': 'short-term price movements within a single trading day',
    'swing': 'price movements over several days to weeks',
    'long-term': 'fundamental value and growth over months to years',
    'any': 'suitable trading approach based on the analysis'
  };

  const timeFrame = horizonMap[horizon as keyof typeof horizonMap] || 'within the appropriate time horizon';
  const tradingGuidance = tradingStyleGuidance[tradingStyle as keyof typeof tradingStyleGuidance] || 'suitable trading approach';

  // Format technical indicators if available
  let technicalSection = '';
  if (detailedData.technicals) {
    technicalSection = `
Technical Indicators:
- 50-Day Moving Average: ${detailedData.technicals.fiftyDayMA}
- 200-Day Moving Average: ${detailedData.technicals.twoHundredDayMA}
    `;
  }

  // Format fundamentals if available
  let fundamentalsSection = '';
  if (detailedData.fundamentals) {
    fundamentalsSection = `
Fundamental Data:
- Forward P/E: ${detailedData.fundamentals.forwardPE}
- Price-to-Book: ${detailedData.fundamentals.priceToBook}
- Price-to-Sales: ${detailedData.fundamentals.priceToSales}
- Profit Margin: ${detailedData.fundamentals.profitMargins}
- Debt-to-Equity: ${detailedData.fundamentals.debtToEquity}
    `;
  }

  // Format recent news if available
  let newsSection = '';
  if (detailedData.news && detailedData.news.length > 0) {
    newsSection = `
Recent News Headlines:
${detailedData.news.map((item: NewsItem, index: number) => `${index + 1}. ${item.title} (${item.date})`).join('\n')}
    `;
  }

  // Format analyst opinions if available
  let analystSection = '';
  if (detailedData.analystOpinions && detailedData.analystOpinions.length > 0) {
    analystSection = `
Recent Analyst Actions:
${detailedData.analystOpinions.map((item: AnalystOpinion) => `- ${item.firm}: ${item.fromGrade || ''} → ${item.toGrade} (${item.date})`).join('\n')}
    `;
  }

  // Add financial metrics section
  const financialMetricsSection = `
Financial Metrics:
- EPS (Trailing): ${stockInfo.eps}
- Forward EPS: ${stockInfo.forwardEps}
- Revenue Growth: ${detailedData.financialMetrics.revenueGrowth}
- Profit Growth: ${detailedData.financialMetrics.profitGrowth}
- Free Cash Flow: ${detailedData.financialMetrics.cashFlow}
- Total Debt: ${detailedData.financialMetrics.debtLevel}

Price Targets (${detailedData.priceTargets.numberOfAnalysts} analysts):
- Mean Target: ${detailedData.priceTargets.mean}
- High Target: ${detailedData.priceTargets.high}
- Low Target: ${detailedData.priceTargets.low}
  `;

  return `You are an expert financial analyst specializing in equity valuation and market analysis. Provide a detailed investment analysis for ${stockInfo.symbol} (${stockInfo.name}) for investors with a ${risk} risk tolerance looking at a ${horizon}-term time horizon (${timeFrame}).

The investor is considering ${investmentAmount !== 'unspecified' ? 'investing $' + investmentAmount : 'making an investment'} and is interested in ${tradingGuidance}.

==== STOCK INFORMATION ====
- Symbol: ${stockInfo.symbol}
- Company Name: ${stockInfo.name}
- Current Price: ${typeof stockInfo.price === 'number' ? '$' + stockInfo.price.toFixed(2) : stockInfo.price}
- Today's Change: ${typeof stockInfo.change === 'number' ? (stockInfo.change > 0 ? '+' : '') + stockInfo.change.toFixed(2) : stockInfo.change} (${typeof stockInfo.changePercent === 'number' ? (stockInfo.changePercent > 0 ? '+' : '') + stockInfo.changePercent.toFixed(2) + '%' : stockInfo.changePercent})
- 52-Week Range: ${stockInfo.fiftyTwoWeekLow} - ${stockInfo.fiftyTwoWeekHigh}
- Average Volume: ${stockInfo.averageVolume}
- P/E Ratio: ${stockInfo.pe}
- Market Cap: ${stockInfo.marketCap}
- Dividend Yield: ${stockInfo.dividendYield}
- Beta: ${stockInfo.beta}
- Sector: ${stockInfo.sector}
- Industry: ${stockInfo.industry}

${technicalSection}
${fundamentalsSection}
${newsSection}
${analystSection}
${financialMetricsSection}

==== RESPONSE INSTRUCTIONS ====
Respond in JSON format with the following structure:
{
  "summary": {
    "title": "Executive Summary",
    "content": "A concise overview of the company and its market position (2-3 sentences)"
  },
  "valueProposition": "A clear statement on whether this stock represents a good investment opportunity for the specified investor profile",
  "buyRecommendation": "STRONG BUY / BUY / HOLD / SELL / STRONG SELL",
  "targetPrice": {
    "value": "Numerical target price projection",
    "timeframe": "Expected timeframe to reach target",
    "potential": "Percentage growth/decline potential"
  },
  "investmentThesis": "2-3 sentence explanation of the primary investment thesis",
  "strengths": [
    "Key strength point 1",
    "Key strength point 2",
    "Key strength point 3"
  ],
  "risks": [
    "Key risk factor 1",
    "Key risk factor 2",
    "Key risk factor 3"
  ],
  "catalysts": [
    "Upcoming event or factor that could move the stock 1",
    "Upcoming event or factor that could move the stock 2"
  ],
  "technicalAnalysis": "Brief technical analysis relevant to the specified trading style",
  "fundamentalAnalysis": "Brief fundamental analysis focusing on key valuation metrics",
  "tradingStrategy": {
    "recommendation": "Day Trading / Swing Trading / Long-term Investment recommendation",
    "entryPoints": "Suggested entry price points or conditions",
    "exitStrategy": "Suggested exit conditions including stop loss and take profit levels",
    "positionSizing": "Recommended position size based on risk tolerance and investment amount"
  },
  "keyMetrics": [
    "Key metric to watch 1",
    "Key metric to watch 2",
    "Key metric to watch 3",
    "Key metric to watch 4"
  ],
  "sectorOutlook": "Brief analysis of the sector performance and outlook"
}

Ensure the analysis is data-driven, practical, and tailored to the specified investor profile. Focus on actionable insights rather than general information. Be definitive in your recommendation.`;
}

// Helper functions for data processing and formatting
function formatMarketCap(marketCap: number | null | undefined): string {
  if (!marketCap) return 'N/A';
  if (marketCap >= 1e12) {
    return (marketCap / 1e12).toFixed(2) + 'T';
  } else if (marketCap >= 1e9) {
    return (marketCap / 1e9).toFixed(2) + 'B';
  } else if (marketCap >= 1e6) {
    return (marketCap / 1e6).toFixed(2) + 'M';
  } else {
    return marketCap.toLocaleString();
  }
}

function formatVolume(volume: number | null | undefined): string {
  if (!volume) return 'N/A';

  if (volume >= 1e9) {
    return (volume / 1e9).toFixed(2) + 'B';
  } else if (volume >= 1e6) {
    return (volume / 1e6).toFixed(2) + 'M';
  } else if (volume >= 1e3) {
    return (volume / 1e3).toFixed(2) + 'K';
  } else {
    return volume.toLocaleString();
  }
}

function getDateXMonthsAgo(months: number): string {
  const date = new Date();
  date.setMonth(date.getMonth() - months);
  return date.toISOString().split('T')[0];
}

function getTodayFormatted(): string {
  return new Date().toISOString().split('T')[0];
}

function processHistoricalData(data: RawHistoricalDataItem[]): HistoricalDataItem[] {
  if (!data || !Array.isArray(data)) return [];

  return data.map(item => ({
    date: String(item.date),
    close: Number(item.close),
    volume: Number(item.volume)
  }));
}

interface SectionContent {
  title: string;
  content: string | string[];
}

interface AnalysisSections {
  summary: SectionContent;
  strengths: SectionContent;
  risks: SectionContent;
  recommendation: SectionContent;
  metrics: SectionContent;
}

function formatAnalysisIntoSections(text: string): AnalysisSections {
  // Default structure in case parsing fails
  const defaultSections: AnalysisSections = {
    summary: { title: "Summary", content: "Unable to parse analysis content." },
    strengths: { title: "Key Strengths", content: [] },
    risks: { title: "Key Risks", content: [] },
    recommendation: { title: "Recommendation", content: "No recommendation available." },
    metrics: { title: "Key Metrics to Watch", content: [] }
  };

  try {
    // Simple parsing logic
    const sections = { ...defaultSections };

    // Look for typical section indicators
    const lines = text.split('\n').filter(line => line.trim().length > 0);

    let currentSection = 'summary';
    const summaryLines: string[] = [];
    const strengthLines: string[] = [];
    const riskLines: string[] = [];
    const recommendationLines: string[] = [];
    const metricLines: string[] = [];

    for (const line of lines) {
      const lowerLine = line.toLowerCase();

      // Identify sections by keywords
      if (lowerLine.includes('strength') || lowerLine.includes('pro') || lowerLine.match(/\bpros\b/)) {
        currentSection = 'strengths';
        continue;
      } else if (lowerLine.includes('risk') || lowerLine.includes('weakness') || lowerLine.includes('con') || lowerLine.match(/\bcons\b/)) {
        currentSection = 'risks';
        continue;
      } else if (lowerLine.includes('recommend')) {
        currentSection = 'recommendation';
        continue;
      } else if (lowerLine.includes('metric') || lowerLine.includes('watch') || lowerLine.includes('indicator')) {
        currentSection = 'metrics';
        continue;
      }

      // Add content to current section
      if (currentSection === 'summary') {
        summaryLines.push(line);
      } else if (currentSection === 'strengths') {
        if (line.trim().startsWith('-') || line.trim().startsWith('•')) {
          strengthLines.push(line.replace(/^[•\-]\s*/, '').trim());
        } else if (line.trim().length > 0) {
          strengthLines.push(line.trim());
        }
      } else if (currentSection === 'risks') {
        if (line.trim().startsWith('-') || line.trim().startsWith('•')) {
          riskLines.push(line.replace(/^[•\-]\s*/, '').trim());
        } else if (line.trim().length > 0) {
          riskLines.push(line.trim());
        }
      } else if (currentSection === 'recommendation') {
        recommendationLines.push(line);
      } else if (currentSection === 'metrics') {
        if (line.trim().startsWith('-') || line.trim().startsWith('•')) {
          metricLines.push(line.replace(/^[•\-]\s*/, '').trim());
        } else if (line.trim().length > 0) {
          metricLines.push(line.trim());
        }
      }
    }

    // Update sections with parsed content
    sections.summary.content = summaryLines.join(' ');
    sections.strengths.content = strengthLines;
    sections.risks.content = riskLines;
    sections.recommendation.content = recommendationLines.join(' ');
    sections.metrics.content = metricLines;

    return sections;
  } catch (e) {
    console.error("Error parsing analysis:", e);
    return defaultSections;
  }
}

function formatFinancialValue(value: number): string {
  if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
  return `$${value.toFixed(2)}`;
}

interface UpgradeHistoryItem {
  firm: string;
  toGrade: string;
  fromGrade?: string;
  epochGradeDate: number;
}

interface OpenAIError extends Error {
  status?: number;
  message: string;
}

interface RawHistoricalDataItem {
  date: string | number;
  close: string | number;
  volume: string | number;
}
