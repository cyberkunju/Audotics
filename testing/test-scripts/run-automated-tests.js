/**
 * Audotics Automated Test Runner
 * 
 * This script uses Puppeteer to automate browser-based testing for key features:
 * - WebSocket real-time updates
 * - Recommendation display and search
 * - Playlist export to Spotify
 * 
 * To run: node run-automated-tests.js
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Load test utilities
const testUtils = require('../test-utils');

// Configuration
const config = {
  baseUrl: 'https://app.audotics.com', // Replace with your development/test environment URL
  testUsers: {
    user1: { username: 'test_user1', password: 'TestPass123!' },
    user2: { username: 'test_user2', password: 'TestPass123!' },
    user3: { username: 'test_user3', password: 'TestPass123!' }
  },
  testSession: 'SESSION001',
  headless: false, // Set to true for headless testing
  slowMo: 50, // Slow down operations for better visibility
  screenshotDir: path.join(__dirname, '../screenshots'),
  reportDir: path.join(__dirname, '../reports')
};

// Ensure directories exist
if (!fs.existsSync(config.screenshotDir)) {
  fs.mkdirSync(config.screenshotDir, { recursive: true });
}

if (!fs.existsSync(config.reportDir)) {
  fs.mkdirSync(config.reportDir, { recursive: true });
}

// Test results tracker
const testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  skipped: 0,
  results: []
};

// Helper functions
async function takeScreenshot(page, name) {
  const screenshotPath = path.join(config.screenshotDir, `${name}-${Date.now()}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: true });
  return screenshotPath;
}

async function logResult(name, passed, error = null, screenshot = null) {
  testResults.total++;
  if (passed) {
    testResults.passed++;
    console.log(`✅ PASSED: ${name}`);
  } else {
    testResults.failed++;
    console.error(`❌ FAILED: ${name}${error ? ` - ${error.message}` : ''}`);
    if (error) {
      console.error(error);
    }
  }
  
  testResults.results.push({
    name,
    passed,
    error: error ? error.message : null,
    screenshot,
    timestamp: new Date().toISOString()
  });
}

async function generateReport() {
  const reportPath = path.join(config.reportDir, `test-report-${Date.now()}.json`);
  const htmlReportPath = path.join(config.reportDir, `test-report-${Date.now()}.html`);
  
  // Save JSON report
  fs.writeFileSync(reportPath, JSON.stringify(testResults, null, 2));
  
  // Generate HTML report
  const htmlReport = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Audotics Test Report</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        h1 { color: #333; }
        .summary { display: flex; margin-bottom: 20px; }
        .summary-item { margin-right: 20px; padding: 10px; border-radius: 5px; }
        .total { background-color: #f0f0f0; }
        .passed { background-color: #dff0d8; }
        .failed { background-color: #f2dede; }
        .skipped { background-color: #fcf8e3; }
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background-color: #f2f2f2; }
        .pass { color: green; }
        .fail { color: red; }
        .screenshot-link { color: blue; text-decoration: underline; cursor: pointer; }
      </style>
    </head>
    <body>
      <h1>Audotics Test Report</h1>
      <div class="summary">
        <div class="summary-item total">Total: ${testResults.total}</div>
        <div class="summary-item passed">Passed: ${testResults.passed}</div>
        <div class="summary-item failed">Failed: ${testResults.failed}</div>
        <div class="summary-item skipped">Skipped: ${testResults.skipped}</div>
      </div>
      <table>
        <tr>
          <th>Test</th>
          <th>Result</th>
          <th>Error</th>
          <th>Screenshot</th>
          <th>Timestamp</th>
        </tr>
        ${testResults.results.map(result => `
          <tr>
            <td>${result.name}</td>
            <td class="${result.passed ? 'pass' : 'fail'}">${result.passed ? 'PASS' : 'FAIL'}</td>
            <td>${result.error || ''}</td>
            <td>${result.screenshot ? `<a href="${result.screenshot}" target="_blank" class="screenshot-link">View</a>` : ''}</td>
            <td>${result.timestamp}</td>
          </tr>
        `).join('')}
      </table>
    </body>
    </html>
  `;
  
  fs.writeFileSync(htmlReportPath, htmlReport);
  
  console.log(`\nTest Summary:`);
  console.log(`Total: ${testResults.total}`);
  console.log(`Passed: ${testResults.passed}`);
  console.log(`Failed: ${testResults.failed}`);
  console.log(`Skipped: ${testResults.skipped}`);
  console.log(`\nReports saved to:`);
  console.log(` - JSON: ${reportPath}`);
  console.log(` - HTML: ${htmlReportPath}`);
}

// Test Cases
async function testWebSocketRealTimeUpdates(browser) {
  console.log('\n--- Testing WebSocket Real-time Updates ---');
  
  try {
    // Create two browser contexts for different users
    const userContext1 = await browser.createIncognitoBrowserContext();
    const userContext2 = await browser.createIncognitoBrowserContext();
    
    // Open pages for each user
    const user1Page = await userContext1.newPage();
    const user2Page = await userContext2.newPage();
    
    // Login each user
    await testUtils.login(user1Page, config.baseUrl, config.testUsers.user1.username, config.testUsers.user1.password);
    await logResult('User 1 Login', true, null, await takeScreenshot(user1Page, 'user1-login'));
    
    await testUtils.login(user2Page, config.baseUrl, config.testUsers.user2.username, config.testUsers.user2.password);
    await logResult('User 2 Login', true, null, await takeScreenshot(user2Page, 'user2-login'));
    
    // Both users join the same session
    await testUtils.joinSession(user1Page, config.testSession);
    await logResult('User 1 Join Session', true, null, await takeScreenshot(user1Page, 'user1-join-session'));
    
    await testUtils.joinSession(user2Page, config.testSession);
    await logResult('User 2 Join Session', true, null, await takeScreenshot(user2Page, 'user2-join-session'));
    
    // User 1 adds a track to the playlist
    const track1 = await testUtils.getFirstRecommendation(user1Page);
    await testUtils.addTrackToPlaylist(user1Page, track1);
    await logResult('User 1 Add Track', true, null, await takeScreenshot(user1Page, 'user1-add-track'));
    
    // Check if User 2 sees the track added by User 1
    await user2Page.waitForTimeout(2000); // Give time for WebSocket to propagate
    const user2SeesTrack = await testUtils.checkPlaylistForTrack(user2Page, track1);
    await logResult('User 2 Sees Track Added by User 1', user2SeesTrack, 
      user2SeesTrack ? null : new Error('Track not found in User 2 playlist'),
      await takeScreenshot(user2Page, 'user2-sees-track'));
    
    // User 2 adds a track to the playlist
    const track2 = await testUtils.getFirstRecommendation(user2Page);
    await testUtils.addTrackToPlaylist(user2Page, track2);
    await logResult('User 2 Add Track', true, null, await takeScreenshot(user2Page, 'user2-add-track'));
    
    // Check if User 1 sees the track added by User 2
    await user1Page.waitForTimeout(2000); // Give time for WebSocket to propagate
    const user1SeesTrack = await testUtils.checkPlaylistForTrack(user1Page, track2);
    await logResult('User 1 Sees Track Added by User 2', user1SeesTrack,
      user1SeesTrack ? null : new Error('Track not found in User 1 playlist'),
      await takeScreenshot(user1Page, 'user1-sees-track'));
    
    // Close user contexts
    await userContext1.close();
    await userContext2.close();
    
  } catch (error) {
    await logResult('WebSocket Real-time Updates', false, error);
  }
}

async function testRecommendationAndSearch(browser) {
  console.log('\n--- Testing Recommendation and Search ---');
  
  try {
    const page = await browser.newPage();
    
    // Login
    await testUtils.login(page, config.baseUrl, config.testUsers.user1.username, config.testUsers.user1.password);
    
    // Join session
    await testUtils.joinSession(page, config.testSession);
    
    // Check if recommendations are displayed
    const recommendationsVisible = await testUtils.areRecommendationsVisible(page);
    await logResult('Recommendations Display', recommendationsVisible, 
      recommendationsVisible ? null : new Error('Recommendations not visible'),
      await takeScreenshot(page, 'recommendations-display'));
    
    // Perform a search
    const searchQuery = 'rock';
    await testUtils.searchForTrack(page, searchQuery);
    
    // Check if search results are displayed
    const searchResultsVisible = await testUtils.areSearchResultsVisible(page);
    await logResult('Search Results Display', searchResultsVisible,
      searchResultsVisible ? null : new Error('Search results not visible'),
      await takeScreenshot(page, 'search-results'));
    
    // Preview a track
    await testUtils.previewTrack(page);
    
    // Check if preview player is visible
    const previewPlayerVisible = await testUtils.isPreviewPlayerVisible(page);
    await logResult('Preview Player Display', previewPlayerVisible,
      previewPlayerVisible ? null : new Error('Preview player not visible'),
      await takeScreenshot(page, 'preview-player'));
    
    // Clear search
    await testUtils.clearSearch(page);
    
    // Check if recommendations are displayed again
    const recommendationsVisibleAfterClear = await testUtils.areRecommendationsVisible(page);
    await logResult('Recommendations After Clear', recommendationsVisibleAfterClear,
      recommendationsVisibleAfterClear ? null : new Error('Recommendations not visible after clear'),
      await takeScreenshot(page, 'recommendations-after-clear'));
    
    await page.close();
    
  } catch (error) {
    await logResult('Recommendation and Search', false, error);
  }
}

async function testSpotifyExport(browser) {
  console.log('\n--- Testing Spotify Export ---');
  
  try {
    const page = await browser.newPage();
    
    // Login
    await testUtils.login(page, config.baseUrl, config.testUsers.user1.username, config.testUsers.user1.password);
    
    // Join session
    await testUtils.joinSession(page, config.testSession);
    
    // Ensure there are tracks in the playlist
    const hasTracksInPlaylist = await testUtils.hasTracksInPlaylist(page);
    
    if (!hasTracksInPlaylist) {
      // Add a track if playlist is empty
      const track = await testUtils.getFirstRecommendation(page);
      await testUtils.addTrackToPlaylist(page, track);
    }
    
    // Export to Spotify
    await testUtils.exportToSpotify(page);
    
    // Check if export confirmation is displayed
    const exportConfirmationVisible = await testUtils.isExportConfirmationVisible(page);
    await logResult('Export Confirmation Display', exportConfirmationVisible,
      exportConfirmationVisible ? null : new Error('Export confirmation not visible'),
      await takeScreenshot(page, 'export-confirmation'));
    
    // Note: We can't fully automate Spotify authentication in a test without a mock,
    // so we'll just check if the export process starts correctly
    
    await page.close();
    
  } catch (error) {
    await logResult('Spotify Export', false, error);
  }
}

// Main test runner
(async () => {
  let browser;
  
  try {
    console.log('Starting Audotics automated tests...');
    
    browser = await puppeteer.launch({
      headless: config.headless,
      slowMo: config.slowMo,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    // Run tests
    await testWebSocketRealTimeUpdates(browser);
    await testRecommendationAndSearch(browser);
    await testSpotifyExport(browser);
    
  } catch (error) {
    console.error('Test runner error:', error);
  } finally {
    // Generate test report
    await generateReport();
    
    // Close browser
    if (browser) {
      await browser.close();
    }
    
    console.log('Automated tests completed.');
  }
})(); 