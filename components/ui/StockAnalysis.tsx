import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Activity,
  TrendingUp,
  TrendingDown,
  DollarSign,
  BarChart4,
  Calendar,
  Target,
  ArrowRight,
  Brain,
  RefreshCw,
  AlertTriangle,
  XCircle,
  Loader2,
  Info
} from 'lucide-react';

// TypeScript interfaces for component props and API responses
interface StockAnalysisProps {
  symbol: string;
  investmentHorizon?: 'short' | 'medium' | 'long';
  riskTolerance?: 'low' | 'moderate' | 'high';
  investmentAmount?: number | string;
  tradingStyle?: 'day' | 'swing' | 'long-term' | 'any';
  refreshInterval?: number;
  onAnalysisComplete?: (data: any) => void;
}

interface AnalysisData {
  symbol: string;
  companyName: string;
  currentPrice: number | string;
  analysis: {
    summary: {
      title: string;
      content: string;
    };
    valueProposition: string;
    buyRecommendation: string;
    targetPrice: {
      value: string | number;
      timeframe: string;
      potential: string;
    };
    investmentThesis: string;
    strengths: string[];
    risks: string[];
    catalysts: string[];
    technicalAnalysis: string;
    fundamentalAnalysis: string;
    tradingStrategy: {
      recommendation: string;
      entryPoints: string;
      exitStrategy: string;
      positionSizing: string;
    };
    keyMetrics: string[];
    sectorOutlook: string;
  };
  timestamp: string;
  error?: string;
}

const getRecommendationColor = (recommendation: string): string => {
  const rec = recommendation.toLowerCase();
  if (rec.includes('strong buy')) return 'bg-green-500';
  if (rec.includes('buy')) return 'bg-green-400';
  if (rec.includes('hold')) return 'bg-yellow-400';
  if (rec.includes('sell')) return 'bg-red-400';
  if (rec.includes('strong sell')) return 'bg-red-500';
  return 'bg-gray-400';
};

