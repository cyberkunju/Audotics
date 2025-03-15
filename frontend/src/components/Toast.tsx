import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastProps {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
  onClose: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({
  id,
  message,
  type,
  duration = 5000,
  onClose
}) => {
  const [progress, setProgress] = useState(100);
  
  // Set up the auto-dismiss functionality
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(id);
    }, duration);
    
    // Progress bar animation
    const interval = setInterval(() => {
      setProgress((prev) => {
        const newProgress = prev - (100 / (duration / 100));
        return newProgress < 0 ? 0 : newProgress;
      });
    }, 100);
    
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [id, duration, onClose]);
  
  // Determine the icon and color based on the toast type
  const getToastStyles = () => {
    switch (type) {
      case 'success':
        return {
          bgColor: 'bg-green-50 dark:bg-green-900/20',
          textColor: 'text-green-800 dark:text-green-200',
          borderColor: 'border-green-500',
          progressColor: 'bg-green-500',
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          )
        };
      case 'error':
        return {
          bgColor: 'bg-red-50 dark:bg-red-900/20',
          textColor: 'text-red-800 dark:text-red-200',
          borderColor: 'border-red-500',
          progressColor: 'bg-red-500',
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          )
        };
      case 'warning':
        return {
          bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
          textColor: 'text-yellow-800 dark:text-yellow-200',
          borderColor: 'border-yellow-500',
          progressColor: 'bg-yellow-500',
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          )
        };
      case 'info':
      default:
        return {
          bgColor: 'bg-blue-50 dark:bg-blue-900/20',
          textColor: 'text-blue-800 dark:text-blue-200',
          borderColor: 'border-blue-500',
          progressColor: 'bg-blue-500',
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )
        };
    }
  };
  
  const styles = getToastStyles();
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.8 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.8 }}
      className={`w-full max-w-md ${styles.bgColor} ${styles.textColor} rounded-lg shadow-md border-l-4 ${styles.borderColor} overflow-hidden`}
    >
      <div className="p-4 flex items-start">
        <div className="flex-shrink-0">
          {styles.icon}
        </div>
        <div className="ml-3 flex-1 pt-0.5">
          <p className="text-sm font-medium">{message}</p>
        </div>
        <div className="ml-4 flex-shrink-0 flex">
          <button
            onClick={() => onClose(id)}
            className="inline-flex text-gray-400 hover:text-gray-500 focus:outline-none"
          >
            <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
      <div className="h-1 w-full bg-gray-200 dark:bg-gray-700">
        <div
          className={`h-full ${styles.progressColor} transition-all duration-100 ease-linear`}
          style={{ width: `${progress}%` }}
        ></div>
      </div>
    </motion.div>
  );
};

export default Toast; 