#!/usr/bin/env node

/**
 * Audotics Automated Test Runner
 * 
 * This script executes automated tests for the Audotics application.
 * Usage: node run-automated-tests.js [test-category]
 * 
 * Available test categories:
 * - auth: Authentication tests
 * - group: Group session tests
 * - ml: ML recommendation tests
 * - search: Search functionality tests
 * - playlist: Playlist management tests
 * - spotify: Spotify integration tests
 * - all: Run all tests
 */

const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');
const { createLogger, format, transports } = require('winston');
const chalk = require('chalk');

// Configure logger
const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp(),
    format.printf(({ level, message, timestamp }) => {
      return `${timestamp} ${level.toUpperCase()}: ${message}`;
    })
  ),
  transports: [
    new transports.Console(),
    new transports.File({ filename: path.join(__dirname, 'logs', 'automated-tests.log') })
  ]
});

// Ensure logs directory exists
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Test categories and their corresponding files
const testCategories = {
  auth: {
    name: 'Authentication Tests',
    files: ['automated-tests/auth-tests.js']
  },
  group: {
    name: 'Group Session Tests',
    files: ['automated-tests/group-session-tests.js']
  },
  ml: {
    name: 'ML Recommendation Tests',
    files: ['automated-tests/ml-recommendation-tests.js']
  },
  search: {
    name: 'Search Functionality Tests',
    files: ['automated-tests/search-tests.js']
  },
  playlist: {
    name: 'Playlist Management Tests',
    files: ['automated-tests/playlist-tests.js']
  },
  spotify: {
    name: 'Spotify Integration Tests',
    files: ['automated-tests/spotify-integration-tests.js']
  }
};

// Parse command line arguments
const args = process.argv.slice(2);
const testCategory = args[0] || 'all';
const headless = args.includes('--headless') || !args.includes('--no-headless');
const verbose = args.includes('--verbose');

// Set environment variables
process.env.HEADLESS = headless.toString();
process.env.TEST_URL = process.env.TEST_URL || 'https://test.audotics.com';
process.env.NODE_ENV = 'test';

/**
 * Runs a specific test file
 * @param {string} testFile - Path to test file
 * @returns {boolean} - Whether the test passed
 */
function runTestFile(testFile) {
  const fullPath = path.join(__dirname, testFile);
  
  // Check if file exists
  if (!fs.existsSync(fullPath)) {
    logger.warn(`Test file does not exist: ${fullPath}`);
    console.log(chalk.yellow(`⚠️ Warning: Test file not found: ${testFile}`));
    return false;
  }
  
  logger.info(`Running test file: ${testFile}`);
  console.log(chalk.cyan(`\n📋 Running: ${testFile}\n`));
  
  try {
    // Execute the test using Mocha
    const mochaCommand = `npx mocha "${fullPath}" --timeout 60000 ${verbose ? '--reporter spec' : '--reporter dot'}`;
    execSync(mochaCommand, { stdio: 'inherit' });
    
    logger.info(`Successfully completed test file: ${testFile}`);
    console.log(chalk.green(`✅ Passed: ${testFile}\n`));
    return true;
  } catch (error) {
    logger.error(`Test failed: ${testFile}`, error);
    console.log(chalk.red(`❌ Failed: ${testFile}`));
    console.log(chalk.red(`   Error: ${error.message}\n`));
    return false;
  }
}

/**
 * Runs all tests for a specific category
 * @param {string} category - Test category
 * @returns {Object} - Test results
 */
function runTestCategory(category) {
  if (category === 'all') {
    return runAllTests();
  }
  
  const categoryConfig = testCategories[category];
  if (!categoryConfig) {
    logger.error(`Invalid test category: ${category}`);
    console.log(chalk.red(`❌ Error: Invalid test category: ${category}`));
    console.log(chalk.cyan(`   Available categories: ${Object.keys(testCategories).join(', ')}, all`));
    return { total: 0, passed: 0, failed: 0 };
  }
  
  console.log(chalk.blue(`\n🔍 Running ${categoryConfig.name}...\n`));
  logger.info(`Starting test category: ${category}`);
  
  const results = {
    total: categoryConfig.files.length,
    passed: 0,
    failed: 0
  };
  
  for (const file of categoryConfig.files) {
    const passed = runTestFile(file);
    passed ? results.passed++ : results.failed++;
  }
  
  return results;
}

