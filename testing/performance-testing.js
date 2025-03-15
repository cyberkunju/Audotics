/**
 * Audotics Performance Testing Utilities
 * 
 * This script provides utilities for monitoring and recording application
 * performance metrics during testing. It helps ensure the application meets
 * performance targets defined in the test plan.
 */

/**
 * Injects performance monitoring code into the application
 * Call this function in the browser console when testing
 */
function initPerformanceMonitoring() {
  // Create performance storage if it doesn't exist
  if (!window.__AUDOTICS_PERFORMANCE__) {
    window.__AUDOTICS_PERFORMANCE__ = {
      navigationTiming: {},
      networkRequests: [],
      renderTiming: {},
      interactions: [],
      memory: [],
      webSocketMessages: []
    };
  }
  
  // Store performance data
  const perf = window.__AUDOTICS_PERFORMANCE__;
  
  // Record navigation timing
  if (performance && performance.timing) {
    const timing = performance.timing;
    perf.navigationTiming = {
      navigationStart: timing.navigationStart,
      redirectTime: timing.redirectEnd - timing.redirectStart,
      dnsTime: timing.domainLookupEnd - timing.domainLookupStart,
      connectTime: timing.connectEnd - timing.connectStart,
      requestTime: timing.responseStart - timing.requestStart,
      responseTime: timing.responseEnd - timing.responseStart,
      domProcessingTime: timing.domComplete - timing.domLoading,
      loadEventTime: timing.loadEventEnd - timing.loadEventStart,
      totalPageLoadTime: timing.loadEventEnd - timing.navigationStart,
      timeToFirstByte: timing.responseStart - timing.navigationStart,
      timeToInteractive: null // Will be calculated later
    };
  }
  
  // For newer browsers using Navigation Timing API Level 2
  if (window.PerformanceNavigationTiming) {
    try {
      const navEntry = performance.getEntriesByType('navigation')[0];
      if (navEntry) {
        perf.navigationTimingV2 = {
          startTime: navEntry.startTime,
          redirectTime: navEntry.redirectEnd - navEntry.redirectStart,
          dnsTime: navEntry.domainLookupEnd - navEntry.domainLookupStart,
          connectTime: navEntry.connectEnd - navEntry.connectStart,
          requestTime: navEntry.responseStart - navEntry.requestStart,
          responseTime: navEntry.responseEnd - navEntry.responseStart,
          domProcessingTime: navEntry.domComplete - navEntry.domLoading,
          loadEventTime: navEntry.loadEventEnd - navEntry.loadEventStart,
          totalPageLoadTime: navEntry.loadEventEnd - navEntry.startTime,
          timeToFirstByte: navEntry.responseStart - navEntry.startTime,
          domContentLoaded: navEntry.domContentLoadedEventEnd - navEntry.startTime,
          domInteractive: navEntry.domInteractive - navEntry.startTime
        };
      }
    } catch (e) {
      console.error('Error collecting Navigation Timing V2 metrics:', e);
    }
  }
  
  // Collect Core Web Vitals if available
  try {
    // Largest Contentful Paint
    let lcp;
    const lcpObserver = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      lcp = entries[entries.length - 1];
      perf.coreWebVitals = perf.coreWebVitals || {};
      perf.coreWebVitals.LCP = lcp.startTime;
    });
    lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
    
    // First Input Delay
    const fidObserver = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      const firstInput = entries[0];
      perf.coreWebVitals = perf.coreWebVitals || {};
      perf.coreWebVitals.FID = firstInput.processingStart - firstInput.startTime;
    });
    fidObserver.observe({ type: 'first-input', buffered: true });
    
    // Cumulative Layout Shift
    let clsValue = 0;
    const clsObserver = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      entries.forEach(entry => {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
        }
      });
      perf.coreWebVitals = perf.coreWebVitals || {};
      perf.coreWebVitals.CLS = clsValue;
    });
    clsObserver.observe({ type: 'layout-shift', buffered: true });
  } catch (e) {
    console.error('Error collecting Core Web Vitals metrics:', e);
  }
  
  // Monitor network requests
  try {
    const originalFetch = window.fetch;
    window.fetch = async function(...args) {
      const url = args[0] instanceof Request ? args[0].url : args[0];
      const startTime = performance.now();
      const requestObj = {
        url,
        method: args[1]?.method || 'GET',
        startTime,
        endTime: null,
        duration: null,
        status: null,
        success: null
      };
      
      perf.networkRequests.push(requestObj);
      const requestIndex = perf.networkRequests.length - 1;
      
      try {
        const response = await originalFetch.apply(this, args);
        requestObj.endTime = performance.now();
        requestObj.duration = requestObj.endTime - requestObj.startTime;
        requestObj.status = response.status;
        requestObj.success = response.ok;
        perf.networkRequests[requestIndex] = requestObj;
        return response;
      } catch (error) {
        requestObj.endTime = performance.now();
        requestObj.duration = requestObj.endTime - requestObj.startTime;
        requestObj.status = 'error';
        requestObj.success = false;
        requestObj.error = error.message;
        perf.networkRequests[requestIndex] = requestObj;
        throw error;
      }
    };
    
    // Also monitor XHR requests
    const originalOpen = XMLHttpRequest.prototype.open;
    const originalSend = XMLHttpRequest.prototype.send;
    
    XMLHttpRequest.prototype.open = function(method, url) {
      this._perfData = {
        method,
        url,
        startTime: null,
        endTime: null,
        duration: null
      };
      return originalOpen.apply(this, arguments);
    };
    
    XMLHttpRequest.prototype.send = function() {
      if (this._perfData) {
        this._perfData.startTime = performance.now();
        
        const requestObj = { ...this._perfData };
        perf.networkRequests.push(requestObj);
        const requestIndex = perf.networkRequests.length - 1;
        
        this.addEventListener('loadend', function() {
          requestObj.endTime = performance.now();
          requestObj.duration = requestObj.endTime - requestObj.startTime;
          requestObj.status = this.status;
          requestObj.success = this.status >= 200 && this.status < 300;
          perf.networkRequests[requestIndex] = requestObj;
        });
      }
      return originalSend.apply(this, arguments);
    };
  } catch (e) {
    console.error('Error setting up network monitoring:', e);
  }
  
  // Monitor WebSocket messages
  try {
    const originalWebSocket = window.WebSocket;
    window.WebSocket = function(...args) {
      const socket = new originalWebSocket(...args);
      const url = args[0];
      
      const originalSend = socket.send;
      socket.send = function(data) {
        const msgData = {
          type: 'outgoing',
          url,
          timestamp: performance.now(),
          data: typeof data === 'string' ? data.substring(0, 100) : '[Binary Data]',
          size: data.length || 0
        };
        perf.webSocketMessages.push(msgData);
        return originalSend.apply(this, arguments);
      };
      
      socket.addEventListener('message', function(event) {
        const msgData = {
          type: 'incoming',
          url,
          timestamp: performance.now(),
          data: typeof event.data === 'string' ? event.data.substring(0, 100) : '[Binary Data]',
          size: event.data.length || 0
        };
        perf.webSocketMessages.push(msgData);
      });
      
      return socket;
    };
  } catch (e) {
    console.error('Error setting up WebSocket monitoring:', e);
  }
  
  // Monitor memory usage
  const monitorMemory = () => {
    if (performance.memory) {
      perf.memory.push({
        timestamp: performance.now(),
        totalJSHeapSize: performance.memory.totalJSHeapSize,
        usedJSHeapSize: performance.memory.usedJSHeapSize,
        jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
      });
    }
  };
  
  // Sample memory usage every 5 seconds
  const memoryInterval = setInterval(monitorMemory, 5000);
  monitorMemory();
  
  // Monitor user interactions
  document.addEventListener('click', function(e) {
    const target = e.target.tagName.toLowerCase();
    const id = e.target.id;
    const classes = Array.from(e.target.classList).join(' ');
    
    perf.interactions.push({
      type: 'click',
      target,
      id,
      classes,
      timestamp: performance.now(),
      x: e.clientX,
      y: e.clientY
    });
  }, true);
  
  // Clean up when done
  return function cleanup() {
    clearInterval(memoryInterval);
    window.fetch = originalFetch;
    XMLHttpRequest.prototype.open = originalOpen;
    XMLHttpRequest.prototype.send = originalSend;
    window.WebSocket = originalWebSocket;
  };
}

