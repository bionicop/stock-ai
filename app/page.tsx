"use client"

import Search from "@/components/home/search"
import Navbar from "@/components/home/navbar"
import { useState } from "react"

export default function Home() {
  const [hasSearched, setHasSearched] = useState(false)

  return (
    <div className="relative h-screen min-h-screen w-full overflow-hidden bg-grid-small-black/[0.09] dark:bg-grid-small-white/[0.025]">
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

            </div>
          )}
        </div>
      </div>
    </div>
  )
}
