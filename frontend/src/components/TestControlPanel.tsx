'use client'

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTestMode } from '@/contexts/TestModeContext';

// Add window global declaration to fix TypeScript error
declare global {
  interface Window {
    __DEBUG_PARTICIPANTS__?: any[];
  }
}

const TestControlPanel: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'network' | 'errors' | 'data'>('general');
  const { isTestMode, testOptions, enableTestMode, disableTestMode, setTestOption } = useTestMode();

  if (!isTestMode) return null;

  return (
    <div className="fixed right-4 bottom-4 z-50">
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-yellow-400 hover:bg-yellow-500 text-black p-2 rounded-full shadow-lg"
      >
        {isOpen ? (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
          </svg>
        )}
      </button>

      {/* Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ type: 'spring', damping: 20 }}
            className="absolute bottom-16 right-0 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
          >
            <div className="p-4 bg-yellow-100 dark:bg-yellow-900 border-b border-yellow-200 dark:border-yellow-800">
              <h3 className="text-lg font-bold flex items-center">
                <span role="img" aria-label="Test" className="mr-2">🧪</span>
                Test Control Panel
              </h3>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setActiveTab('general')}
                className={`flex-1 py-2 text-sm font-medium ${
                  activeTab === 'general'
                    ? 'text-yellow-600 border-b-2 border-yellow-500'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                General
              </button>
              <button
                onClick={() => setActiveTab('network')}
                className={`flex-1 py-2 text-sm font-medium ${
                  activeTab === 'network'
                    ? 'text-yellow-600 border-b-2 border-yellow-500'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                Network
              </button>
              <button
                onClick={() => setActiveTab('errors')}
                className={`flex-1 py-2 text-sm font-medium ${
                  activeTab === 'errors'
                    ? 'text-yellow-600 border-b-2 border-yellow-500'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                Errors
              </button>
              <button
                onClick={() => setActiveTab('data')}
                className={`flex-1 py-2 text-sm font-medium ${
                  activeTab === 'data'
                    ? 'text-yellow-600 border-b-2 border-yellow-500'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                Data
              </button>
            </div>

            {/* Tab Content */}
            <div className="p-4">
              {/* General Tab */}
              {activeTab === 'general' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="font-medium">Test Mode</label>
                    <div className="relative inline-block w-12 h-6">
                      <input
                        type="checkbox"
                        className="hidden"
                        checked={isTestMode}
                        onChange={() => isTestMode ? disableTestMode() : enableTestMode()}
                      />
                      <div
                        className={`w-12 h-6 cursor-pointer rounded-full transition-colors ${
                          isTestMode ? 'bg-yellow-500' : 'bg-gray-300 dark:bg-gray-600'
                        }`}
                        onClick={() => isTestMode ? disableTestMode() : enableTestMode()}
                      >
                        <div
                          className={`w-6 h-6 rounded-full bg-white shadow transform transition-transform ${
                            isTestMode ? 'translate-x-6' : 'translate-x-0'
                          }`}
                        ></div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="font-medium">Enable Logs</label>
                    <div className="relative inline-block w-12 h-6">
                      <input
                        type="checkbox"
                        className="hidden"
                        checked={testOptions.logActions}
                        onChange={() => setTestOption('logActions', !testOptions.logActions)}
                      />
                      <div
                        className={`w-12 h-6 cursor-pointer rounded-full transition-colors ${
                          testOptions.logActions ? 'bg-yellow-500' : 'bg-gray-300 dark:bg-gray-600'
                        }`}
                        onClick={() => setTestOption('logActions', !testOptions.logActions)}
                      >
                        <div
                          className={`w-6 h-6 rounded-full bg-white shadow transform transition-transform ${
                            testOptions.logActions ? 'translate-x-6' : 'translate-x-0'
                          }`}
                        ></div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="font-medium">Debug Info</label>
                    <div className="relative inline-block w-12 h-6">
                      <input
                        type="checkbox"
                        className="hidden"
                        checked={testOptions.debugInfo}
                        onChange={() => setTestOption('debugInfo', !testOptions.debugInfo)}
                      />
                      <div
                        className={`w-12 h-6 cursor-pointer rounded-full transition-colors ${
                          testOptions.debugInfo ? 'bg-yellow-500' : 'bg-gray-300 dark:bg-gray-600'
                        }`}
                        onClick={() => setTestOption('debugInfo', !testOptions.debugInfo)}
                      >
                        <div
                          className={`w-6 h-6 rounded-full bg-white shadow transform transition-transform ${
                            testOptions.debugInfo ? 'translate-x-6' : 'translate-x-0'
                          }`}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Network Tab */}
              {activeTab === 'network' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="font-medium">Simulate Network Delay</label>
                    <div className="relative inline-block w-12 h-6">
                      <input
                        type="checkbox"
                        className="hidden"
                        checked={testOptions.simulateNetworkDelay}
                        onChange={() => setTestOption('simulateNetworkDelay', !testOptions.simulateNetworkDelay)}
                      />
                      <div
                        className={`w-12 h-6 cursor-pointer rounded-full transition-colors ${
                          testOptions.simulateNetworkDelay ? 'bg-yellow-500' : 'bg-gray-300 dark:bg-gray-600'
                        }`}
                        onClick={() => setTestOption('simulateNetworkDelay', !testOptions.simulateNetworkDelay)}
                      >
                        <div
                          className={`w-6 h-6 rounded-full bg-white shadow transform transition-transform ${
                            testOptions.simulateNetworkDelay ? 'translate-x-6' : 'translate-x-0'
                          }`}
                        ></div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block font-medium mb-1">Network Actions</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => {
                          // Import and use the network utility dynamically
                          import('@/../../testing/test-utils').then(utils => {
                            utils.simulateNetworkDisconnection(true);
                            // Auto-reconnect after 5 seconds
                            setTimeout(() => {
                              utils.simulateNetworkDisconnection(false);
                            }, 5000);
                          });
                        }}
                        className="py-1 px-2 text-sm bg-red-500 text-white rounded hover:bg-red-600"
                      >
                        Disconnect (5s)
                      </button>
                      
                      <button
                        onClick={() => {
                          // Import and use the network utility dynamically
                          import('@/../../testing/test-utils').then(utils => {
                            utils.simulateNetworkLatency(2000, 4000).then(() => {
                              console.log('High latency request completed');
                            });
                          });
                        }}
                        className="py-1 px-2 text-sm bg-orange-500 text-white rounded hover:bg-orange-600"
                      >
                        High Latency
                      </button>
                      
                      <button
                        onClick={() => {
                          // Import and use the WebSocket utility dynamically
                          import('@/../../testing/test-utils').then(utils => {
                            utils.simulateWebSocketEvent('SESSION_UPDATE', {
                              sessionId: '123',
                              name: 'Test Session',
                              participants: [
                                { id: '1', name: 'Test User 1' },
                                { id: '2', name: 'Test User 2' }
                              ]
                            });
                          });
                        }}
                        className="py-1 px-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                      >
                        Simulate WS Event
                      </button>
                      
                      <button
                        onClick={() => {
                          location.reload();
                        }}
                        className="py-1 px-2 text-sm bg-green-500 text-white rounded hover:bg-green-600"
                      >
                        Reload Page
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Errors Tab */}
              {activeTab === 'errors' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="font-medium">Simulate Errors</label>
                    <div className="relative inline-block w-12 h-6">
                      <input
                        type="checkbox"
                        className="hidden"
                        checked={testOptions.simulateErrors}
                        onChange={() => setTestOption('simulateErrors', !testOptions.simulateErrors)}
                      />
                      <div
                        className={`w-12 h-6 cursor-pointer rounded-full transition-colors ${
                          testOptions.simulateErrors ? 'bg-yellow-500' : 'bg-gray-300 dark:bg-gray-600'
                        }`}
                        onClick={() => setTestOption('simulateErrors', !testOptions.simulateErrors)}
                      >
                        <div
                          className={`w-6 h-6 rounded-full bg-white shadow transform transition-transform ${
                            testOptions.simulateErrors ? 'translate-x-6' : 'translate-x-0'
                          }`}
                        ></div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block font-medium mb-1">Error Probability: {testOptions.errorProbability * 100}%</label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={testOptions.errorProbability}
                      onChange={(e) => setTestOption('errorProbability', parseFloat(e.target.value))}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block font-medium mb-1">Error Types</label>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="network-error"
                          checked={testOptions.errorTypes.includes('network')}
                          onChange={() => {
                            const newTypes = testOptions.errorTypes.includes('network')
                              ? testOptions.errorTypes.filter(t => t !== 'network')
                              : [...testOptions.errorTypes, 'network'];
                            setTestOption('errorTypes', newTypes);
                          }}
                          className="h-4 w-4 text-yellow-500"
                        />
                        <label htmlFor="network-error" className="ml-2 text-sm">Network</label>
                      </div>
                      
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="api-error"
                          checked={testOptions.errorTypes.includes('api')}
                          onChange={() => {
                            const newTypes = testOptions.errorTypes.includes('api')
                              ? testOptions.errorTypes.filter(t => t !== 'api')
                              : [...testOptions.errorTypes, 'api'];
                            setTestOption('errorTypes', newTypes);
                          }}
                          className="h-4 w-4 text-yellow-500"
                        />
                        <label htmlFor="api-error" className="ml-2 text-sm">API</label>
                      </div>
                      
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="validation-error"
                          checked={testOptions.errorTypes.includes('validation')}
                          onChange={() => {
                            const newTypes = testOptions.errorTypes.includes('validation')
                              ? testOptions.errorTypes.filter(t => t !== 'validation')
                              : [...testOptions.errorTypes, 'validation'];
                            setTestOption('errorTypes', newTypes);
                          }}
                          className="h-4 w-4 text-yellow-500"
                        />
                        <label htmlFor="validation-error" className="ml-2 text-sm">Validation</label>
                      </div>
                      
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="component-error"
                          checked={testOptions.errorTypes.includes('component')}
                          onChange={() => {
                            const newTypes = testOptions.errorTypes.includes('component')
                              ? testOptions.errorTypes.filter(t => t !== 'component')
                              : [...testOptions.errorTypes, 'component'];
                            setTestOption('errorTypes', newTypes);
                          }}
                          className="h-4 w-4 text-yellow-500"
                        />
                        <label htmlFor="component-error" className="ml-2 text-sm">Component</label>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block font-medium mb-1">Trigger Error</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => {
                          import('@/../../testing/test-utils').then(utils => {
                            const restoreNormal = utils.simulateAPIError(401, 'api/auth');
                            // Restore after 5 seconds
                            setTimeout(restoreNormal, 5000);
                          });
                        }}
                        className="py-1 px-2 text-sm bg-red-500 text-white rounded hover:bg-red-600"
                      >
                        Auth Error (401)
                      </button>
                      
                      <button
                        onClick={() => {
                          import('@/../../testing/test-utils').then(utils => {
                            const restoreNormal = utils.simulateAPIError(500, 'api/sessions');
                            // Restore after 5 seconds
                            setTimeout(restoreNormal, 5000);
                          });
                        }}
                        className="py-1 px-2 text-sm bg-red-500 text-white rounded hover:bg-red-600"
                      >
                        Server Error (500)
                      </button>
                      
                      <button
                        onClick={() => {
                          throw new Error('This is a deliberately triggered test error');
                        }}
                        className="py-1 px-2 text-sm bg-red-500 text-white rounded hover:bg-red-600"
                      >
                        Component Error
                      </button>
                      
                      <button
                        onClick={() => {
                          // Import and use the error utility dynamically
                          const err = new Error('Invalid data format');
                          err.name = 'ValidationError';
                          // This will be caught by error boundary
                          throw err;
                        }}
                        className="py-1 px-2 text-sm bg-red-500 text-white rounded hover:bg-red-600"
                      >
                        Validation Error
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Data Tab */}
              {activeTab === 'data' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="font-medium">Use Mock Data</label>
                    <div className="relative inline-block w-12 h-6">
                      <input
                        type="checkbox"
                        className="hidden"
                        checked={testOptions.mockData}
                        onChange={() => setTestOption('mockData', !testOptions.mockData)}
                      />
                      <div
                        className={`w-12 h-6 cursor-pointer rounded-full transition-colors ${
                          testOptions.mockData ? 'bg-yellow-500' : 'bg-gray-300 dark:bg-gray-600'
                        }`}
                        onClick={() => setTestOption('mockData', !testOptions.mockData)}
                      >
                        <div
                          className={`w-6 h-6 rounded-full bg-white shadow transform transition-transform ${
                            testOptions.mockData ? 'translate-x-6' : 'translate-x-0'
                          }`}
                        ></div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block font-medium mb-1">Generate Mock Data</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => {
                          import('@/../../testing/test-utils').then(utils => {
                            const recommendations = utils.generateTestRecommendations(5);
                            console.log('Generated recommendations:', recommendations);
                            
                            // Simulate WebSocket event with these recommendations
                            utils.simulateWebSocketEvent('RECOMMENDATION_ADDED', {
                              sessionId: '123',
                              track: recommendations[0]
                            });
                          });
                        }}
                        className="py-1 px-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                      >
                        Mock Recommendations
                      </button>
                      
                      <button
                        onClick={() => {
                          // Clear localStorage for testing fresh state
                          if (confirm('This will clear application data. Continue?')) {
                            localStorage.clear();
                            sessionStorage.clear();
                            location.reload();
                          }
                        }}
                        className="py-1 px-2 text-sm bg-red-500 text-white rounded hover:bg-red-600"
                      >
                        Clear Storage
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block font-medium mb-1">Mock Users in Session</label>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          import('@/../../testing/test-utils').then(utils => {
                            utils.simulateWebSocketEvent('USER_JOIN', {
                              user: {
                                id: `user-${Date.now()}`,
                                name: `Test User ${Math.floor(Math.random() * 100)}`,
                                avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${Date.now()}`
                              }
                            });
                          });
                        }}
                        className="py-1 px-2 text-sm bg-green-500 text-white rounded hover:bg-green-600"
                      >
                        Add User
                      </button>
                      
                      <button
                        onClick={() => {
                          import('@/../../testing/test-utils').then(utils => {
                            // This only works if we're tracking participants in context or global state
                            const participants = window.__DEBUG_PARTICIPANTS__ || [];
                            if (participants.length > 0) {
                              const randomIndex = Math.floor(Math.random() * participants.length);
                              const userToRemove = participants[randomIndex];
                              
                              utils.simulateWebSocketEvent('USER_LEAVE', {
                                user: userToRemove
                              });
                            }
                          });
                        }}
                        className="py-1 px-2 text-sm bg-red-500 text-white rounded hover:bg-red-600"
                      >
                        Remove User
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-between">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(
                    `?testMode=true&simulateNetworkDelay=${testOptions.simulateNetworkDelay}&simulateErrors=${testOptions.simulateErrors}&errorProbability=${testOptions.errorProbability}&mockData=${testOptions.mockData}&logActions=${testOptions.logActions}&debugInfo=${testOptions.debugInfo}`
                  );
                  alert('Test URL parameters copied to clipboard!');
                }}
                className="text-sm text-blue-500 hover:text-blue-700"
              >
                Copy URL Params
              </button>
              <button
                onClick={() => {
                  disableTestMode();
                  setIsOpen(false);
                }}
                className="text-sm text-red-500 hover:text-red-700"
              >
                Exit Test Mode
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TestControlPanel; 