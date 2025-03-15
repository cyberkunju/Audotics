import React from 'react';
import { motion } from 'framer-motion';

interface ContentFallbackProps {
  title?: string;
  message?: string;
  icon?: React.ReactNode;
  retry?: () => void;
  isLoading?: boolean;
}

const ContentFallback: React.FC<ContentFallbackProps> = ({
  title = 'Content Unavailable',
  message = 'We couldn\'t load this content right now.',
  icon,
  retry,
  isLoading = false
}) => {
  // Default error icon
  const defaultErrorIcon = (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-16 w-16 text-gray-400"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );

  // Loading spinner
  const loadingSpinner = (
    <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center justify-center p-8 bg-white dark:bg-gray-800 rounded-xl shadow-md my-4"
    >
      <div className="mb-4">
        {isLoading ? loadingSpinner : (icon || defaultErrorIcon)}
      </div>
      
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
        {isLoading ? 'Loading Content...' : title}
      </h2>
      
      <p className="text-gray-600 dark:text-gray-300 text-center mb-6 max-w-md">
        {isLoading 
          ? 'Please wait while we load your content.'
          : message
        }
      </p>
      
      {!isLoading && retry && (
        <button
          onClick={retry}
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
        >
          Try Again
        </button>
      )}
    </motion.div>
  );
};

export default ContentFallback; 