/**
 * Analyzes the collected performance data and generates a report
 * Call this function in the browser console after testing
 */
function generatePerformanceReport() {
  if (!window.__AUDOTICS_PERFORMANCE__) {
    return 'No performance data available. Initialize monitoring first with initPerformanceMonitoring()';
  }
  
  const perf = window.__AUDOTICS_PERFORMANCE__;
  
  let report = '# Audotics Performance Test Report\n\n';
  report += `Generated: ${new Date().toISOString()}\n\n`;
  
  // Page Load Metrics
  report += '## Page Load Metrics\n\n';
  if (perf.navigationTimingV2) {
    const nav = perf.navigationTimingV2;
    report += `- Time to First Byte: ${Math.round(nav.timeToFirstByte)}ms\n`;
    report += `- DOM Content Loaded: ${Math.round(nav.domContentLoaded)}ms\n`;
    report += `- DOM Interactive: ${Math.round(nav.domInteractive)}ms\n`;
    report += `- Total Page Load: ${Math.round(nav.totalPageLoadTime)}ms\n`;
  } else if (perf.navigationTiming) {
    const nav = perf.navigationTiming;
    report += `- Time to First Byte: ${Math.round(nav.timeToFirstByte)}ms\n`;
    report += `- DOM Processing Time: ${Math.round(nav.domProcessingTime)}ms\n`;
    report += `- Total Page Load: ${Math.round(nav.totalPageLoadTime)}ms\n`;
  }
  
  // Core Web Vitals
  if (perf.coreWebVitals) {
    report += '\n## Core Web Vitals\n\n';
    const cwv = perf.coreWebVitals;
    
    // LCP Assessment
    let lcpAssessment = 'Good';
    if (cwv.LCP > 2500) lcpAssessment = cwv.LCP > 4000 ? 'Poor' : 'Needs Improvement';
    
    // FID Assessment
    let fidAssessment = 'Good';
    if (cwv.FID > 100) fidAssessment = cwv.FID > 300 ? 'Poor' : 'Needs Improvement';
    
    // CLS Assessment
    let clsAssessment = 'Good';
    if (cwv.CLS > 0.1) clsAssessment = cwv.CLS > 0.25 ? 'Poor' : 'Needs Improvement';
    
    report += `- Largest Contentful Paint (LCP): ${Math.round(cwv.LCP)}ms (${lcpAssessment})\n`;
    report += `- First Input Delay (FID): ${Math.round(cwv.FID)}ms (${fidAssessment})\n`;
    report += `- Cumulative Layout Shift (CLS): ${cwv.CLS.toFixed(3)} (${clsAssessment})\n`;
  }
  
  // Network Requests
  report += '\n## Network Requests\n\n';
  const requests = perf.networkRequests;
  
  if (requests.length > 0) {
    // Summary statistics
    const apiRequests = requests.filter(r => r.url.includes('/api/'));
    const successful = requests.filter(r => r.success === true);
    const failed = requests.filter(r => r.success === false);
    const durations = requests.filter(r => r.duration).map(r => r.duration);
    const avgDuration = durations.length ? durations.reduce((a, b) => a + b, 0) / durations.length : 0;
    const maxDuration = durations.length ? Math.max(...durations) : 0;
    
    report += `- Total Requests: ${requests.length}\n`;
    report += `- API Requests: ${apiRequests.length}\n`;
    report += `- Successful Requests: ${successful.length} (${Math.round(successful.length / requests.length * 100)}%)\n`;
    report += `- Failed Requests: ${failed.length}\n`;
    report += `- Average Request Duration: ${Math.round(avgDuration)}ms\n`;
    report += `- Slowest Request: ${Math.round(maxDuration)}ms\n\n`;
    
    // Slow requests
    const slowRequests = requests.filter(r => r.duration > 500).sort((a, b) => b.duration - a.duration);
    if (slowRequests.length > 0) {
      report += `### Slow Requests (>500ms)\n\n`;
      report += `| URL | Method | Duration (ms) | Status |\n`;
      report += `|-----|--------|---------------|--------|\n`;
      
      slowRequests.forEach(req => {
        report += `| ${req.url.substring(0, 50)}${req.url.length > 50 ? '...' : ''} | ${req.method} | ${Math.round(req.duration)} | ${req.status} |\n`;
      });
      
      report += '\n';
    }
    
    // Failed requests
    if (failed.length > 0) {
      report += `### Failed Requests\n\n`;
      report += `| URL | Method | Duration (ms) | Status |\n`;
      report += `|-----|--------|---------------|--------|\n`;
      
      failed.forEach(req => {
        report += `| ${req.url.substring(0, 50)}${req.url.length > 50 ? '...' : ''} | ${req.method} | ${Math.round(req.duration)} | ${req.status} |\n`;
      });
      
      report += '\n';
    }
  } else {
    report += 'No network requests recorded.\n\n';
  }
  
  // WebSocket Data
  report += '\n## WebSocket Communication\n\n';
  const wsMessages = perf.webSocketMessages;
  
  if (wsMessages.length > 0) {
    const incoming = wsMessages.filter(m => m.type === 'incoming');
    const outgoing = wsMessages.filter(m => m.type === 'outgoing');
    
    report += `- Total Messages: ${wsMessages.length}\n`;
    report += `- Incoming Messages: ${incoming.length}\n`;
    report += `- Outgoing Messages: ${outgoing.length}\n\n`;
    
    // Sample of last 5 messages
    report += `### Last 5 WebSocket Messages\n\n`;
    report += `| Type | Timestamp | Size | Data Preview |\n`;
    report += `|------|-----------|------|-------------|\n`;
    
    wsMessages.slice(-5).forEach(msg => {
      report += `| ${msg.type} | ${Math.round(msg.timestamp)} | ${msg.size} | ${msg.data.replace(/\n/g, ' ')} |\n`;
    });
    
    report += '\n';
  } else {
    report += 'No WebSocket messages recorded.\n\n';
  }
  
  // Memory Usage
  report += '\n## Memory Usage\n\n';
  const memory = perf.memory;
  
  if (memory.length > 0) {
    const lastMemory = memory[memory.length - 1];
    const initialMemory = memory[0];
    const usedJSHeapSizeMB = Math.round(lastMemory.usedJSHeapSize / (1024 * 1024));
    const jsHeapSizeLimitMB = Math.round(lastMemory.jsHeapSizeLimit / (1024 * 1024));
    const usagePercentage = Math.round((lastMemory.usedJSHeapSize / lastMemory.jsHeapSizeLimit) * 100);
    const memoryGrowthMB = Math.round((lastMemory.usedJSHeapSize - initialMemory.usedJSHeapSize) / (1024 * 1024));
    
    report += `- Current JS Heap Usage: ${usedJSHeapSizeMB}MB / ${jsHeapSizeLimitMB}MB (${usagePercentage}%)\n`;
    report += `- Memory Growth During Test: ${memoryGrowthMB}MB\n`;
    report += `- Sample Count: ${memory.length}\n\n`;
  } else {
    report += 'No memory usage data recorded.\n\n';
  }
  
  // Performance Verdict
  report += '\n## Performance Assessment\n\n';
  
  const performanceIssues = [];
  
  // Check page load performance
  if (perf.navigationTimingV2 && perf.navigationTimingV2.totalPageLoadTime > 3000) {
    performanceIssues.push(`- Page load time exceeds target (${Math.round(perf.navigationTimingV2.totalPageLoadTime)}ms > 3000ms)`);
  }
  
  // Check Core Web Vitals
  if (perf.coreWebVitals) {
    if (perf.coreWebVitals.LCP > 2500) {
      performanceIssues.push(`- LCP exceeds target (${Math.round(perf.coreWebVitals.LCP)}ms > 2500ms)`);
    }
    
    if (perf.coreWebVitals.FID > 100) {
      performanceIssues.push(`- FID exceeds target (${Math.round(perf.coreWebVitals.FID)}ms > 100ms)`);
    }
    
    if (perf.coreWebVitals.CLS > 0.1) {
      performanceIssues.push(`- CLS exceeds target (${perf.coreWebVitals.CLS.toFixed(3)} > 0.1)`);
    }
  }
  
  // Check network performance
  const durations = perf.networkRequests.filter(r => r.duration).map(r => r.duration);
  const avgDuration = durations.length ? durations.reduce((a, b) => a + b, 0) / durations.length : 0;
  
  if (avgDuration > 500) {
    performanceIssues.push(`- Average API response time exceeds target (${Math.round(avgDuration)}ms > 500ms)`);
  }
  
  // Check memory usage
  if (perf.memory.length > 1) {
    const lastMemory = perf.memory[perf.memory.length - 1];
    const initialMemory = perf.memory[0];
    const memoryGrowthMB = (lastMemory.usedJSHeapSize - initialMemory.usedJSHeapSize) / (1024 * 1024);
    
    if (memoryGrowthMB > 50) {
      performanceIssues.push(`- Memory growth exceeds target (${Math.round(memoryGrowthMB)}MB > 50MB)`);
    }
  }
  
  if (performanceIssues.length > 0) {
    report += '### Performance Issues Detected\n\n';
    performanceIssues.forEach(issue => {
      report += `${issue}\n`;
    });
    report += '\n';
  } else {
    report += 'All performance metrics meet targets. No issues detected.\n\n';
  }
  
  return report;
}

/**
 * For Node.js environment - export functions to be used in testing scripts
 */
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    initPerformanceMonitoringScript: `(${initPerformanceMonitoring.toString()})()`,
    generatePerformanceReportScript: generatePerformanceReport.toString(),
    getPerformanceReportCode: () => `(${generatePerformanceReport.toString()})()`
  };
} else {
  // For browser environment, expose functions globally
  window.initPerformanceMonitoring = initPerformanceMonitoring;
  window.generatePerformanceReport = generatePerformanceReport;
} 