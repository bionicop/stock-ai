export const DEFAULT_SCREENER = "most_actives";

export const SCREENER_OPTIONS = [
  { label: "Most Actives", value: "most_actives" },
  { label: "Day Gainers", value: "day_gainers" },
  { label: "Day Losers", value: "day_losers" },
  { label: "Growth Technology Stocks", value: "growth_technology_stocks" },
  { label: "The Most Shorted Stocks", value: "most_shorted_stocks" },
  { label: "Undervalued Growth Stocks", value: "undervalued_growth_stocks" },
  { label: "Aggressive Small Caps", value: "aggressive_small_caps" },
  { label: "Conservative Foreign Funds", value: "conservative_foreign_funds" },
  { label: "High Yield Bond", value: "high_yield_bond" },
  { label: "Portfolio Anchors", value: "portfolio_anchors" },
  { label: "Small Cap Gainers", value: "small_cap_gainers" },
  { label: "Solid Large Growth Funds", value: "solid_large_growth_funds" },
  { label: "Solid Midcap Growth Funds", value: "solid_midcap_growth_funds" },
  { label: "Top Mutual Funds", value: "top_mutual_funds" },
  { label: "Undervalued Large Caps", value: "undervalued_large_caps" },
];

export const DEFAULT_RANGE = '3mo' as const;
export const VALID_RANGES = ['1d', '5d', '1mo', '3mo', '6mo', '1y', '2y', '5y', 'max'] as const;

export const INTERVALS_FOR_RANGE = {
  '1d': ['1m', '2m', '5m', '15m', '30m', '60m', '90m', '1h'],
  '5d': ['1m', '2m', '5m', '15m', '30m', '60m', '90m', '1h'],
  '1mo': ['5m', '15m', '30m', '60m', '90m', '1h', '1d'],
  '3mo': ['15m', '30m', '60m', '90m', '1h', '1d'],
  '6mo': ['30m', '60m', '90m', '1h', '1d', '5d', '1wk', '1mo'],
  '1y': ['60m', '90m', '1h', '1d', '5d', '1wk', '1mo'],
  '2y': ['1h', '1d', '5d', '1wk', '1mo'],
  '5y': ['1d', '5d', '1wk', '1mo', '3mo'],
  'max': ['1d', '5d', '1wk', '1mo', '3mo']
} as const;
