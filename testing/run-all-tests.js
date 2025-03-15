/**
 * Audotics Test Runner
 * 
 * This script orchestrates running all automated tests in sequence and combines
 * the results into a single report. It serves as the main entry point for automated testing.
 * 
 * Usage: node run-all-tests.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const config = {
  reportDir: path.join(__dirname, 'reports'),
  screenshotDir: path.join(__dirname, 'screenshots'),
  summaryReportPath: path.join(__dirname, 'reports', `test-summary-${Date.now()}.html`),
  testTimeout: 120000, // 2 minutes per test suite
};

// Create directories if they don't exist
if (!fs.existsSync(config.reportDir)) {
  fs.mkdirSync(config.reportDir, { recursive: true });
}

if (!fs.existsSync(config.screenshotDir)) {
  fs.mkdirSync(config.screenshotDir, { recursive: true });
}

// Test suites to run
const testSuites = [
  {
    name: 'WebSocket & Real-time Updates',
    script: './test-scripts/run-automated-tests.js',
    priority: 'High',
    category: 'Functional',
  },
  {
    name: 'ML Recommendation Accuracy',
    script: './ml-recommendation-test.js',
    priority: 'High',
    category: 'ML',
  },
  {
    name: 'Performance Benchmarks',
    script: './performance-testing.js',
    priority: 'Medium',
    category: 'Performance',
  },
];

// Results tracking
const results = {
  startTime: new Date(),
  endTime: null,
  suites: [],
  summary: {
    total: testSuites.length,
    passed: 0,
    failed: 0,
    skipped: 0,
    duration: 0,
  },
};

// Execute a test suite
function runTestSuite(suite) {
  console.log(`\n========================================`);
  console.log(`Running Test Suite: ${suite.name}`);
  console.log(`========================================\n`);
  
  const suiteResult = {
    name: suite.name,
    script: suite.script,
    priority: suite.priority,
    category: suite.category,
    status: 'Pending',
    startTime: new Date(),
    endTime: null,
    duration: 0,
    output: '',
    error: null,
  };
  
  try {
    // Execute the test script
    const output = execSync(`node "${suite.script}"`, { 
      timeout: config.testTimeout,
      encoding: 'utf8',
    });
    
    suiteResult.output = output;
    suiteResult.status = 'Passed';
    suiteResult.endTime = new Date();
    suiteResult.duration = (suiteResult.endTime - suiteResult.startTime) / 1000;
    
    console.log(`✅ ${suite.name} tests completed successfully`);
    results.summary.passed++;
    
  } catch (error) {
    suiteResult.error = error.message || 'Unknown error';
    suiteResult.status = 'Failed';
    suiteResult.endTime = new Date();
    suiteResult.duration = (suiteResult.endTime - suiteResult.startTime) / 1000;
    
    console.error(`❌ ${suite.name} tests failed: ${error.message}`);
    if (error.stdout) {
      console.log(`Output: ${error.stdout}`);
      suiteResult.output = error.stdout;
    }
    results.summary.failed++;
  }
  
  results.suites.push(suiteResult);
}

// Generate HTML summary report
function generateSummaryReport() {
  results.endTime = new Date();
  results.summary.duration = (results.endTime - results.startTime) / 1000;
  
  const html = `
  <!DOCTYPE html>
  <html>
  <head>
    <title>Audotics Test Summary Report</title>
    <style>
      body { font-family: Arial, sans-serif; margin: 20px; }
      h1, h2 { color: #333; }
      .summary { display: flex; margin-bottom: 20px; }
      .summary-item { margin-right: 20px; padding: 10px; border-radius: 5px; }
      .total { background-color: #f0f0f0; }
      .passed { background-color: #dff0d8; }
      .failed { background-color: #f2dede; }
      .skipped { background-color: #fcf8e3; }
      table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
      th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
      th { background-color: #f2f2f2; }
      .pass { color: green; }
      .fail { color: red; }
      .skip { color: orange; }
      .details { margin-top: 10px; padding: 8px; background-color: #f8f8f8; border-radius: 4px; overflow: auto; max-height: 200px; }
      .details pre { margin: 0; white-space: pre-wrap; }
      .badge { display: inline-block; padding: 3px 8px; border-radius: 3px; font-size: 12px; margin-right: 5px; }
      .high { background-color: #ffdddd; }
      .medium { background-color: #ffffcc; }
      .low { background-color: #ddffdd; }
      .functional { background-color: #ddddff; }
      .ml { background-color: #ffe6cc; }
      .performance { background-color: #e6f7ff; }
    </style>
  </head>
  <body>
    <h1>Audotics Test Summary Report</h1>
    <p><strong>Test Run Date:</strong> ${results.startTime.toLocaleString()}</p>
    <p><strong>Total Duration:</strong> ${results.summary.duration.toFixed(2)} seconds</p>
    
    <h2>Summary</h2>
    <div class="summary">
      <div class="summary-item total">Total: ${results.summary.total}</div>
      <div class="summary-item passed">Passed: ${results.summary.passed}</div>
      <div class="summary-item failed">Failed: ${results.summary.failed}</div>
      <div class="summary-item skipped">Skipped: ${results.summary.skipped}</div>
    </div>
    
    <h2>Test Suites</h2>
    <table>
      <tr>
        <th>Test Suite</th>
        <th>Category</th>
        <th>Priority</th>
        <th>Status</th>
        <th>Duration</th>
      </tr>
      ${results.suites.map(suite => `
        <tr>
          <td>${suite.name}</td>
          <td><span class="badge ${suite.category.toLowerCase()}">${suite.category}</span></td>
          <td><span class="badge ${suite.priority.toLowerCase()}">${suite.priority}</span></td>
          <td class="${suite.status.toLowerCase() === 'passed' ? 'pass' : suite.status.toLowerCase() === 'failed' ? 'fail' : 'skip'}">${suite.status}</td>
          <td>${suite.duration.toFixed(2)}s</td>
        </tr>
        <tr>
          <td colspan="5">
            <div class="details">
              <strong>Script:</strong> ${suite.script}<br>
              ${suite.error ? `<strong>Error:</strong> ${suite.error}<br>` : ''}
              <strong>Output:</strong>
              <pre>${suite.output}</pre>
            </div>
          </td>
        </tr>
      `).join('')}
    </table>
    
    <h2>Next Steps</h2>
    <ol>
      <li>Review individual test reports in the 'reports' directory</li>
      <li>Check screenshots of test runs in the 'screenshots' directory</li>
      <li>Investigate failed tests and fix any issues</li>
      <li>Update the test-execution-tracker.md with results</li>
    </ol>
    
    <p><em>Note: This is an automatically generated report. For detailed test results, check the individual test reports.</em></p>
  </body>
  </html>
  `;
  
  fs.writeFileSync(config.summaryReportPath, html);
  console.log(`\nSummary report saved to: ${config.summaryReportPath}`);
}

// Main execution
console.log('Starting Audotics automated test suite...');
console.log(`Test started at: ${results.startTime.toLocaleString()}`);

// Run each test suite in sequence
testSuites.forEach(suite => {
  runTestSuite(suite);
});

// Generate the summary report
generateSummaryReport();

// Display final results
console.log('\n========================================');
console.log('Test Suite Execution Completed');
console.log('========================================');
console.log(`Total: ${results.summary.total}`);
console.log(`Passed: ${results.summary.passed}`);
console.log(`Failed: ${results.summary.failed}`);
console.log(`Skipped: ${results.summary.skipped}`);
console.log(`Duration: ${results.summary.duration.toFixed(2)} seconds`);
console.log(`\nSummary report saved to: ${config.summaryReportPath}`);

// Exit with appropriate code
process.exit(results.summary.failed > 0 ? 1 : 0); 