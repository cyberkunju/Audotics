#!/usr/bin/env node

/**
 * Audotics HTML Test Report Generator
 * 
 * This script converts JSON test reports to HTML format.
 * Usage: node html-report-generator.js path/to/json/report.json
 */

const fs = require('fs');
const path = require('path');
const { marked } = require('marked');

// Check if a report file was provided
const args = process.argv.slice(2);
if (args.length === 0) {
  console.error('Error: No report file specified');
  console.log('Usage: node html-report-generator.js path/to/json/report.json');
  process.exit(1);
}

// Read the report file
const reportFile = args[0];
if (!fs.existsSync(reportFile)) {
  console.error(`Error: Report file not found: ${reportFile}`);
  process.exit(1);
}

try {
  // Parse the JSON report
  const report = JSON.parse(fs.readFileSync(reportFile, 'utf8'));
  
  // Generate HTML
  const html = generateHtml(report);
  
  // Write HTML to file
  const htmlFile = reportFile.replace('.json', '.html');
  fs.writeFileSync(htmlFile, html);
  
  console.log(`HTML report generated: ${htmlFile}`);
} catch (error) {
  console.error('Error generating HTML report:', error.message);
  process.exit(1);
}

/**
 * Generates HTML from test report data
 * @param {Object} report - Test report data
 * @returns {string} - HTML content
 */
function generateHtml(report) {
  const timestamp = new Date(report.timestamp).toLocaleString();
  const category = report.category === 'all' ? 'All Tests' : report.category;
  const { results, environment } = report;
  
  // Calculate pass percentage
  const passPercentage = results.total > 0 
    ? Math.round((results.passed / results.total) * 100) 
    : 0;
  
  // Determine status color
  const statusColor = results.failed > 0 ? 'red' : 'green';
  const statusText = results.failed > 0 ? 'FAILED' : 'PASSED';
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Audotics Test Report - ${category}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }
    header {
      background-color: #2c3e50;
      color: white;
      padding: 20px;
      border-radius: 5px;
      margin-bottom: 20px;
    }
    h1, h2, h3 {
      margin-top: 0;
    }
    .summary {
      display: flex;
      justify-content: space-between;
      background-color: #f8f9fa;
      padding: 20px;
      border-radius: 5px;
      margin-bottom: 20px;
    }
    .status {
      text-align: center;
      padding: 15px;
      border-radius: 5px;
      background-color: ${statusColor === 'green' ? '#d4edda' : '#f8d7da'};
      color: ${statusColor === 'green' ? '#155724' : '#721c24'};
      font-weight: bold;
      font-size: 1.2em;
    }
    .stats {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
    }
    .stat-box {
      flex: 1;
      min-width: 150px;
      padding: 15px;
      border-radius: 5px;
      text-align: center;
    }
    .total {
      background-color: #e9ecef;
      color: #495057;
    }
    .passed {
      background-color: #d4edda;
      color: #155724;
    }
    .failed {
      background-color: #f8d7da;
      color: #721c24;
    }
    .pass-rate {
      background-color: #cce5ff;
      color: #004085;
    }
    .environment {
      background-color: #f8f9fa;
      padding: 20px;
      border-radius: 5px;
      margin-bottom: 20px;
    }
    .environment h2 {
      margin-top: 0;
      border-bottom: 1px solid #dee2e6;
      padding-bottom: 10px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    th, td {
      padding: 12px 15px;
      text-align: left;
      border-bottom: 1px solid #dee2e6;
    }
    th {
      background-color: #f8f9fa;
    }
    tr:hover {
      background-color: #f8f9fa;
    }
    .footer {
      text-align: center;
      margin-top: 40px;
      color: #6c757d;
      font-size: 0.9em;
    }
    .category-name {
      text-transform: capitalize;
    }
    .progress-bar-container {
      width: 100%;
      height: 25px;
      background-color: #e9ecef;
      border-radius: 5px;
      margin: 20px 0;
      overflow: hidden;
    }
    .progress-bar {
      height: 100%;
      background-color: ${passPercentage === 100 ? '#28a745' : passPercentage >= 80 ? '#17a2b8' : passPercentage >= 60 ? '#ffc107' : '#dc3545'};
      width: ${passPercentage}%;
      text-align: center;
      line-height: 25px;
      color: white;
      transition: width 1s ease-in-out;
    }
  </style>
</head>
<body>
  <header>
    <h1>Audotics Test Report</h1>
    <p>Generated on ${timestamp}</p>
  </header>

  <div class="summary">
    <div>
      <h2>Test Category: <span class="category-name">${category}</span></h2>
      <p>Test Environment: ${environment.testUrl}</p>
    </div>
    <div class="status">
      ${statusText}
    </div>
  </div>

  <div class="stats">
    <div class="stat-box total">
      <h3>Total Tests</h3>
      <p>${results.total}</p>
    </div>
    <div class="stat-box passed">
      <h3>Passed</h3>
      <p>${results.passed}</p>
    </div>
    <div class="stat-box failed">
      <h3>Failed</h3>
      <p>${results.failed}</p>
    </div>
    <div class="stat-box pass-rate">
      <h3>Pass Rate</h3>
      <p>${passPercentage}%</p>
    </div>
  </div>

  <div class="progress-bar-container">
    <div class="progress-bar" style="width: ${passPercentage}%">${passPercentage}%</div>
  </div>

  <div class="environment">
    <h2>Test Environment</h2>
    <table>
      <tr>
        <th>Node Version</th>
        <td>${environment.nodeVersion}</td>
      </tr>
      <tr>
        <th>Platform</th>
        <td>${environment.platform}</td>
      </tr>
      <tr>
        <th>Test URL</th>
        <td>${environment.testUrl}</td>
      </tr>
      <tr>
        <th>Headless Mode</th>
        <td>${environment.headless ? 'Yes' : 'No'}</td>
      </tr>
    </table>
  </div>

  <div class="test-details">
    <h2>Test Details</h2>
    <p>This report includes the results of automated tests for the Audotics application. The tests were executed using the Automated Test Runner.</p>
    
    <h3>Test Categories</h3>
    <p>The test runner supports the following test categories:</p>
    <ul>
      <li><strong>auth</strong>: Authentication tests</li>
      <li><strong>group</strong>: Group session tests</li>
      <li><strong>ml</strong>: ML recommendation tests</li>
      <li><strong>search</strong>: Search functionality tests</li>
      <li><strong>playlist</strong>: Playlist management tests</li>
      <li><strong>spotify</strong>: Spotify integration tests</li>
    </ul>
    
    <h3>Next Steps</h3>
    ${results.failed > 0 
      ? `<p>There are ${results.failed} failed tests that need attention. Please refer to the test logs for more details on the failures.</p>` 
      : `<p>All tests have passed successfully. The application is ready for the next phase of testing.</p>`
    }
  </div>

  <div class="footer">
    <p>Audotics Testing Framework - Generated by HTML Report Generator</p>
  </div>
</body>
</html>
  `;
}

// Allow this script to be imported by other modules
module.exports = {
  generateHtml
}; 