'use client'

import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';

export interface TestModeContextType {
  isTestMode: boolean;
  enableTestMode: (options?: TestModeOptions) => void;
  disableTestMode: () => void;
  testOptions: TestModeOptions;
  setTestOption: <K extends keyof TestModeOptions>(key: K, value: TestModeOptions[K]) => void;
}

export interface TestModeOptions {
  simulateNetworkDelay: boolean;
  simulateErrors: boolean;
  errorProbability: number;
  errorTypes: string[];
  mockData: boolean;
  logActions: boolean;
  debugInfo: boolean;
}

const defaultTestOptions: TestModeOptions = {
  simulateNetworkDelay: false,
  simulateErrors: false,
  errorProbability: 0.1, // 10% chance of errors when simulateErrors is true
  errorTypes: ['network', 'api', 'validation'],
  mockData: false,
  logActions: true,
  debugInfo: true
};

const TestModeContext = createContext<TestModeContextType | undefined>(undefined);

export const TestModeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isTestMode, setIsTestMode] = useState(false);
  const [testOptions, setTestOptions] = useState<TestModeOptions>(defaultTestOptions);

  useEffect(() => {
    // Check if we're already in test mode (e.g. from URL parameter)
    const urlParams = new URLSearchParams(window.location.search);
    const testMode = urlParams.get('testMode');
    
    if (testMode === 'true') {
      // Parse any options from URL
      const options: Partial<TestModeOptions> = {};
      
      // Example: ?testMode=true&mockData=true&simulateErrors=true
      for (const key of Object.keys(defaultTestOptions)) {
        const value = urlParams.get(key);
        if (value !== null) {
          if (value === 'true') options[key as keyof TestModeOptions] = true as any;
          else if (value === 'false') options[key as keyof TestModeOptions] = false as any;
          else if (!isNaN(Number(value))) options[key as keyof TestModeOptions] = Number(value) as any;
          else options[key as keyof TestModeOptions] = value as any;
        }
      }
      
      enableTestMode(options);
    }
    
    // Add test mode keyboard shortcut (Ctrl+Alt+T)
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.altKey && e.key === 't') {
        setIsTestMode(prev => !prev);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  
  // Log when test mode changes
  useEffect(() => {
    if (isTestMode) {
      console.log('%c🧪 TEST MODE ENABLED', 'background: #ff0; color: #000; padding: 2px 5px; border-radius: 3px;');
      console.log('Test options:', testOptions);
      
      // Add visual indicator
      const indicator = document.createElement('div');
      indicator.id = 'test-mode-indicator';
      indicator.style.position = 'fixed';
      indicator.style.bottom = '10px';
      indicator.style.left = '10px';
      indicator.style.backgroundColor = 'rgba(255, 255, 0, 0.8)';
      indicator.style.color = '#000';
      indicator.style.padding = '5px 10px';
      indicator.style.borderRadius = '5px';
      indicator.style.fontSize = '12px';
      indicator.style.fontWeight = 'bold';
      indicator.style.zIndex = '9999';
      indicator.style.pointerEvents = 'none';
      indicator.textContent = '🧪 TEST MODE';
      document.body.appendChild(indicator);
      
      return () => {
        const existingIndicator = document.getElementById('test-mode-indicator');
        if (existingIndicator) {
          document.body.removeChild(existingIndicator);
        }
        console.log('%c🧪 TEST MODE DISABLED', 'background: #ccc; color: #000; padding: 2px 5px; border-radius: 3px;');
      };
    }
  }, [isTestMode, testOptions]);

  const enableTestMode = (options?: Partial<TestModeOptions>) => {
    setIsTestMode(true);
    if (options) {
      setTestOptions(prev => ({
        ...prev,
        ...options
      }));
    }
  };

  const disableTestMode = () => {
    setIsTestMode(false);
    setTestOptions(defaultTestOptions);
  };

  const setTestOption = <K extends keyof TestModeOptions>(key: K, value: TestModeOptions[K]) => {
    setTestOptions(prev => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    <TestModeContext.Provider
      value={{
        isTestMode,
        enableTestMode,
        disableTestMode,
        testOptions,
        setTestOption
      }}
    >
      {children}
    </TestModeContext.Provider>
  );
};

export const useTestMode = (): TestModeContextType => {
  const context = useContext(TestModeContext);
  if (context === undefined) {
    throw new Error('useTestMode must be used within a TestModeProvider');
  }
  return context;
};

export default TestModeContext; 