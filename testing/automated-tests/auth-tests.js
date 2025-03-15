/**
 * Audotics Authentication Tests
 * 
 * This script provides automated tests for the authentication functionality
 * based on the AUTH-001 test script.
 */

const puppeteer = require('puppeteer');
const { expect } = require('chai');
const { testUtils } = require('../test-utils');

// Test configuration
const config = {
  baseUrl: process.env.TEST_URL || 'https://test.audotics.com',
  testUser: {
    email: 'testuser@audotics.com',
    password: 'Test123!'
  },
  newUser: {
    email: 'newuser@audotics.com',
    password: 'TestUser123!'
  },
  timeouts: {
    navigation: 10000,
    element: 5000,
    animation: 1000
  }
};

describe('Authentication Tests (AUTH-001)', () => {
  let browser;
  let page;

  before(async () => {
    console.log('Starting Authentication Tests...');
    browser = await puppeteer.launch({
      headless: process.env.HEADLESS !== 'false',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      defaultViewport: { width: 1280, height: 800 }
    });
  });

  beforeEach(async () => {
    page = await browser.newPage();
    await page.setDefaultNavigationTimeout(config.timeouts.navigation);
    
    // Set up request interception for network analysis
    await page.setRequestInterception(true);
    page.on('request', (request) => {
      // Log requests to auth endpoints for analysis
      if (request.url().includes('/auth/')) {
        console.log(`Auth request: ${request.method()} ${request.url()}`);
      }
      request.continue();
    });
    
    // Clear any existing state
    await page.goto(`${config.baseUrl}/logout`, { waitUntil: 'networkidle0' }).catch(() => {
      // Ignore errors if logout page doesn't exist
    });
    await testUtils.clearCookiesAndLocalStorage(page);
  });

  afterEach(async () => {
    // Take screenshot on failure
    if (this.currentTest && this.currentTest.state === 'failed') {
      await page.screenshot({
        path: `./screenshots/auth-test-failure-${Date.now()}.png`,
        fullPage: true
      });
    }
    await page.close();
  });

  after(async () => {
    await browser.close();
    console.log('Authentication Tests completed.');
  });

  // Test Registration
  describe('User Registration', () => {
    it('should load the landing page with register option', async () => {
      await page.goto(config.baseUrl, { waitUntil: 'networkidle0' });
      const registerButton = await page.$('a[href="/register"], button:has-text("Register")');
      expect(registerButton).to.not.be.null;
    });

    it('should show the registration form', async () => {
      await page.goto(config.baseUrl, { waitUntil: 'networkidle0' });
      await testUtils.clickElement(page, 'a[href="/register"], button:has-text("Register")');
      
      // Verify form elements are present
      const emailField = await page.$('input[type="email"], input[name="email"]');
      const passwordField = await page.$('input[type="password"], input[name="password"]');
      const confirmPasswordField = await page.$(
        'input[type="password"][name="confirmPassword"], input[name="passwordConfirm"]'
      );
      const termsCheckbox = await page.$(
        'input[type="checkbox"][name="terms"], input[name="acceptTerms"]'
      );
      
      expect(emailField).to.not.be.null;
      expect(passwordField).to.not.be.null;
      expect(confirmPasswordField).to.not.be.null;
      expect(termsCheckbox).to.not.be.null;
    });

    it('should validate email input', async () => {
      await page.goto(`${config.baseUrl}/register`, { waitUntil: 'networkidle0' });
      
      // Enter invalid email and check for validation
      await page.type('input[type="email"], input[name="email"]', 'invalid-email');
      await page.click('input[type="password"], input[name="password"]'); // Click away to trigger validation
      
      // Look for validation message (implementation may vary)
      const validationMsg = await testUtils.getValidationMessage(page, 'input[type="email"], input[name="email"]');
      expect(validationMsg).to.include('valid email');
    });

    it('should validate password requirements', async () => {
      await page.goto(`${config.baseUrl}/register`, { waitUntil: 'networkidle0' });
      
      // Enter short password and check for validation
      await page.type('input[type="email"], input[name="email"]', config.newUser.email);
      await page.type('input[type="password"], input[name="password"]', 'test');
      await page.click('input[type="email"], input[name="email"]'); // Click away to trigger validation
      
      // Check for validation message about password requirements
      const errorElement = await page.$(
        '.error:has-text("password"), .validation-error:has-text("password"), .error-message:has-text("password")'
      );
      expect(errorElement).to.not.be.null;
    });

    it('should validate password confirmation', async () => {
      await page.goto(`${config.baseUrl}/register`, { waitUntil: 'networkidle0' });
      
      // Enter mismatched passwords
      await page.type('input[type="email"], input[name="email"]', config.newUser.email);
      await page.type('input[type="password"], input[name="password"]', config.newUser.password);
      await page.type(
        'input[type="password"][name="confirmPassword"], input[name="passwordConfirm"]',
        'DifferentPassword123!'
      );
      
      // Submit form or click away to trigger validation
      await page.click('button[type="submit"]');
      
      // Check for validation message about password mismatch
      const errorElement = await page.$(
        '.error:has-text("match"), .validation-error:has-text("match"), .error-message:has-text("match")'
      );
      expect(errorElement).to.not.be.null;
    });

    it('should require terms acceptance', async () => {
      await page.goto(`${config.baseUrl}/register`, { waitUntil: 'networkidle0' });
      
      // Fill in valid data but don't check terms
      await page.type('input[type="email"], input[name="email"]', config.newUser.email);
      await page.type('input[type="password"], input[name="password"]', config.newUser.password);
      await page.type(
        'input[type="password"][name="confirmPassword"], input[name="passwordConfirm"]',
        config.newUser.password
      );
      
      // Submit form
      await page.click('button[type="submit"]');
      
      // Check for validation message about terms acceptance
      const errorElement = await page.$(
        '.error:has-text("terms"), .validation-error:has-text("terms"), .error-message:has-text("terms")'
      );
      expect(errorElement).to.not.be.null;
    });

    it('should successfully register a new user', async () => {
      // Skip this test if running in CI/CD to avoid creating real users
      if (process.env.CI === 'true') {
        console.log('Skipping actual user creation in CI environment');
        return;
      }
      
      await page.goto(`${config.baseUrl}/register`, { waitUntil: 'networkidle0' });
      
      // Fill in valid data
      await page.type('input[type="email"], input[name="email"]', config.newUser.email);
      await page.type('input[type="password"], input[name="password"]', config.newUser.password);
      await page.type(
        'input[type="password"][name="confirmPassword"], input[name="passwordConfirm"]',
        config.newUser.password
      );
      
      // Check terms checkbox
      await page.click('input[type="checkbox"][name="terms"], input[name="acceptTerms"]');
      
      // Submit form
      await page.click('button[type="submit"]');
      
      // Wait for redirect to profile setup or dashboard
      await page.waitForNavigation({ waitUntil: 'networkidle0' });
      
      // Verify we're on the profile setup or dashboard page
      const currentUrl = page.url();
      expect(currentUrl).to.match(/profile|dashboard|welcome/);
    });
  });

  // Test Login
  describe('User Login', () => {
    it('should load the login form', async () => {
      await page.goto(`${config.baseUrl}/login`, { waitUntil: 'networkidle0' });
      
      // Verify form elements are present
      const emailField = await page.$('input[type="email"], input[name="email"]');
      const passwordField = await page.$('input[type="password"], input[name="password"]');
      const loginButton = await page.$('button[type="submit"]');
      
      expect(emailField).to.not.be.null;
      expect(passwordField).to.not.be.null;
      expect(loginButton).to.not.be.null;
    });

    it('should show generic error for non-existent user', async () => {
      await page.goto(`${config.baseUrl}/login`, { waitUntil: 'networkidle0' });
      
      // Enter non-existent user
      await page.type('input[type="email"], input[name="email"]', 'nonexistent@audotics.com');
      await page.type('input[type="password"], input[name="password"]', 'AnyPassword123');
      
      // Submit form
      await page.click('button[type="submit"]');
      
      // Wait for error message (adjust selector based on actual implementation)
      await page.waitForSelector(
        '.error-message, .alert-error, .error, [role="alert"]',
        { timeout: config.timeouts.element }
      );
      
      // Verify error message is generic (doesn't specify which field is wrong)
      const errorText = await page.$eval(
        '.error-message, .alert-error, .error, [role="alert"]',
        el => el.textContent
      );
      
      expect(errorText.toLowerCase()).to.not.include('email');
      expect(errorText.toLowerCase()).to.include('invalid');
    });

    it('should reject invalid password for existing user', async () => {
      await page.goto(`${config.baseUrl}/login`, { waitUntil: 'networkidle0' });
      
      // Enter existing user with wrong password
      await page.type('input[type="email"], input[name="email"]', config.testUser.email);
      await page.type('input[type="password"], input[name="password"]', 'WrongPassword123');
      
      // Submit form
      await page.click('button[type="submit"]');
      
      // Wait for error message
      await page.waitForSelector(
        '.error-message, .alert-error, .error, [role="alert"]',
        { timeout: config.timeouts.element }
      );
      
      // Verify we're still on the login page
      const currentUrl = page.url();
      expect(currentUrl).to.include('login');
    });

    it('should successfully login with valid credentials', async () => {
      await page.goto(`${config.baseUrl}/login`, { waitUntil: 'networkidle0' });
      
      // Enter valid credentials
      await page.type('input[type="email"], input[name="email"]', config.testUser.email);
      await page.type('input[type="password"], input[name="password"]', config.testUser.password);
      
      // Submit form
      await page.click('button[type="submit"]');
      
      // Wait for redirect to dashboard
      await page.waitForNavigation({ waitUntil: 'networkidle0' });
      
      // Verify we're on the dashboard
      const currentUrl = page.url();
      expect(currentUrl).to.include('dashboard');
      
      // Verify personalized content is displayed
      const personalGreeting = await page.$('*:has-text("Welcome"), *:has-text("Hello")');
      expect(personalGreeting).to.not.be.null;
    });

    it('should successfully logout', async () => {
      // First login
      await page.goto(`${config.baseUrl}/login`, { waitUntil: 'networkidle0' });
      await page.type('input[type="email"], input[name="email"]', config.testUser.email);
      await page.type('input[type="password"], input[name="password"]', config.testUser.password);
      await page.click('button[type="submit"]');
      await page.waitForNavigation({ waitUntil: 'networkidle0' });
      
      // Find and click logout
      // Note: This will depend on the actual UI implementation
      const userMenuButton = await page.$('.user-menu, .avatar, .profile-icon, [aria-label="User menu"]');
      if (userMenuButton) {
        await userMenuButton.click();
        await page.waitForTimeout(config.timeouts.animation);
      }
      
      await testUtils.clickElement(page, 'a:has-text("Logout"), button:has-text("Logout"), a:has-text("Sign out")');
      
      // Wait for redirect to login or home page
      await page.waitForNavigation({ waitUntil: 'networkidle0' });
      
      // Verify we're logged out (either on login page or home page)
      const currentUrl = page.url();
      expect(currentUrl).to.not.include('dashboard');
      
      // Try to access protected page
      await page.goto(`${config.baseUrl}/dashboard`, { waitUntil: 'networkidle0' });
      
      // Verify we're redirected to login
      const redirectUrl = page.url();
      expect(redirectUrl).to.include('login');
    });
  });

  // Test Password Reset
  describe('Password Reset', () => {
    it('should show password reset form', async () => {
      await page.goto(`${config.baseUrl}/login`, { waitUntil: 'networkidle0' });
      
      // Click forgot password link
      await testUtils.clickElement(page, 'a:has-text("Forgot"), a:has-text("Reset")');
      
      // Verify reset password form is displayed
      const emailField = await page.$('input[type="email"], input[name="email"]');
      const submitButton = await page.$('button[type="submit"]');
      
      expect(emailField).to.not.be.null;
      expect(submitButton).to.not.be.null;
    });

    it('should handle non-existent email without revealing account existence', async () => {
      await page.goto(`${config.baseUrl}/forgot-password`, { waitUntil: 'networkidle0' });
      
      // Enter non-existent email
      await page.type('input[type="email"], input[name="email"]', 'nonexistent@audotics.com');
      
      // Submit form
      await page.click('button[type="submit"]');
      
      // Wait for success message
      await page.waitForSelector(
        '.success-message, .alert-success, .success, [role="status"]',
        { timeout: config.timeouts.element }
      );
      
      // Verify success message doesn't reveal if email exists
      const successText = await page.$eval(
        '.success-message, .alert-success, .success, [role="status"]',
        el => el.textContent
      );
      
      expect(successText.toLowerCase()).to.not.include('not found');
      expect(successText.toLowerCase()).to.include('sent');
    });

    it('should send reset email for existing user', async () => {
      // This test can only verify that the success message appears
      // Actually testing the email receipt requires additional setup
      
      await page.goto(`${config.baseUrl}/forgot-password`, { waitUntil: 'networkidle0' });
      
      // Enter existing email
      await page.type('input[type="email"], input[name="email"]', config.testUser.email);
      
      // Submit form
      await page.click('button[type="submit"]');
      
      // Wait for success message
      await page.waitForSelector(
        '.success-message, .alert-success, .success, [role="status"]',
        { timeout: config.timeouts.element }
      );
      
      // Success message should indicate that an email was sent
      const successText = await page.$eval(
        '.success-message, .alert-success, .success, [role="status"]',
        el => el.textContent
      );
      
      expect(successText.toLowerCase()).to.include('sent');
    });

    // Note: Testing the actual password reset from the email link would require
    // additional setup to intercept emails or mock the reset token
  });

  // Test SSO with Spotify
  describe('Spotify SSO', () => {
    it('should show Spotify login option', async () => {
      await page.goto(`${config.baseUrl}/login`, { waitUntil: 'networkidle0' });
      
      // Look for Spotify login button
      const spotifyButton = await page.$(
        'a:has-text("Spotify"), button:has-text("Spotify"), [aria-label="Login with Spotify"]'
      );
      
      expect(spotifyButton).to.not.be.null;
    });

    it('should redirect to Spotify for authentication', async () => {
      // This test only verifies the redirect happens, not the full OAuth flow
      // which would require a real Spotify account
      
      await page.goto(`${config.baseUrl}/login`, { waitUntil: 'networkidle0' });
      
      // Click on Spotify login button
      const spotifyButton = await page.$(
        'a:has-text("Spotify"), button:has-text("Spotify"), [aria-label="Login with Spotify"]'
      );
      
      // Create a promise to detect navigation to Spotify domain
      const navigationPromise = page.waitForRequest(request => 
        request.url().includes('accounts.spotify.com')
      );
      
      // Click the button
      await spotifyButton.click();
      
      // Wait for navigation to Spotify
      await navigationPromise;
      
      // We don't complete the Spotify login in automated tests
    });

    // Note: Full end-to-end Spotify authentication testing would require
    // a test account and handling of the OAuth callback
  });

  // Security Checks
  describe('Security Checks', () => {
    it('should use HTTPS for all authentication requests', async () => {
      let nonHttpsRequests = [];
      
      page.on('request', request => {
        if (request.url().includes('/auth/') && !request.url().startsWith('https://')) {
          nonHttpsRequests.push(request.url());
        }
      });
      
      // Trigger authentication requests
      await page.goto(`${config.baseUrl}/login`, { waitUntil: 'networkidle0' });
      await page.type('input[type="email"], input[name="email"]', config.testUser.email);
      await page.type('input[type="password"], input[name="password"]', config.testUser.password);
      await page.click('button[type="submit"]');
      
      // Wait for navigation
      await page.waitForNavigation({ waitUntil: 'networkidle0' });
      
      // Verify no non-HTTPS auth requests were made
      expect(nonHttpsRequests).to.be.empty;
    });

    it('should set secure cookies for authentication', async () => {
      // Login first
      await page.goto(`${config.baseUrl}/login`, { waitUntil: 'networkidle0' });
      await page.type('input[type="email"], input[name="email"]', config.testUser.email);
      await page.type('input[type="password"], input[name="password"]', config.testUser.password);
      await page.click('button[type="submit"]');
      await page.waitForNavigation({ waitUntil: 'networkidle0' });
      
      // Check cookies
      const cookies = await page.cookies();
      const authCookies = cookies.filter(cookie => 
        cookie.name.toLowerCase().includes('auth') || 
        cookie.name.toLowerCase().includes('token') || 
        cookie.name.toLowerCase().includes('session')
      );
      
      // Verify auth cookies exist
      expect(authCookies.length).to.be.greaterThan(0);
      
      // Verify they have secure flags
      for (const cookie of authCookies) {
        expect(cookie.secure).to.be.true;
        // In a secure environment, HttpOnly should also be true
        // but this depends on the application's security requirements
      }
    });

    it('should prevent sensitive auth data storage in localStorage', async () => {
      // Login first
      await page.goto(`${config.baseUrl}/login`, { waitUntil: 'networkidle0' });
      await page.type('input[type="email"], input[name="email"]', config.testUser.email);
      await page.type('input[type="password"], input[name="password"]', config.testUser.password);
      await page.click('button[type="submit"]');
      await page.waitForNavigation({ waitUntil: 'networkidle0' });
      
      // Check localStorage for sensitive data
      const localStorage = await page.evaluate(() => {
        const items = {};
        for (let i = 0; i < window.localStorage.length; i++) {
          const key = window.localStorage.key(i);
          items[key] = window.localStorage.getItem(key);
        }
        return items;
      });
      
      // Look for sensitive data in localStorage
      const sensitiveKeys = Object.keys(localStorage).filter(key => {
        const value = localStorage[key].toLowerCase();
        return (
          // Check for plaintext passwords
          value.includes('password') ||
          // Check for JWT tokens that aren't properly encrypted
          (value.includes('eyj') && value.includes('.') && value.length > 100) ||
          // Check for plaintext user credentials
          value.includes(config.testUser.email.toLowerCase())
        );
      });
      
      // There should be no sensitive data in localStorage
      expect(sensitiveKeys).to.be.empty;
    });

    // Additional security tests would include:
    // - Brute force protection
    // - CSRF token validation
    // - XSS protection
    // These may require more specialized testing approaches
  });
});

module.exports = {
  runAuthTests: () => {
    describe('Authentication Tests', () => {
      // Tests will be run by the test runner
    });
  }
}; 