const StockAnalysisComponent: React.FC<StockAnalysisProps> = ({
  symbol,
  investmentHorizon = 'medium',
  riskTolerance = 'moderate',
  investmentAmount,
  tradingStyle = 'any',
  refreshInterval = 0,
  onAnalysisComplete
}) => {
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('overview');

  const fetchAnalysisData = async () => {
    setLoading(true);
    setError(null);

    try {
      let queryParams = new URLSearchParams({
        symbol: symbol,
        horizon: investmentHorizon,
        risk: riskTolerance,
        tradingStyle: tradingStyle
      });

      if (investmentAmount) {
        queryParams.append('amount', investmentAmount.toString());
      }

      const response = await axios.get(`/api/stock-analysis?${queryParams.toString()}`);

      if (response.status === 200 && response.data) {
        setAnalysisData(response.data);
        if (onAnalysisComplete) {
          onAnalysisComplete(response.data);
        }
      } else {
        setError('Received an invalid response from the server');
      }
    } catch (err) {
      console.error('Error fetching stock analysis:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch analysis data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalysisData();
  }, [symbol, investmentHorizon, riskTolerance, investmentAmount, tradingStyle]);

  const RecommendationBadge = () => {
    if (!analysisData) return null;
    const recommendation = analysisData.analysis.buyRecommendation;
    const bgColor = getRecommendationColor(recommendation);
    return (
      <Badge className={`${bgColor} text-white font-bold px-3 py-1 text-sm`}>
        {recommendation}
      </Badge>
    );
  };

  if (loading && !analysisData) {
    return (
      <Card className="border border-border/40 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-xl font-semibold">
            <Brain className="h-5 w-5 text-primary" /> AI Stock Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-5" />
            <p className="text-base text-muted-foreground font-medium">Generating AI analysis for {symbol}...</p>
            <p className="text-sm text-muted-foreground mt-2">This typically takes about 15-20 seconds</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error && !analysisData) {
    return (
      <Card className="border border-destructive/20 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-xl font-semibold">
            <XCircle className="h-5 w-5 text-destructive" /> Analysis Unavailable
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8">
            <AlertTriangle className="h-12 w-12 text-amber-500 mb-4" />
            <p className="text-center font-medium text-base">We couldn't generate an analysis for {symbol} at this time.</p>
            <p className="text-sm text-muted-foreground mt-3 text-center max-w-md">
              {error}
            </p>
            <Button
              className="mt-6 flex items-center gap-2"
              onClick={fetchAnalysisData}
            >
              <RefreshCw className="h-4 w-4" /> Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!analysisData) return null;

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2 text-xl font-semibold">
            <Brain className="h-5 w-5 text-primary" /> AI Analysis: {symbol}
            {analysisData.companyName && analysisData.companyName !== symbol && (
              <span className="text-muted-foreground font-normal text-base ml-1">
                ({analysisData.companyName})
              </span>
            )}
          </CardTitle>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => window.open(`https://finance.yahoo.com/quote/${symbol}`, '_blank')}>
            View on Yahoo Finance
          </Button>
          <Button variant="outline" size="sm" onClick={fetchAnalysisData} disabled={loading}>
            {loading ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh Analysis
              </>
            )}
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="analysis">Analysis</TabsTrigger>
            <TabsTrigger value="strategy">Strategy</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-base flex items-center">
                  <Info className="h-4 w-4 mr-2" />
                  Executive Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="py-0">
                <div className="mb-4">
                  <RecommendationBadge />
                </div>

                <p>{analysisData.analysis.summary.content}</p>

                <div className="mt-4">
                  <h4 className="font-semibold mb-2">Investment Thesis</h4>
                  <p>{analysisData.analysis.investmentThesis}</p>
                </div>

                <div className="mt-4 flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <h4 className="font-semibold mb-2 flex items-center">
                      <TrendingUp className="h-4 w-4 mr-2 text-green-500" />
                      Key Strengths
                    </h4>
                    <ul className="list-disc pl-5 space-y-1">
                      {analysisData.analysis.strengths.map((strength, index) => (
                        <li key={`strength-${index}`}>{strength}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex-1">
                    <h4 className="font-semibold mb-2 flex items-center">
                      <TrendingDown className="h-4 w-4 mr-2 text-red-500" />
                      Key Risks
                    </h4>
                    <ul className="list-disc pl-5 space-y-1">
                      {analysisData.analysis.risks.map((risk, index) => (
                        <li key={`risk-${index}`}>{risk}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-base flex items-center">
                    <Target className="h-4 w-4 mr-2" />
                    Target Price
                  </CardTitle>
                </CardHeader>
              <CardContent className="p-4">
                  <div className="flex items-baseline">
                    <span className="text-2xl font-bold">${analysisData.analysis.targetPrice.value}</span>
                    <span className="ml-2 text-sm text-gray-500">({analysisData.analysis.targetPrice.potential})</span>
                  </div>
                  <p className="text-sm mt-1">{analysisData.analysis.targetPrice.timeframe}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-base flex items-center">
                    <Activity className="h-4 w-4 mr-2" />
                    Sector Outlook
                  </CardTitle>
                </CardHeader>
                <CardContent className="py-0">
                  <p className="text-sm">{analysisData.analysis.sectorOutlook}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-base flex items-center">
                    <Calendar className="h-4 w-4 mr-2" />
                    Catalysts
                  </CardTitle>
                </CardHeader>
                <CardContent className="py-0">
                  <ul className="text-sm space-y-1">
                    {analysisData.analysis.catalysts.map((catalyst, index) => (
                      <li key={`catalyst-${index}`} className="flex items-baseline">
                        <ArrowRight className="h-3 w-3 mr-1 flex-shrink-0" />
                        <span>{catalyst}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="analysis" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-base flex items-center">
                    <BarChart4 className="h-4 w-4 mr-2" />
                    Technical Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent className="py-0">
                  <p>{analysisData.analysis.technicalAnalysis}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-base flex items-center">
                    <DollarSign className="h-4 w-4 mr-2" />
                    Fundamental Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent className="py-0">
                  <p>{analysisData.analysis.fundamentalAnalysis}</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-base">Key Metrics to Watch</CardTitle>
              </CardHeader>
              <CardContent className="py-0">
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {analysisData.analysis.keyMetrics.map((metric, index) => (
                    <li key={`metric-${index}`} className="flex items-center">
                      <Badge variant="outline" className="mr-2 h-5 w-5 flex items-center justify-center p-0">{index + 1}</Badge>
                      {metric}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="strategy" className="space-y-4">
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-base">Trading Strategy</CardTitle>
              </CardHeader>
              <CardContent className="py-0">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold">Recommended Approach</h4>
                    <p>{analysisData.analysis.tradingStrategy.recommendation}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold">Entry Points</h4>
                      <p>{analysisData.analysis.tradingStrategy.entryPoints}</p>
                    </div>

                    <div>
                      <h4 className="font-semibold">Exit Strategy</h4>
                      <p>{analysisData.analysis.tradingStrategy.exitStrategy}</p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold">Position Sizing</h4>
                    <p>{analysisData.analysis.tradingStrategy.positionSizing}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-base">Value Proposition</CardTitle>
              </CardHeader>
              <CardContent className="py-0">
                <p>{analysisData.analysis.valueProposition}</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default StockAnalysisComponent;
