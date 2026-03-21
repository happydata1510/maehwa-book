"use client";

import { useState, useCallback } from "react";
import { NaverBookSearchResult } from "@/types";

export function useBookSearch() {
  const [results, setResults] = useState<NaverBookSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchByQuery = useCallback(async (query: string) => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/books/search?query=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResults(data.items || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "검색 실패");
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const searchByIsbn = useCallback(async (isbn: string): Promise<NaverBookSearchResult | null> => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/books/search?isbn=${encodeURIComponent(isbn)}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      const items = data.items || [];
      if (items.length > 0) {
        setResults(items);
        return items[0];
      }
      return null;
    } catch (err) {
      setError(err instanceof Error ? err.message : "검색 실패");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearResults = useCallback(() => {
    setResults([]);
    setError(null);
  }, []);

  return { results, loading, error, searchByQuery, searchByIsbn, clearResults };
}
