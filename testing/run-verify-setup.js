#!/usr/bin/env node

/**
 * Audotics Test Environment Verification
 * 
 * This script verifies that all dependencies and tools required
 * for the Audotics testing framework are correctly set up.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const chalk = require('chalk');

// Track verification results
const results = {
  passed: [],
  failed: [],
  warnings: []
};

// Print header
console.log(chalk.blue('='.repeat(60)));
console.log(chalk.blue('Audotics Testing Environment Verification'));
console.log(chalk.blue('='.repeat(60)));
console.log();

// Verify Node.js version
try {
  const nodeVersion = process.version;
  const versionMatch = nodeVersion.match(/v(\d+)\.\d+\.\d+/);
  
  if (versionMatch && parseInt(versionMatch[1]) >= 16) {
    console.log(chalk.green('✓ Node.js version OK:'), chalk.white(nodeVersion));
    results.passed.push('Node.js version');
  } else {
    console.log(chalk.red('✗ Node.js version too old:'), chalk.white(nodeVersion));
    console.log(chalk.yellow('  Required: v16.0.0 or newer'));
    results.failed.push('Node.js version');
  }
} catch (error) {
  console.log(chalk.red('✗ Could not verify Node.js version'));
  results.failed.push('Node.js version check');
}

console.log();

// Verify npm version
try {
  const npmVersion = execSync('npm --version').toString().trim();
  const versionParts = npmVersion.split('.');
  
  if (versionParts.length > 0 && parseInt(versionParts[0]) >= 7) {
    console.log(chalk.green('✓ npm version OK:'), chalk.white(npmVersion));
    results.passed.push('npm version');
  } else {
    console.log(chalk.red('✗ npm version too old:'), chalk.white(npmVersion));
    console.log(chalk.yellow('  Required: 7.0.0 or newer'));
    results.failed.push('npm version');
  }
} catch (error) {
  console.log(chalk.red('✗ Could not verify npm version'));
  results.failed.push('npm version check');
}

console.log();

// Verify required directories exist
const requiredDirs = [
  path.join(__dirname, 'automated-tests'),
  path.join(__dirname, 'reports'),
  path.join(__dirname, 'logs')
];

for (const dir of requiredDirs) {
  if (!fs.existsSync(dir)) {
    console.log(chalk.yellow(`! Creating missing directory: ${path.relative(__dirname, dir)}`));
    fs.mkdirSync(dir, { recursive: true });
    results.warnings.push(`Created missing directory: ${path.relative(__dirname, dir)}`);
  } else {
    console.log(chalk.green(`✓ Directory exists: ${path.relative(__dirname, dir)}`));
    results.passed.push(`Directory check: ${path.relative(__dirname, dir)}`);
  }
}

console.log();

// Verify required dependencies are installed
const requiredDependencies = [
  'puppeteer',
  'chai',
  'mocha',
  'winston',
  'chalk',
  'marked',
  'open',
  'axios'
];

for (const dep of requiredDependencies) {
  try {
    require.resolve(dep);
    console.log(chalk.green(`✓ Dependency installed: ${dep}`));
    results.passed.push(`Dependency check: ${dep}`);
  } catch (error) {
    console.log(chalk.red(`✗ Missing dependency: ${dep}`));
    results.failed.push(`Dependency check: ${dep}`);
  }
}

console.log();

// Verify test scripts exist
const testScripts = [
  { name: 'Authentication Tests', path: path.join(__dirname, 'automated-tests', 'auth-tests.js') },
  { name: 'Group Session Tests', path: path.join(__dirname, 'automated-tests', 'group-session-tests.js') },
  { name: 'ML Recommendation Tests', path: path.join(__dirname, 'automated-tests', 'ml-recommendation-tests.js') }
];

for (const script of testScripts) {
  if (fs.existsSync(script.path)) {
    console.log(chalk.green(`✓ Test script found: ${script.name}`));
    results.passed.push(`Test script check: ${script.name}`);
  } else {
    console.log(chalk.yellow(`! Test script not found: ${script.name}`));
    console.log(chalk.yellow(`  Expected at: ${path.relative(__dirname, script.path)}`));
    results.warnings.push(`Missing test script: ${script.name}`);
  }
}

console.log();

// Verify environment configuration
const envVars = {
  'TEST_URL': process.env.TEST_URL || 'https://test.audotics.com',
  'NODE_ENV': process.env.NODE_ENV || 'Not set (will default to test)',
  'HEADLESS': process.env.HEADLESS || 'Not set (will default to true)'
};

console.log(chalk.blue('Environment Configuration:'));
for (const [key, value] of Object.entries(envVars)) {
  console.log(`${key}: ${value}`);
}

console.log();

// Verify Puppeteer installation
try {
  // Try to require Puppeteer browser
  const puppeteer = require('puppeteer');
  console.log(chalk.green('✓ Puppeteer correctly installed'));
  results.passed.push('Puppeteer installation');
  
  // Check if we can launch a browser
  console.log(chalk.blue('Testing browser launch...'));
  
  (async () => {
    let browser;
    try {
      browser = await puppeteer.launch({ 
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'] 
      });
      console.log(chalk.green('✓ Successfully launched test browser'));
      results.passed.push('Browser launch test');
      
      // Display browser version
      const version = await browser.version();
      console.log(chalk.white(`  Browser version: ${version}`));
      
      // Close the browser
      await browser.close();
    } catch (error) {
      console.log(chalk.red('✗ Failed to launch test browser'));
      console.log(chalk.red(`  Error: ${error.message}`));
      results.failed.push('Browser launch test');
    } finally {
      if (browser) {
        try {
          await browser.close();
        } catch (e) {
          // Ignore errors on close
        }
      }
      
      // Print summary
      summarizeResults();
    }
  })();
} catch (error) {
  console.log(chalk.red('✗ Puppeteer not correctly installed'));
  console.log(chalk.red(`  Error: ${error.message}`));
  results.failed.push('Puppeteer installation');
  
  // Print summary
  summarizeResults();
}

function summarizeResults() {
  console.log();
  console.log(chalk.blue('='.repeat(60)));
  console.log(chalk.blue('Verification Summary'));
  console.log(chalk.blue('='.repeat(60)));
  console.log();
  
  console.log(chalk.green(`Checks passed: ${results.passed.length}`));
  console.log(chalk.red(`Checks failed: ${results.failed.length}`));
  console.log(chalk.yellow(`Warnings: ${results.warnings.length}`));
  
  if (results.failed.length > 0) {
    console.log();
    console.log(chalk.red('Failed checks:'));
    results.failed.forEach(item => console.log(chalk.red(`  - ${item}`)));
  }
  
  if (results.warnings.length > 0) {
    console.log();
    console.log(chalk.yellow('Warnings:'));
    results.warnings.forEach(item => console.log(chalk.yellow(`  - ${item}`)));
  }
  
  console.log();
  
  if (results.failed.length === 0) {
    console.log(chalk.green('✓ Environment verification completed successfully'));
    console.log(chalk.green('  You can now run the test suite with: npm run test:all'));
  } else {
    console.log(chalk.red('✗ Environment verification found issues that need to be resolved'));
    console.log(chalk.yellow('  Please fix the failed checks and run verification again'));
  }
  
  console.log();
} 