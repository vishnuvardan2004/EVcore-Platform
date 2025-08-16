import { useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from '../hooks/use-toast';
import { APIError } from '../services/api';

export const useErrorHandler = () => {
  const { logout } = useAuth();
  
  const handleError = useCallback((error: APIError | Error | any) => {
    console.error('Error occurred:', error);
    
    // Handle API errors
    if (error && typeof error === 'object' && 'status' in error) {
      const apiError = error as APIError;
      
      switch (apiError.status) {
        case 401:
          toast({
            title: 'Authentication Error',
            description: 'Your session has expired. Please log in again.',
            variant: 'destructive',
          });
          logout();
          window.location.href = '/login';
          break;
          
        case 403:
          toast({
            title: 'Access Denied',
            description: 'You do not have permission to perform this action.',
            variant: 'destructive',
          });
          break;
          
        case 404:
          toast({
            title: 'Not Found',
            description: 'The requested resource was not found.',
            variant: 'destructive',
          });
          break;
          
        case 422:
          toast({
            title: 'Validation Error',
            description: apiError.message || 'Please check your input and try again.',
            variant: 'destructive',
          });
          break;
          
        case 429:
          toast({
            title: 'Too Many Requests',
            description: 'Please wait a moment before trying again.',
            variant: 'destructive',
          });
          break;
          
        case 500:
        case 502:
        case 503:
        case 504:
          toast({
            title: 'Server Error',
            description: 'Something went wrong on our end. Please try again later.',
            variant: 'destructive',
          });
          break;
          
        case 0:
          toast({
            title: 'Network Error',
            description: 'Please check your internet connection and try again.',
            variant: 'destructive',
          });
          break;
          
        default:
          toast({
            title: 'Error',
            description: apiError.message || 'An unexpected error occurred.',
            variant: 'destructive',
          });
      }
    } else if (error instanceof Error) {
      // Handle JavaScript errors
      toast({
        title: 'Error',
        description: error.message || 'An unexpected error occurred.',
        variant: 'destructive',
      });
    } else {
      // Handle unknown errors
      toast({
        title: 'Error',
        description: 'An unexpected error occurred.',
        variant: 'destructive',
      });
    }
  }, [logout]);
  
  const handleSuccess = useCallback((message: string, title = 'Success') => {
    toast({
      title,
      description: message,
      variant: 'default',
    });
  }, []);
  
  const handleWarning = useCallback((message: string, title = 'Warning') => {
    toast({
      title,
      description: message,
      variant: 'destructive', // You might want to create a 'warning' variant
    });
  }, []);
  
  return {
    handleError,
    handleSuccess,
    handleWarning,
  };
};

export default useErrorHandler;
