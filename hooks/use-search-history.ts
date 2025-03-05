import { useState, useEffect } from 'react';

type SearchHistoryItem = {
  query: string;
  category: string;
  timestamp: number;
};

const MAX_HISTORY_ITEMS = 10;
const STORAGE_KEY = 'search_history';

export function useSearchHistory() {
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);

  // Load history from localStorage on mount
  useEffect(() => {
    const savedHistory = localStorage.getItem(STORAGE_KEY);
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (error) {
        console.error('Failed to parse search history:', error);
        setHistory([]);
      }
    }
  }, []);

  // Save to localStorage whenever history changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  }, [history]);

  // Add a new search to history
  const addToHistory = (query: string, category: string) => {
    setHistory(prev => {
      // Remove any existing entries with the same query and category
      const filtered = prev.filter(
        item => !(item.query === query && item.category === category)
      );

      // Add new item to the beginning
      const newHistory = [
        { query, category, timestamp: Date.now() },
        ...filtered
      ].slice(0, MAX_HISTORY_ITEMS); // Keep only the most recent items

      return newHistory;
    });
  };

  // Remove a specific search from history
  const removeFromHistory = (query: string, category: string) => {
    setHistory(prev =>
      prev.filter(item => !(item.query === query && item.category === category))
    );
  };

  // Clear all search history
  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  // Get recent searches for a specific category
  const getRecentSearches = (category?: string) => {
    if (category) {
      return history.filter(item => item.category === category);
    }
    return history;
  };

  return {
    history,
    addToHistory,
    removeFromHistory,
    clearHistory,
    getRecentSearches
  };
}
