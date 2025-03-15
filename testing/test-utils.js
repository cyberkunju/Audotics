/**
 * Audotics Testing Utilities
 * 
 * This file contains helper functions for testing the application's
 * behavior under various conditions including error states.
 */

/**
 * Simulates network latency by adding a delay to API calls
 * @param {number} min - Minimum delay in ms
 * @param {number} max - Maximum delay in ms
 * @returns {Promise} - Resolves after random delay between min and max
 */
export const simulateNetworkLatency = (min = 100, max = 1000) => {
  const delay = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise(resolve => setTimeout(resolve, delay));
};

/**
 * Simulates a network disconnection by preventing fetch/XHR requests
 * @param {boolean} disconnect - Whether to disconnect the network
 */
export const simulateNetworkDisconnection = (disconnect = true) => {
  if (disconnect) {
    // Store original fetch
    window._originalFetch = window.fetch;
    
    // Override fetch to simulate network failure
    window.fetch = () => Promise.reject(new Error('Network request failed'));
    
    // For XMLHttpRequest
    const originalXHROpen = XMLHttpRequest.prototype.open;
    window._originalXHROpen = originalXHROpen;
    
    XMLHttpRequest.prototype.open = function() {
      this.addEventListener('loadstart', () => {
        this.abort();
      });
      originalXHROpen.apply(this, arguments);
    };
    
    // For WebSocket
    window._originalWebSocket = window.WebSocket;
    window.WebSocket = function() {
      this.close = () => {};
      setTimeout(() => {
        if (this.onclose) {
          this.onclose({ code: 1001, reason: 'Simulated disconnection' });
        }
      }, 50);
      return this;
    };
    
    console.warn('🔌 Network disconnection simulated');
  } else {
    // Restore original implementations
    if (window._originalFetch) {
      window.fetch = window._originalFetch;
    }
    
    if (window._originalXHROpen) {
      XMLHttpRequest.prototype.open = window._originalXHROpen;
    }
    
    if (window._originalWebSocket) {
      window.WebSocket = window._originalWebSocket;
    }
    
    console.warn('🔌 Network connection restored');
  }
};

/**
 * Simulates an API error response
 * @param {number} statusCode - HTTP status code to simulate
 * @param {string} endpoint - API endpoint pattern to affect (regex string)
 */
export const simulateAPIError = (statusCode = 500, endpoint = '.*') => {
  const endpointRegex = new RegExp(endpoint);
  
  // Store original fetch
  window._originalFetch = window.fetch;
  
  // Override fetch
  window.fetch = async function(url, options) {
    if (endpointRegex.test(url)) {
      await simulateNetworkLatency(200, 500);
      
      const errorResponses = {
        400: { error: 'Bad Request', message: 'The request was invalid' },
        401: { error: 'Unauthorized', message: 'Authentication required' },
        403: { error: 'Forbidden', message: 'You do not have permission to access this resource' },
        404: { error: 'Not Found', message: 'The requested resource was not found' },
        500: { error: 'Internal Server Error', message: 'Something went wrong on the server' },
        503: { error: 'Service Unavailable', message: 'The service is temporarily unavailable' }
      };
      
      const errorBody = errorResponses[statusCode] || { error: 'Unknown Error' };
      
      const response = new Response(JSON.stringify(errorBody), {
        status: statusCode,
        headers: { 'Content-Type': 'application/json' }
      });
      
      return response;
    }
    
    // Pass through for non-matching URLs
    return window._originalFetch.apply(window, [url, options]);
  };
  
  console.warn(`🔥 Simulating ${statusCode} errors for endpoints matching: ${endpoint}`);
  
  // Return function to restore original behavior
  return () => {
    window.fetch = window._originalFetch;
    console.warn('✓ API error simulation removed');
  };
};

/**
 * Simulates WebSocket events
 * @param {string} type - Event type to simulate
 * @param {Object} payload - Event payload
 */
export const simulateWebSocketEvent = (type, payload) => {
  // Create a custom event
  const wsEvent = new CustomEvent('websocketTest', {
    detail: { type, payload }
  });
  
  // Dispatch the event - application code should listen for this in test mode
  window.dispatchEvent(wsEvent);
  
  console.log(`🔄 WebSocket event simulated: ${type}`, payload);
};

/**
 * Tracks component renders
 * @param {string} componentName - Name of the component to track
 * @returns {Object} - Functions for tracking and reporting
 */
export const trackComponentRenders = (componentName) => {
  const renders = {
    count: 0,
    timestamps: [],
    props: []
  };
  
  const trackRender = (props) => {
    renders.count++;
    renders.timestamps.push(Date.now());
    renders.props.push(props);
    
    return props; // Pass through props
  };
  
  const getRenderStats = () => {
    const renderDurations = [];
    for (let i = 1; i < renders.timestamps.length; i++) {
      renderDurations.push(renders.timestamps[i] - renders.timestamps[i-1]);
    }
    
    return {
      componentName,
      totalRenders: renders.count,
      averageInterval: renderDurations.length ? 
        renderDurations.reduce((sum, val) => sum + val, 0) / renderDurations.length : 
        0,
      renders
    };
  };
  
  return {
    trackRender,
    getRenderStats
  };
};

/**
 * Generates test data for ML recommendation testing
 * @param {number} count - Number of recommendations to generate
 * @returns {Array} - Array of recommendation objects
 */
export const generateTestRecommendations = (count = 10) => {
  const genres = ['Pop', 'Rock', 'Hip Hop', 'R&B', 'Electronic', 'Country', 'Jazz', 'Classical', 'Metal', 'Folk'];
  const artistPrefixes = ['The', 'DJ', 'MC', 'Little', 'Big', 'Young', 'Old', 'King', 'Queen', 'Dr.'];
  const artistSuffixes = ['Band', 'Crew', 'Brothers', 'Sisters', 'Experience', 'Project', 'Collective', 'Ensemble'];
  
  return Array.from({ length: count }, (_, i) => {
    const genre = genres[Math.floor(Math.random() * genres.length)];
    const artistPrefix = Math.random() > 0.5 ? artistPrefixes[Math.floor(Math.random() * artistPrefixes.length)] + ' ' : '';
    const artistSuffix = Math.random() > 0.7 ? ' ' + artistSuffixes[Math.floor(Math.random() * artistSuffixes.length)] : '';
    const artistName = artistPrefix + 'Artist ' + (i + 1) + artistSuffix;
    
    return {
      id: `test-${i + 1}`,
      title: `Test Track ${i + 1}`,
      artist: artistName,
      album: `Test Album ${Math.floor(i / 3) + 1}`,
      genre: genre,
      duration: 180 + Math.floor(Math.random() * 180), // 3-6 minutes
      popularity: Math.floor(Math.random() * 100),
      imageUrl: `https://picsum.photos/seed/track${i + 1}/200/200`,
      addedBy: { id: 'test-user', name: 'Test User' }
    };
  });
};

// Export utility object
export default {
  simulateNetworkLatency,
  simulateNetworkDisconnection,
  simulateAPIError,
  simulateWebSocketEvent,
  trackComponentRenders,
  generateTestRecommendations
}; 