"use client";

import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  ReferenceLine 
} from "recharts";
import { Info } from "lucide-react";

interface PredictionProps {
  predictions: Array<{
    date: string;
    predicted_price: number;
    confidence?: number;
  }>;
  currentPrice: number;
}

export function PredictionCard({ predictions, currentPrice }: PredictionProps) {
  // Calculate prediction direction and percentage
  const hasData = predictions && predictions.length > 0;
  let predictedChange = 0;
  let predictedChangePercent = 0;
  
  if (hasData) {
    const finalPrice = predictions[predictions.length - 1].predicted_price;
    predictedChange = finalPrice - currentPrice;
    predictedChangePercent = (predictedChange / currentPrice) * 100;
  }
  
  // Calculate average confidence
  const avgConfidence = hasData && predictions[0].confidence ? 
    predictions.reduce((sum, p) => sum + (p.confidence || 0), 0) / predictions.length : 
    0;
    
  // Add reference line for current price
  const chartData = hasData ? [
    { date: new Date().toISOString().split('T')[0], predicted_price: currentPrice },
    ...predictions
  ] : [];
    
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Price Prediction (30 Days)</span>
          {avgConfidence > 0 && (
            <div className="text-sm font-normal bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-md">
              Avg Confidence: {avgConfidence.toFixed(0)}%
            </div>
          )}
        </CardTitle>
        <CardDescription>
          Advanced prediction model with multiple indicators
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          {hasData ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(tick) => new Date(tick).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  domain={[(dataMin) => dataMin * 0.98, (dataMax) => dataMax * 1.02]}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip 
                  formatter={(value: any) => [`$${value}`, 'Predicted Price']}
                  labelFormatter={(label) => new Date(label).toLocaleDateString()}
                />
                <Legend />
                <ReferenceLine 
                  y={currentPrice} 
                  label="Current" 
                  stroke="#888" 
                  strokeDasharray="3 3" 
                />
                <Line
                  type="monotone"
                  dataKey="predicted_price"
                  stroke="#8884d8"
                  name="Predicted Price"
                  dot={false}
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">
              No prediction data available
            </div>
          )}
        </div>
        <div className="mt-4">
          <p className="text-sm text-muted-foreground">
            <Info className="h-4 w-4 inline mr-1" />
            Our model combines technical patterns, recent trends, and market context. 
            All predictions are estimates with varying confidence levels.
          </p>
        </div>
      </CardContent>
      <CardFooter>
        <div className="flex justify-between w-full text-sm">
          <div>
            <p className="text-muted-foreground">Current Price</p>
            <p className="font-medium">${currentPrice.toFixed(2)}</p>
          </div>
          <div className="text-center">
            <p className="text-muted-foreground">Prediction</p>
            <p className={`font-medium ${predictedChange > 0 ? 'text-green-500' : predictedChange < 0 ? 'text-red-500' : ''}`}>
              {predictedChange > 0 ? '↑' : predictedChange < 0 ? '↓' : '→'} 
              {Math.abs(predictedChangePercent).toFixed(2)}%
            </p>
          </div>
          <div className="text-right">
            <p className="text-muted-foreground">Predicted (30d)</p>
            {hasData && (
              <p 
                className={`font-medium ${
                  predictions[predictions.length - 1].predicted_price > currentPrice ? 'text-green-500' : 'text-red-500'
                }`}
              >
                ${predictions[predictions.length - 1].predicted_price.toFixed(2)}
              </p>
            )}
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}