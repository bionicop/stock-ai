"use client"

import Search from "@/components/home/search"
import Navbar from "@/components/home/navbar"
import { useState } from "react"
import { TrendingUp, Globe, BarChart3 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function Home() {
  const [hasSearched, setHasSearched] = useState(false)

  return (
    <div className="relative h-screen min-h-screen w-full overflow-hidden bg-grid-small-black/[0.09] dark:bg-grid-small-white/[0.025]">
      {/* Fixed header with logo */}
      <div className="relative mx-auto mb-4 flex max-w-7xl flex-col">
        <Navbar />

        {/* Main content with centered search */}
        <div className={`relative flex flex-col items-center justify-center transition-all ${hasSearched ? 'mt-4' : 'mt-32'}`}>
          {!hasSearched && (
            <div className="mb-6 text-center">
              <h1 className="mb-1 text-3xl font-bold">Stock Sizzle 9000</h1>
              <p className="text-sm text-muted-foreground">Your AI-powered stock market companion</p>
            </div>
          )}

          {/* Search component */}
          <Search expanded={hasSearched} onSearchStateChange={setHasSearched} />

          {/* Quick access cards - only shown when not searched */}
          {!hasSearched && (
            <div className="mt-12 w-full max-w-3xl">
              <Tabs defaultValue="trending">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="trending">Trending</TabsTrigger>
                  <TabsTrigger value="market">Market Overview</TabsTrigger>
                  <TabsTrigger value="news">Recent News</TabsTrigger>
                </TabsList>

                <div className="mt-4">
                  <TabsContent value="trending">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                      {['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'META'].map((symbol) => (
                        <Card key={symbol} className="cursor-pointer hover:shadow-md">
                          <CardContent className="flex items-center gap-3 p-4">
                            <TrendingUp className="h-5 w-5 text-primary" />
                            <div>
                              <p className="font-semibold">{symbol}</p>
                              <p className="text-xs text-muted-foreground">Trending Stock</p>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="market">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                      {[
                        { name: 'S&P 500', symbol: '^GSPC', icon: Globe },
                        { name: 'Dow Jones', symbol: '^DJI', icon: Globe },
                        { name: 'NASDAQ', symbol: '^IXIC', icon: Globe },
                        { name: 'Russell 2000', symbol: '^RUT', icon: Globe },
                        { name: 'VIX', symbol: '^VIX', icon: Globe },
                        { name: '10-Year Treasury', symbol: '^TNX', icon: Globe }
                      ].map((item) => (
                        <Card key={item.symbol} className="cursor-pointer hover:shadow-md">
                          <CardContent className="flex items-center gap-3 p-4">
                            <item.icon className="h-5 w-5 text-primary" />
                            <div>
                              <p className="font-semibold">{item.name}</p>
                              <p className="text-xs text-muted-foreground">{item.symbol}</p>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="news">
                    <div className="grid grid-cols-1 gap-4">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Card key={i} className="cursor-pointer hover:shadow-md">
                          <CardContent className="flex items-center gap-3 p-4">
                            <BarChart3 className="h-5 w-5 shrink-0 text-primary" />
                            <div>
                              <p className="font-semibold">Latest Market Movements</p>
                              <p className="text-xs text-muted-foreground">Market news and analysis</p>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </TabsContent>
                </div>
              </Tabs>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