/**
 * Runs all available tests
 * @returns {Object} - Test results
 */
function runAllTests() {
  logger.info('Starting all tests');
  console.log(chalk.blue('\n🔍 Running All Tests...\n'));
  
  const results = {
    total: 0,
    passed: 0,
    failed: 0
  };
  
  for (const category in testCategories) {
    const categoryConfig = testCategories[category];
    
    console.log(chalk.blue(`\n📁 Category: ${categoryConfig.name}\n`));
    
    for (const file of categoryConfig.files) {
      results.total++;
      const passed = runTestFile(file);
      passed ? results.passed++ : results.failed++;
    }
  }
  
  return results;
}

/**
 * Display test result summary
 * @param {Object} results - Test results
 */
function displaySummary(results) {
  console.log(chalk.blue('\n📊 Test Results Summary:'));
  console.log(chalk.blue('====================================='));
  console.log(chalk.white(`Total Tests: ${results.total}`));
  console.log(chalk.green(`Passed: ${results.passed}`));
  console.log(chalk.red(`Failed: ${results.failed}`));
  console.log(chalk.blue('====================================='));
  
  const percentage = results.total > 0 
    ? Math.round((results.passed / results.total) * 100) 
    : 0;
  
  console.log(chalk.white(`Pass Rate: ${percentage}%`));
  
  if (results.failed > 0) {
    console.log(chalk.yellow('\n⚠️ Some tests failed. Check the logs for details.'));
    logger.warn(`Test run completed with ${results.failed} failures`);
  } else if (results.passed > 0) {
    console.log(chalk.green('\n✅ All tests passed!'));
    logger.info('Test run completed successfully');
  } else {
    console.log(chalk.yellow('\n⚠️ No tests were executed.'));
    logger.warn('Test run completed but no tests were executed');
  }
}

/**
 * Generate a report file with test results
 * @param {Object} results - Test results
 * @param {string} category - Test category
 */
function generateReport(results, category) {
  const reportsDir = path.join(__dirname, 'reports');
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }
  
  const timestamp = new Date().toISOString().replace(/:/g, '-');
  const reportPath = path.join(
    reportsDir, 
    `automated-test-report-${category}-${timestamp}.json`
  );
  
  const report = {
    timestamp: new Date().toISOString(),
    category,
    results,
    environment: {
      nodeVersion: process.version,
      platform: process.platform,
      testUrl: process.env.TEST_URL,
      headless: headless
    }
  };
  
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  logger.info(`Test report generated: ${reportPath}`);
  console.log(chalk.blue(`\n📝 Report saved to: ${reportPath}`));
  
  // Also generate an HTML report if the html-report-generator.js exists
  const htmlGeneratorPath = path.join(__dirname, 'html-report-generator.js');
  if (fs.existsSync(htmlGeneratorPath)) {
    try {
      const htmlCommand = `node "${htmlGeneratorPath}" "${reportPath}"`;
      execSync(htmlCommand);
      const htmlPath = reportPath.replace('.json', '.html');
      logger.info(`HTML report generated: ${htmlPath}`);
      console.log(chalk.blue(`📝 HTML Report saved to: ${htmlPath}`));
    } catch (error) {
      logger.error('Failed to generate HTML report', error);
      console.log(chalk.yellow('⚠️ Failed to generate HTML report'));
    }
  }
}

/**
 * Main function to run tests
 */
function main() {
  console.log(chalk.blue('🚀 Audotics Automated Test Runner'));
  console.log(chalk.blue('====================================='));
  console.log(chalk.white(`Test Category: ${testCategory === 'all' ? 'All Tests' : testCategories[testCategory]?.name || 'Invalid'}`));
  console.log(chalk.white(`Headless Mode: ${headless ? 'Yes' : 'No'}`));
  console.log(chalk.white(`Test Environment: ${process.env.TEST_URL}`));
  console.log(chalk.blue('=====================================\n'));
  
  const startTime = Date.now();
  
  // Run the specified tests
  const results = runTestCategory(testCategory);
  
  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);
  
  // Display results
  displaySummary(results);
  console.log(chalk.blue(`\n⏱️ Total execution time: ${duration} seconds\n`));
  
  // Generate report
  generateReport(results, testCategory);
  
  // Exit with appropriate code
  process.exit(results.failed > 0 ? 1 : 0);
}

// Run the script
main(); 