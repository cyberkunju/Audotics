/**
 * Audotics Group Session Tests
 * 
 * This script provides automated tests for the group session functionality
 * based on the GROUP-001 test script.
 */

const puppeteer = require('puppeteer');
const { expect } = require('chai');
const { testUtils } = require('../test-utils');

// Test configuration
const config = {
  baseUrl: process.env.TEST_URL || 'https://test.audotics.com',
  hostUser: {
    email: 'hostuser@audotics.com',
    password: 'Host123!'
  },
  memberUser1: {
    email: 'member1@audotics.com',
    password: 'Member123!'
  },
  memberUser2: {
    email: 'member2@audotics.com',
    password: 'Member123!'
  },
  timeouts: {
    navigation: 10000,
    element: 5000,
    animation: 1000,
    websocket: 5000
  }
};

describe('Group Session Tests (GROUP-001)', () => {
  let hostBrowser;
  let member1Browser;
  let member2Browser;
  let hostPage;
  let member1Page;
  let member2Page;
  let sessionCode; // Will store the session code for members to join

  // Initialize browsers before all tests
  before(async () => {
    console.log('Starting Group Session Tests...');
    
    // Launch browsers for each user
    [hostBrowser, member1Browser, member2Browser] = await Promise.all([
      puppeteer.launch({
        headless: process.env.HEADLESS !== 'false',
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        defaultViewport: { width: 1280, height: 800 }
      }),
      puppeteer.launch({
        headless: process.env.HEADLESS !== 'false',
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        defaultViewport: { width: 1280, height: 800 }
      }),
      puppeteer.launch({
        headless: process.env.HEADLESS !== 'false',
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        defaultViewport: { width: 1280, height: 800 }
      })
    ]);
  });

  // Clean up after all tests
  after(async () => {
    // Close all browsers
    await Promise.all([
      hostBrowser.close(),
      member1Browser.close(),
      member2Browser.close()
    ]);
    
    console.log('Group Session Tests completed.');
  });

  // Log in all users before tests
  beforeEach(async () => {
    // Create pages for each user
    [hostPage, member1Page, member2Page] = await Promise.all([
      hostBrowser.newPage(),
      member1Browser.newPage(),
      member2Browser.newPage()
    ]);
    
    // Set timeouts
    await Promise.all([
      hostPage.setDefaultNavigationTimeout(config.timeouts.navigation),
      member1Page.setDefaultNavigationTimeout(config.timeouts.navigation),
      member2Page.setDefaultNavigationTimeout(config.timeouts.navigation)
    ]);
    
    // Clear cookies and local storage for all pages
    await Promise.all([
      testUtils.clearCookiesAndLocalStorage(hostPage),
      testUtils.clearCookiesAndLocalStorage(member1Page),
      testUtils.clearCookiesAndLocalStorage(member2Page)
    ]);
    
    // Log in all users
    await loginUser(hostPage, config.hostUser);
    await loginUser(member1Page, config.memberUser1);
    await loginUser(member2Page, config.memberUser2);
  });

  // Close pages after each test
  afterEach(async () => {
    if (hostPage) await hostPage.close();
    if (member1Page) await member1Page.close();
    if (member2Page) await member2Page.close();
  });

  // Login helper function
  async function loginUser(page, user) {
    await page.goto(`${config.baseUrl}/login`, { waitUntil: 'networkidle0' });
    await page.type('input[type="email"], input[name="email"]', user.email);
    await page.type('input[type="password"], input[name="password"]', user.password);
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle0' });
    
    // Verify we're logged in
    const currentUrl = page.url();
    expect(currentUrl).to.include('dashboard');
  }

  // Test group session creation
  describe('Session Creation', () => {
    it('should allow host to create a new session', async () => {
      // Navigate to create session page
      await hostPage.goto(`${config.baseUrl}/dashboard`, { waitUntil: 'networkidle0' });
      await testUtils.clickElement(hostPage, 'a:has-text("Create Session"), button:has-text("Create Session")');
      
      // Wait for session creation form
      await hostPage.waitForSelector('form, .session-form, [data-testid="create-session-form"]');
      
      // Fill in session details
      await hostPage.type('input[name="sessionName"], input[placeholder="Session Name"]', 'Test Group Session');
      
      // Select privacy options if available
      const privacySelector = await hostPage.$('select[name="privacy"], [data-testid="privacy-selector"]');
      if (privacySelector) {
        await hostPage.select('select[name="privacy"], [data-testid="privacy-selector"]', 'private');
      }
      
      // Submit form
      await hostPage.click('button[type="submit"], button:has-text("Create")');
      
      // Wait for redirection to session page
      await hostPage.waitForNavigation({ waitUntil: 'networkidle0' });
      
      // Verify we're on the session page
      const currentUrl = hostPage.url();
      expect(currentUrl).to.include('session');
      
      // Get session code for later use
      sessionCode = await hostPage.evaluate(() => {
        // Look for session code displayed in the UI
        const codeElement = document.querySelector('.session-code, [data-testid="session-code"]');
        if (codeElement) return codeElement.textContent.trim();
        
        // If not found directly, try to extract from URL
        const sessionUrl = window.location.href;
        const match = sessionUrl.match(/session\/([A-Z0-9]+)/i);
        return match ? match[1] : null;
      });
      
      expect(sessionCode).to.not.be.null;
      console.log(`Created session with code: ${sessionCode}`);
    });

    it('should show host controls in the session', async () => {
      // Verify host controls are present
      const hostControls = await hostPage.$('.host-controls, [data-testid="host-controls"]');
      expect(hostControls).to.not.be.null;
      
      // Verify specific host actions are available
      const inviteButton = await hostPage.$('button:has-text("Invite"), [data-testid="invite-button"]');
      expect(inviteButton).to.not.be.null;
      
      const settingsButton = await hostPage.$('button:has-text("Settings"), [data-testid="session-settings"]');
      expect(settingsButton).to.not.be.null;
    });
  });

  // Test joining sessions
  describe('Session Joining', () => {
    it('should allow member 1 to join using session code', async () => {
      // Navigate to join session page
      await member1Page.goto(`${config.baseUrl}/dashboard`, { waitUntil: 'networkidle0' });
      await testUtils.clickElement(member1Page, 'a:has-text("Join Session"), button:has-text("Join")');
      
      // Wait for join form
      await member1Page.waitForSelector('input[name="sessionCode"], input[placeholder="Session Code"]');
      
      // Enter session code
      await member1Page.type('input[name="sessionCode"], input[placeholder="Session Code"]', sessionCode);
      
      // Submit form
      await member1Page.click('button[type="submit"], button:has-text("Join")');
      
      // Wait for redirection to session page
      await member1Page.waitForNavigation({ waitUntil: 'networkidle0' });
      
      // Verify we're on the session page
      const currentUrl = member1Page.url();
      expect(currentUrl).to.include('session');
      expect(currentUrl).to.include(sessionCode);
      
      // Verify session title is displayed
      const sessionTitle = await member1Page.$('h1:has-text("Test Group Session"), .session-title:has-text("Test Group Session")');
      expect(sessionTitle).to.not.be.null;
      
      // Wait a bit for WebSocket connection to establish
      await member1Page.waitForTimeout(1000);
    });

    it('should notify host when member 1 joins', async () => {
      // Wait for notification on host's page
      await hostPage.waitForFunction(
        () => {
          const notifications = document.querySelectorAll('.notification, .toast, [data-testid="notification"]');
          for (const notification of notifications) {
            if (notification.textContent.includes('joined') || notification.textContent.includes('Member')) {
              return true;
            }
          }
          return false;
        },
        { timeout: config.timeouts.websocket }
      );
      
      // Verify member is shown in participants list
      const participantsList = await hostPage.$('.participants-list, [data-testid="participants-list"]');
      expect(participantsList).to.not.be.null;
      
      const member1Element = await hostPage.evaluateHandle(() => {
        const participants = document.querySelectorAll('.participant, .member, [data-testid^="participant-"]');
        for (const participant of participants) {
          if (participant.textContent.includes('member1') || participant.textContent.toLowerCase().includes('member1@audotics.com')) {
            return participant;
          }
        }
        return null;
      });
      
      expect(member1Element).to.not.be.null;
    });

    it('should allow member 2 to join the session', async () => {
      // Navigate to join session page
      await member2Page.goto(`${config.baseUrl}/dashboard`, { waitUntil: 'networkidle0' });
      await testUtils.clickElement(member2Page, 'a:has-text("Join Session"), button:has-text("Join")');
      
      // Wait for join form
      await member2Page.waitForSelector('input[name="sessionCode"], input[placeholder="Session Code"]');
      
      // Enter session code
      await member2Page.type('input[name="sessionCode"], input[placeholder="Session Code"]', sessionCode);
      
      // Submit form
      await member2Page.click('button[type="submit"], button:has-text("Join")');
      
      // Wait for redirection to session page
      await member2Page.waitForNavigation({ waitUntil: 'networkidle0' });
      
      // Verify we're on the session page
      const currentUrl = member2Page.url();
      expect(currentUrl).to.include('session');
      expect(currentUrl).to.include(sessionCode);
      
      // Wait a bit for WebSocket connection to establish
      await member2Page.waitForTimeout(1000);
    });

    it('should update participants list for all users when member 2 joins', async () => {
      // Check that member 2 appears in participants list for host
      await hostPage.waitForFunction(
        () => {
          const participants = document.querySelectorAll('.participant, .member, [data-testid^="participant-"]');
          let member2Found = false;
          
          for (const participant of participants) {
            if (participant.textContent.includes('member2') || 
                participant.textContent.toLowerCase().includes('member2@audotics.com')) {
              member2Found = true;
              break;
            }
          }
          
          return participants.length >= 3 && member2Found; // Host + 2 members
        },
        { timeout: config.timeouts.websocket }
      );
      
      // Check that member 2 appears in participants list for member 1
      await member1Page.waitForFunction(
        () => {
          const participants = document.querySelectorAll('.participant, .member, [data-testid^="participant-"]');
          let member2Found = false;
          
          for (const participant of participants) {
            if (participant.textContent.includes('member2') || 
                participant.textContent.toLowerCase().includes('member2@audotics.com')) {
              member2Found = true;
              break;
            }
          }
          
          return participants.length >= 3 && member2Found; // Host + 2 members
        },
        { timeout: config.timeouts.websocket }
      );
      
      // Get participants count for each user
      const hostParticipantsCount = await hostPage.evaluate(() => {
        return document.querySelectorAll('.participant, .member, [data-testid^="participant-"]').length;
      });
      
      const member1ParticipantsCount = await member1Page.evaluate(() => {
        return document.querySelectorAll('.participant, .member, [data-testid^="participant-"]').length;
      });
      
      const member2ParticipantsCount = await member2Page.evaluate(() => {
        return document.querySelectorAll('.participant, .member, [data-testid^="participant-"]').length;
      });
      
      // Verify all users see the same number of participants
      expect(hostParticipantsCount).to.equal(3); // Host + 2 members
      expect(member1ParticipantsCount).to.equal(3);
      expect(member2ParticipantsCount).to.equal(3);
    });
  });

  // Test real-time updates
  describe('Real-time Updates', () => {
    it('should sync playlist additions in real-time', async () => {
      // Host adds a track to the playlist
      await hostPage.goto(`${config.baseUrl}/session/${sessionCode}`, { waitUntil: 'networkidle0' });
      
      // Click on search or add track button
      await testUtils.clickElement(
        hostPage, 
        'button:has-text("Add Track"), button:has-text("Search"), [data-testid="search-button"]'
      );
      
      // Wait for search input and enter a search term
      await hostPage.waitForSelector('input[type="search"], input[placeholder="Search"], [data-testid="search-input"]');
      await hostPage.type(
        'input[type="search"], input[placeholder="Search"], [data-testid="search-input"]', 
        'Never Gonna Give You Up'
      );
      
      // Submit search
      await hostPage.keyboard.press('Enter');
      
      // Wait for search results
      await hostPage.waitForSelector('.search-results, .track-results, [data-testid="search-results"]');
      
      // Click on first track result
      await testUtils.clickElement(hostPage, '.track-item:first-child, .search-result:first-child, [data-testid^="track-result-"]');
      
      // Click add button if required
      const addButton = await hostPage.$('button:has-text("Add"), button:has-text("Add to Playlist")');
      if (addButton) {
        await addButton.click();
      }
      
      // Wait for track to appear in playlist
      await hostPage.waitForSelector(
        '.playlist-item, .playlist-track, [data-testid^="playlist-track-"]',
        { timeout: config.timeouts.websocket }
      );
      
      // Get track name from host playlist
      const hostTrackName = await hostPage.evaluate(() => {
        const trackElement = document.querySelector('.playlist-item, .playlist-track, [data-testid^="playlist-track-"]');
        return trackElement ? trackElement.textContent : '';
      });
      
      expect(hostTrackName.toLowerCase()).to.include('never gonna give you up');
      
      // Check if the track appears in member 1's playlist (real-time update)
      await member1Page.waitForFunction(
        (trackName) => {
          const trackElements = document.querySelectorAll('.playlist-item, .playlist-track, [data-testid^="playlist-track-"]');
          for (const element of trackElements) {
            if (element.textContent.toLowerCase().includes(trackName.toLowerCase())) {
              return true;
            }
          }
          return false;
        },
        { timeout: config.timeouts.websocket },
        'never gonna give you up'
      );
      
      // Check if the track appears in member 2's playlist (real-time update)
      await member2Page.waitForFunction(
        (trackName) => {
          const trackElements = document.querySelectorAll('.playlist-item, .playlist-track, [data-testid^="playlist-track-"]');
          for (const element of trackElements) {
            if (element.textContent.toLowerCase().includes(trackName.toLowerCase())) {
              return true;
            }
          }
          return false;
        },
        { timeout: config.timeouts.websocket },
        'never gonna give you up'
      );
    });

    it('should sync playlist votes in real-time', async () => {
      // Member 1 upvotes the track
      const member1UpvoteButton = await member1Page.$('.upvote-button, [data-testid="upvote-button"]');
      expect(member1UpvoteButton).to.not.be.null;
      await member1UpvoteButton.click();
      
      // Wait for vote to be processed
      await member1Page.waitForTimeout(config.timeouts.animation);
      
      // Get vote count from member 1's view
      const member1VoteCount = await member1Page.evaluate(() => {
        const voteElement = document.querySelector('.vote-count, [data-testid="vote-count"]');
        return voteElement ? parseInt(voteElement.textContent, 10) : 0;
      });
      
      expect(member1VoteCount).to.be.at.least(1);
      
      // Check if the vote count updates for host
      await hostPage.waitForFunction(
        (expectedCount) => {
          const voteElement = document.querySelector('.vote-count, [data-testid="vote-count"]');
          return voteElement && parseInt(voteElement.textContent, 10) >= expectedCount;
        },
        { timeout: config.timeouts.websocket },
        member1VoteCount
      );
      
      // Check if the vote count updates for member 2
      await member2Page.waitForFunction(
        (expectedCount) => {
          const voteElement = document.querySelector('.vote-count, [data-testid="vote-count"]');
          return voteElement && parseInt(voteElement.textContent, 10) >= expectedCount;
        },
        { timeout: config.timeouts.websocket },
        member1VoteCount
      );
      
      // Now member 2 upvotes as well
      const member2UpvoteButton = await member2Page.$('.upvote-button, [data-testid="upvote-button"]');
      expect(member2UpvoteButton).to.not.be.null;
      await member2UpvoteButton.click();
      
      // Wait for vote to be processed
      await member2Page.waitForTimeout(config.timeouts.animation);
      
      // Get vote count from member 2's view
      const member2VoteCount = await member2Page.evaluate(() => {
        const voteElement = document.querySelector('.vote-count, [data-testid="vote-count"]');
        return voteElement ? parseInt(voteElement.textContent, 10) : 0;
      });
      
      expect(member2VoteCount).to.be.at.least(2);
      
      // Check if the vote count updates for all users
      await hostPage.waitForFunction(
        (expectedCount) => {
          const voteElement = document.querySelector('.vote-count, [data-testid="vote-count"]');
          return voteElement && parseInt(voteElement.textContent, 10) >= expectedCount;
        },
        { timeout: config.timeouts.websocket },
        member2VoteCount
      );
      
      await member1Page.waitForFunction(
        (expectedCount) => {
          const voteElement = document.querySelector('.vote-count, [data-testid="vote-count"]');
          return voteElement && parseInt(voteElement.textContent, 10) >= expectedCount;
        },
        { timeout: config.timeouts.websocket },
        member2VoteCount
      );
    });
  });

  // Test chat functionality
  describe('Session Chat', () => {
    it('should allow users to send and receive chat messages', async () => {
      // Open chat if needed (might be hidden on mobile)
      const hostChatToggle = await hostPage.$('button:has-text("Chat"), [data-testid="chat-toggle"]');
      if (hostChatToggle) {
        await hostChatToggle.click();
        await hostPage.waitForSelector('.chat-container, [data-testid="chat-container"]', { visible: true });
      }
      
      // Host sends a message
      await hostPage.waitForSelector('input[placeholder="Type a message"], .chat-input, [data-testid="chat-input"]');
      await hostPage.type(
        'input[placeholder="Type a message"], .chat-input, [data-testid="chat-input"]',
        'Hello from the host!'
      );
      await hostPage.keyboard.press('Enter');
      
      // Wait for the message to appear in host's chat
      await hostPage.waitForFunction(
        () => {
          const messages = document.querySelectorAll('.chat-message, [data-testid^="chat-message-"]');
          for (const message of messages) {
            if (message.textContent.includes('Hello from the host!')) {
              return true;
            }
          }
          return false;
        },
        { timeout: config.timeouts.websocket }
      );
      
      // Check if message appears for member 1
      await member1Page.waitForFunction(
        () => {
          const messages = document.querySelectorAll('.chat-message, [data-testid^="chat-message-"]');
          for (const message of messages) {
            if (message.textContent.includes('Hello from the host!')) {
              return true;
            }
          }
          return false;
        },
        { timeout: config.timeouts.websocket }
      );
      
      // Check if message appears for member 2
      await member2Page.waitForFunction(
        () => {
          const messages = document.querySelectorAll('.chat-message, [data-testid^="chat-message-"]');
          for (const message of messages) {
            if (message.textContent.includes('Hello from the host!')) {
              return true;
            }
          }
          return false;
        },
        { timeout: config.timeouts.websocket }
      );
      
      // Member 1 replies
      await member1Page.waitForSelector('input[placeholder="Type a message"], .chat-input, [data-testid="chat-input"]');
      await member1Page.type(
        'input[placeholder="Type a message"], .chat-input, [data-testid="chat-input"]',
        'Hello back from member 1!'
      );
      await member1Page.keyboard.press('Enter');
      
      // Check if member 1's message appears for all users
      for (const page of [hostPage, member1Page, member2Page]) {
        await page.waitForFunction(
          () => {
            const messages = document.querySelectorAll('.chat-message, [data-testid^="chat-message-"]');
            for (const message of messages) {
              if (message.textContent.includes('Hello back from member 1!')) {
                return true;
              }
            }
            return false;
          },
          { timeout: config.timeouts.websocket }
        );
      }
    });
  });

  // Test session leave/end functionality
  describe('Session Management', () => {
    it('should allow members to leave the session', async () => {
      // Member 2 leaves the session
      await testUtils.clickElement(
        member2Page,
        'button:has-text("Leave"), [data-testid="leave-session"]'
      );
      
      // Confirm if needed
      const confirmButton = await member2Page.$('button:has-text("Yes"), button:has-text("Confirm")');
      if (confirmButton) {
        await confirmButton.click();
      }
      
      // Wait for redirect to dashboard
      await member2Page.waitForNavigation({ waitUntil: 'networkidle0' });
      
      // Verify we're on the dashboard
      const currentUrl = member2Page.url();
      expect(currentUrl).to.include('dashboard');
      expect(currentUrl).to.not.include('session');
      
      // Check that participant count updates for remaining users
      await hostPage.waitForFunction(
        () => {
          const participants = document.querySelectorAll('.participant, .member, [data-testid^="participant-"]');
          return participants.length === 2; // Now only host + member 1
        },
        { timeout: config.timeouts.websocket }
      );
      
      await member1Page.waitForFunction(
        () => {
          const participants = document.querySelectorAll('.participant, .member, [data-testid^="participant-"]');
          return participants.length === 2; // Now only host + member 1
        },
        { timeout: config.timeouts.websocket }
      );
    });

    it('should allow host to end the session for all users', async () => {
      // Host ends the session
      await testUtils.clickElement(
        hostPage,
        'button:has-text("End Session"), [data-testid="end-session"]'
      );
      
      // Confirm end session
      const confirmButton = await hostPage.$('button:has-text("Yes"), button:has-text("Confirm")');
      if (confirmButton) {
        await confirmButton.click();
      }
      
      // Wait for redirect to dashboard or session summary
      await hostPage.waitForNavigation({ waitUntil: 'networkidle0' });
      
      // Verify host is no longer in the session
      const hostUrl = hostPage.url();
      expect(hostUrl).to.not.include(`session/${sessionCode}`);
      
      // Wait for member 1 to be redirected as well
      await member1Page.waitForFunction(
        (sessionCode) => {
          return !window.location.href.includes(`session/${sessionCode}`);
        },
        { timeout: config.timeouts.websocket },
        sessionCode
      );
      
      // Verify member 1 receives notification about session end
      const notificationVisible = await member1Page.evaluate(() => {
        const notifications = document.querySelectorAll('.notification, .toast, [role="alert"]');
        for (const notification of notifications) {
          if (notification.textContent.includes('ended') || 
              notification.textContent.includes('closed') ||
              notification.textContent.includes('terminated')) {
            return true;
          }
        }
        return false;
      });
      
      expect(notificationVisible).to.be.true;
    });
  });
});

module.exports = {
  runGroupSessionTests: () => {
    describe('Group Session Tests', () => {
      // Tests will be run by the test runner
    });
  }
}; 