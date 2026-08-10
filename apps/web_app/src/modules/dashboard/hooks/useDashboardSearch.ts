import { useState, useEffect } from 'react';
import { DashboardSearchService, SearchResultItem } from '../services/DashboardSearchService';

export function useDashboardSearch() {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (searchTerm.trim().length < 2) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const handler = setTimeout(() => {
      DashboardSearchService.querySearch(searchTerm)
        .then((res) => setResults(res))
        .catch(() => setResults([]))
        .finally(() => setIsLoading(false));
    }, 300);

    return () => clearTimeout(handler);
  }, [searchTerm]);

  return {
    searchTerm,
    setSearchTerm,
    results,
    isLoading,
    isError: false,
  };
}

export default useDashboardSearch;
