/**
 * Audotics ML Recommendation Tests
 * 
 * This script provides automated tests for the ML recommendation functionality
 * based on the REC-001 test script.
 */

const puppeteer = require('puppeteer');
const { expect } = require('chai');
const { testUtils } = require('../test-utils');
const fs = require('fs');
const path = require('path');

// Test configuration
const config = {
  baseUrl: process.env.TEST_URL || 'https://test.audotics.com',
  rockUser: {
    email: 'rockfan@audotics.com',
    password: 'Test123!'
  },
  popUser: {
    email: 'popfan@audotics.com',
    password: 'Test123!'
  },
  mixedUser: {
    email: 'mixedfan@audotics.com',
    password: 'Test123!'
  },
  timeouts: {
    navigation: 15000,
    element: 5000,
    animation: 1000,
    recommendation: 10000
  },
  reportDir: path.join(__dirname, '..', 'reports', 'ml-tests')
};

// Ensure reports directory exists
if (!fs.existsSync(config.reportDir)) {
  fs.mkdirSync(config.reportDir, { recursive: true });
}

describe('ML Recommendation Tests (REC-001)', () => {
  let browser;
  let page;
  
  before(async () => {
    console.log('Starting ML Recommendation Tests...');
    browser = await puppeteer.launch({
      headless: process.env.HEADLESS !== 'false',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      defaultViewport: { width: 1280, height: 800 }
    });
  });
  
  after(async () => {
    await browser.close();
    console.log('ML Recommendation Tests completed.');
  });
  
  beforeEach(async () => {
    page = await browser.newPage();
    await page.setDefaultNavigationTimeout(config.timeouts.navigation);
    await testUtils.clearCookiesAndLocalStorage(page);
    
    // Enable request interception for logging recommendation requests
    await page.setRequestInterception(true);
    page.on('request', request => {
      if (request.url().includes('/recommend') || request.url().includes('/api/ml')) {
        console.log(`ML Request: ${request.method()} ${request.url()}`);
      }
      request.continue();
    });
  });
  
  afterEach(async () => {
    if (page) await page.close();
  });
  
  // Helper function to login a user
  async function loginUser(user) {
    await page.goto(`${config.baseUrl}/login`, { waitUntil: 'networkidle0' });
    await page.type('input[type="email"], input[name="email"]', user.email);
    await page.type('input[type="password"], input[name="password"]', user.password);
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle0' });
    
    // Verify we're logged in
    const currentUrl = page.url();
    expect(currentUrl).to.include('dashboard');
  }
  
  // Helper function to get track names from recommendation section
  async function getRecommendedTracks() {
    return page.evaluate(() => {
      const trackElements = document.querySelectorAll('.recommendation-item, .track-item, [data-testid^="recommendation-"]');
      return Array.from(trackElements).map(el => {
        // Extract track name
        const trackName = el.querySelector('.track-name, .track-title')?.textContent || '';
        // Extract artist name if available
        const artistName = el.querySelector('.artist-name, .track-artist')?.textContent || '';
        // Extract genre if available
        const genre = el.querySelector('.genre, .track-genre')?.textContent || '';
        
        return {
          trackName: trackName.trim(),
          artistName: artistName.trim(),
          genre: genre.trim(),
          fullText: el.textContent.trim()
        };
      });
    });
  }
  
  // Helper function to check for genre bias in tracks
  function checkGenreBias(tracks, targetGenres) {
    // Count tracks by genre
    const genreCounts = {};
    
    tracks.forEach(track => {
      // First try to use explicit genre
      if (track.genre) {
        const genre = track.genre.toLowerCase();
        genreCounts[genre] = (genreCounts[genre] || 0) + 1;
      } else {
        // If no explicit genre, try to infer from track/artist name or full text
        for (const genre of targetGenres) {
          const genreLower = genre.toLowerCase();
          const fullTextLower = track.fullText.toLowerCase();
          
          if (fullTextLower.includes(genreLower)) {
            genreCounts[genreLower] = (genreCounts[genreLower] || 0) + 1;
            break;
          }
        }
      }
    });
    
    // Check for bias
    const totalTracks = tracks.length;
    const biasResults = {};
    
    for (const genre of targetGenres) {
      const genreLower = genre.toLowerCase();
      const count = genreCounts[genreLower] || 0;
      const percentage = totalTracks > 0 ? (count / totalTracks) * 100 : 0;
      biasResults[genre] = {
        count,
        percentage,
        hasBias: percentage >= 50 // Consider it biased if more than 50% of tracks match
      };
    }
    
    return biasResults;
  }
  
  // Helper function to capture recommendation results
  async function captureRecommendationResults(userType, tracks, biasResults) {
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const resultPath = path.join(config.reportDir, `${userType}-recommendations-${timestamp}.json`);
    
    const results = {
      timestamp,
      userType,
      tracks,
      genreAnalysis: biasResults,
      summary: {
        totalTracks: tracks.length,
        uniqueArtists: new Set(tracks.map(t => t.artistName.toLowerCase())).size,
        recommendationTime: page.metrics ? (await page.metrics()).TaskDuration : 'N/A'
      }
    };
    
    fs.writeFileSync(resultPath, JSON.stringify(results, null, 2));
    console.log(`Saved recommendation results to: ${resultPath}`);
    
    return resultPath;
  }
  
  describe('Personalized Recommendations', () => {
    it('should provide rock-biased recommendations for rock user', async () => {
      await loginUser(config.rockUser);
      
      // Navigate to recommendations page
      await page.goto(`${config.baseUrl}/recommendations`, { waitUntil: 'networkidle0' });
      
      // Wait for recommendations to load
      await page.waitForSelector('.recommendation-item, .track-item, [data-testid^="recommendation-"]', {
        timeout: config.timeouts.recommendation
      });
      
      // Get recommended tracks
      const tracks = await getRecommendedTracks();
      expect(tracks.length).to.be.at.least(5, 'Should have at least 5 recommendations');
      
      // Check for rock bias
      const biasResults = checkGenreBias(tracks, ['rock', 'metal', 'alternative', 'punk']);
      
      // Save results
      await captureRecommendationResults('rock', tracks, biasResults);
      
      // Check if there's a rock bias
      const rockBias = biasResults['rock'] || { hasBias: false, percentage: 0 };
      expect(rockBias.hasBias || rockBias.percentage >= 30).to.be.true;
    });
    
    it('should provide pop-biased recommendations for pop user', async () => {
      await loginUser(config.popUser);
      
      // Navigate to recommendations page
      await page.goto(`${config.baseUrl}/recommendations`, { waitUntil: 'networkidle0' });
      
      // Wait for recommendations to load
      await page.waitForSelector('.recommendation-item, .track-item, [data-testid^="recommendation-"]', {
        timeout: config.timeouts.recommendation
      });
      
      // Get recommended tracks
      const tracks = await getRecommendedTracks();
      expect(tracks.length).to.be.at.least(5, 'Should have at least 5 recommendations');
      
      // Check for pop bias
      const biasResults = checkGenreBias(tracks, ['pop', 'dance', 'electronic', 'r&b']);
      
      // Save results
      await captureRecommendationResults('pop', tracks, biasResults);
      
      // Check if there's a pop bias
      const popBias = biasResults['pop'] || { hasBias: false, percentage: 0 };
      expect(popBias.hasBias || popBias.percentage >= 30).to.be.true;
    });
    
    it('should provide diverse recommendations for mixed-preference user', async () => {
      await loginUser(config.mixedUser);
      
      // Navigate to recommendations page
      await page.goto(`${config.baseUrl}/recommendations`, { waitUntil: 'networkidle0' });
      
      // Wait for recommendations to load
      await page.waitForSelector('.recommendation-item, .track-item, [data-testid^="recommendation-"]', {
        timeout: config.timeouts.recommendation
      });
      
      // Get recommended tracks
      const tracks = await getRecommendedTracks();
      expect(tracks.length).to.be.at.least(5, 'Should have at least 5 recommendations');
      
      // Check for diverse genres
      const biasResults = checkGenreBias(tracks, ['rock', 'pop', 'hip hop', 'electronic']);
      
      // Save results
      await captureRecommendationResults('mixed', tracks, biasResults);
      
      // For mixed user, no single genre should dominate too much
      const genrePercentages = Object.values(biasResults).map(b => b.percentage || 0);
      const maxPercentage = Math.max(...genrePercentages);
      
      // No genre should have more than 60% of recommendations for a mixed-preference user
      expect(maxPercentage).to.be.lessThan(60);
    });
  });
  
  describe('Group Recommendations', () => {
    it('should provide balanced recommendations for a mixed group', async () => {
      // First login as the host (rock user)
      await loginUser(config.rockUser);
      
      // Create a new session
      await page.goto(`${config.baseUrl}/dashboard`, { waitUntil: 'networkidle0' });
      await testUtils.clickElement(page, 'a:has-text("Create Session"), button:has-text("Create Session")');
      
      // Fill in session details
      await page.waitForSelector('form, .session-form, [data-testid="create-session-form"]');
      await page.type('input[name="sessionName"], input[placeholder="Session Name"]', 'ML Test Session');
      
      // Select privacy options if available
      const privacySelector = await page.$('select[name="privacy"], [data-testid="privacy-selector"]');
      if (privacySelector) {
        await page.select('select[name="privacy"], [data-testid="privacy-selector"]', 'private');
      }
      
      // Submit form
      await page.click('button[type="submit"], button:has-text("Create")');
      
      // Wait for redirection to session page
      await page.waitForNavigation({ waitUntil: 'networkidle0' });
      
      // Get session code for later (simulation)
      const sessionCode = await page.evaluate(() => {
        const codeElement = document.querySelector('.session-code, [data-testid="session-code"]');
        if (codeElement) return codeElement.textContent.trim();
        
        const sessionUrl = window.location.href;
        const match = sessionUrl.match(/session\/([A-Z0-9]+)/i);
        return match ? match[1] : null;
      });
      
      expect(sessionCode).to.not.be.null;
      
      // Simulate other members joining (we won't actually create separate browsers here)
      // In a real test, we would launch separate browsers and have the members join
      
      // Simulate requesting recommendations for the group
      await testUtils.clickElement(page, 'button:has-text("Get Recommendations"), [data-testid="get-recommendations"]');
      
      // Wait for group recommendations to load
      await page.waitForSelector('.recommendation-item, .track-item, [data-testid^="recommendation-"]', {
        timeout: config.timeouts.recommendation
      });
      
      // Get recommended tracks
      const tracks = await getRecommendedTracks();
      expect(tracks.length).to.be.at.least(5, 'Should have at least 5 group recommendations');
      
      // Check for genre distribution
      const biasResults = checkGenreBias(
        tracks, 
        ['rock', 'pop', 'hip hop', 'electronic', 'alternative', 'indie']
      );
      
      // Save results
      await captureRecommendationResults('group', tracks, biasResults);
      
      // For group recommendations, expect some diversity
      const rockBias = biasResults['rock'] || { percentage: 0 };
      const popBias = biasResults['pop'] || { percentage: 0 };
      
      // Neither rock nor pop should completely dominate in a mixed group
      expect(rockBias.percentage).to.be.lessThan(70);
      expect(popBias.percentage).to.be.lessThan(70);
    });
  });
  
  describe('ML Performance Metrics', () => {
    it('should respond with recommendations within acceptable time limits', async () => {
      await loginUser(config.mixedUser);
      
      // Start performance measurement
      const startTime = Date.now();
      
      // Navigate to recommendations page
      await page.goto(`${config.baseUrl}/recommendations`, { waitUntil: 'networkidle0' });
      
      // Wait for the first recommendation to appear
      await page.waitForSelector('.recommendation-item, .track-item, [data-testid^="recommendation-"]', {
        timeout: config.timeouts.recommendation
      });
      
      // Calculate response time
      const responseTime = Date.now() - startTime;
      console.log(`Recommendation response time: ${responseTime}ms`);
      
      // Check if recommendations loaded within acceptable time
      // This may need adjustment based on the actual system performance
      expect(responseTime).to.be.at.most(5000);
      
      // Verify recommendations are fully loaded
      const tracks = await getRecommendedTracks();
      expect(tracks.length).to.be.at.least(5);
      
      // Save performance metrics
      const timestamp = new Date().toISOString().replace(/:/g, '-');
      const perfPath = path.join(config.reportDir, `performance-metrics-${timestamp}.json`);
      
      const perfMetrics = {
        timestamp,
        responseTime,
        trackCount: tracks.length,
        pageMetrics: await page.metrics()
      };
      
      fs.writeFileSync(perfPath, JSON.stringify(perfMetrics, null, 2));
    });
  });
  
  describe('Recommendation Diversity', () => {
    it('should provide recommendations from different artists', async () => {
      await loginUser(config.mixedUser);
      
      // Navigate to recommendations page
      await page.goto(`${config.baseUrl}/recommendations`, { waitUntil: 'networkidle0' });
      
      // Wait for recommendations to load
      await page.waitForSelector('.recommendation-item, .track-item, [data-testid^="recommendation-"]', {
        timeout: config.timeouts.recommendation
      });
      
      // Get recommended tracks
      const tracks = await getRecommendedTracks();
      expect(tracks.length).to.be.at.least(5);
      
      // Check artist diversity
      const artists = tracks.map(track => track.artistName.toLowerCase()).filter(Boolean);
      const uniqueArtists = new Set(artists);
      
      // Expect at least 3 different artists in recommendations
      expect(uniqueArtists.size).to.be.at.least(3);
      
      // No single artist should dominate recommendations
      const artistCounts = {};
      artists.forEach(artist => {
        artistCounts[artist] = (artistCounts[artist] || 0) + 1;
      });
      
      const maxArtistCount = Math.max(...Object.values(artistCounts));
      const totalTracks = tracks.length;
      
      // No artist should account for more than 40% of recommendations
      expect(maxArtistCount / totalTracks).to.be.lessThan(0.4);
    });
  });
});

module.exports = {
  runMLRecommendationTests: () => {
    describe('ML Recommendation Tests', () => {
      // Tests will be run by the test runner
    });
  }
}; 