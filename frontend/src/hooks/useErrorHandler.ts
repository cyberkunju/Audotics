import { useState, useCallback } from 'react';
import { useToast } from '@/components/ToastContainer';

interface ErrorState {
  hasError: boolean;
  message: string | null;
  code?: string | number;
  details?: any;
}

interface UseErrorHandlerReturn {
  error: ErrorState;
  setError: (message: string, code?: string | number, details?: any) => void;
  clearError: () => void;
  handleError: (error: unknown) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

/**
 * Custom hook for handling errors in components
 * 
 * @param showToasts Whether to automatically show toast notifications for errors
 * @returns Functions and state for error handling
 */
export const useErrorHandler = (showToasts = true): UseErrorHandlerReturn => {
  const [error, setErrorState] = useState<ErrorState>({
    hasError: false,
    message: null,
  });
  const [isLoading, setIsLoading] = useState(false);
  const { showToast } = useToast();

  // Set an error
  const setError = useCallback(
    (message: string, code?: string | number, details?: any) => {
      setErrorState({
        hasError: true,
        message,
        code,
        details,
      });

      if (showToasts) {
        showToast(message, 'error');
      }

      // Log error to console in development
      if (process.env.NODE_ENV === 'development') {
        console.error(`Error (${code}): ${message}`, details);
      }
    },
    [showToast, showToasts]
  );

  // Clear the error state
  const clearError = useCallback(() => {
    setErrorState({
      hasError: false,
      message: null,
    });
  }, []);

  // Handle an unknown error (useful for try/catch blocks)
  const handleError = useCallback(
    (error: unknown) => {
      let message = 'An unexpected error occurred';
      let code = 'UNKNOWN_ERROR';
      let details = error;

      // Extract error information based on the error type
      if (error instanceof Error) {
        message = error.message;
        // Some error objects have a code property
        const errorWithCode = error as any;
        if (errorWithCode.code) {
          code = errorWithCode.code;
        }
      } else if (typeof error === 'string') {
        message = error;
      }

      setError(message, code, details);
    },
    [setError]
  );

  return {
    error,
    setError,
    clearError,
    handleError,
    isLoading,
    setIsLoading,
  };
};

export default useErrorHandler; 