import { useState, useCallback, useRef } from 'react';

export interface Vehicle {
  registrationNumber: string;
  brand: string;
  model: string;
  vehicleId: string;
  currentHub?: string;
}

interface UseVehicleAutocompleteOptions {
  debounceMs?: number;
  limit?: number;
}

export const useVehicleAutocomplete = (options: UseVehicleAutocompleteOptions = {}) => {
  const { debounceMs = 300, limit = 10 } = options;
  
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const debounceTimeout = useRef<NodeJS.Timeout>();
  const abortController = useRef<AbortController | null>(null);

  const fetchVehicleSuggestions = useCallback(async (query: string) => {
    // Cancel previous request
    if (abortController.current) {
      abortController.current.abort();
    }
    
    // Create new abort controller
    abortController.current = new AbortController();
    
    try {
      setLoading(true);
      setError(null);
      
      const baseUrl = import.meta.env.VITE_API_URL || '';
      const url = `${baseUrl}/api/vehicle-deployment/autocomplete/registration?query=${encodeURIComponent(query)}&limit=${limit}`;
      
      const response = await fetch(url, {
        signal: abortController.current.signal,
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setVehicles(data.data || []);
      } else {
        throw new Error(data.message || 'Failed to fetch suggestions');
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        // Request was aborted, ignore
        return;
      }
      
      console.error('Error fetching vehicle suggestions:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch suggestions');
      setVehicles([]);
    } finally {
      setLoading(false);
    }
  }, [limit]);

  const debouncedSearch = useCallback((query: string) => {
    // Clear existing timeout
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    // Set new timeout
    debounceTimeout.current = setTimeout(() => {
      fetchVehicleSuggestions(query);
    }, debounceMs);
  }, [fetchVehicleSuggestions, debounceMs]);

  const searchVehicles = useCallback((query: string) => {
    if (query.length >= 2 || query === '') {
      debouncedSearch(query);
    } else {
      setVehicles([]);
      setError(null);
    }
  }, [debouncedSearch]);

  const clearSearch = useCallback(() => {
    setVehicles([]);
    setError(null);
    setLoading(false);
    
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }
    
    if (abortController.current) {
      abortController.current.abort();
    }
  }, []);

  // Cleanup on unmount
  const cleanup = useCallback(() => {
    clearSearch();
  }, [clearSearch]);

  return {
    vehicles,
    loading,
    error,
    searchVehicles,
    clearSearch,
    cleanup
  };
};
