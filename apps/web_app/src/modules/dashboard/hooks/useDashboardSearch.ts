import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DashboardSearchService, SearchResultItem } from '../services/DashboardSearchService';

export function useDashboardSearch() {
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedTerm, setDebouncedTerm] = useState('');

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedTerm(searchTerm);
        }, 300);

        return () => {
            clearTimeout(handler);
        };
    }, [searchTerm]);

    const { data: results = [], isLoading, isError } = useQuery<SearchResultItem[], Error>({
        queryKey: ['dashboard', 'search', debouncedTerm],
        queryFn: () => DashboardSearchService.querySearch(debouncedTerm),
        enabled: debouncedTerm.trim().length >= 2,
        staleTime: 30_000 // Cache searches for 30s
    });

    return {
        searchTerm,
        setSearchTerm,
        results: debouncedTerm.trim().length < 2 ? [] : results,
        isLoading: debouncedTerm !== searchTerm ? true : isLoading,
        isError
    };
}

export default useDashboardSearch;
