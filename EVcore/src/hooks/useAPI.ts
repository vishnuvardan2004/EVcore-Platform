import { useState, useEffect, useCallback } from 'react';
import { APIResponse, APIError } from '../services/api';
import { useErrorHandler } from './useErrorHandler';

interface UseAPIOptions {
  immediate?: boolean;
  onSuccess?: (data: any) => void;
  onError?: (error: APIError) => void;
}

export const useAPI = <T = any>(
  apiCall: () => Promise<APIResponse<T>>,
  options: UseAPIOptions = {}
) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<APIError | null>(null);
  const { handleError } = useErrorHandler();
  
  const { immediate = true, onSuccess, onError } = options;
  
  const execute = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiCall();
      
      if (response.success) {
        setData(response.data);
        onSuccess?.(response.data);
      } else {
        throw new Error(response.message || 'API call failed');
      }
    } catch (err) {
      const apiError = err as APIError;
      setError(apiError);
      
      if (onError) {
        onError(apiError);
      } else {
        handleError(apiError);
      }
    } finally {
      setLoading(false);
    }
  }, [apiCall, onSuccess, onError, handleError]);
  
  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);
  
  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [immediate, execute]);
  
  return {
    data,
    loading,
    error,
    execute,
    reset,
    refetch: execute,
  };
};

export const useMutation = <TData = any, TVariables = any>(
  mutationFn: (variables: TVariables) => Promise<APIResponse<TData>>,
  options: UseAPIOptions = {}
) => {
  const [data, setData] = useState<TData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<APIError | null>(null);
  const { handleError, handleSuccess } = useErrorHandler();
  
  const { onSuccess, onError } = options;
  
  const mutate = useCallback(async (variables: TVariables) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await mutationFn(variables);
      
      if (response.success) {
        setData(response.data);
        onSuccess?.(response.data);
        
        if (response.message) {
          handleSuccess(response.message);
        }
        
        return response.data;
      } else {
        throw new Error(response.message || 'Mutation failed');
      }
    } catch (err) {
      const apiError = err as APIError;
      setError(apiError);
      
      if (onError) {
        onError(apiError);
      } else {
        handleError(apiError);
      }
      
      throw apiError;
    } finally {
      setLoading(false);
    }
  }, [mutationFn, onSuccess, onError, handleError, handleSuccess]);
  
  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);
  
  return {
    data,
    loading,
    error,
    mutate,
    reset,
  };
};

export default useAPI;
