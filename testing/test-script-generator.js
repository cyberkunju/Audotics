/**
 * Audotics Test Script Generator
 * 
 * This script generates detailed test scripts from the high-level test cases
 * defined in the end-to-end testing plan. These scripts can be used by testers
 * to ensure consistent and thorough testing.
 */

const fs = require('fs');
const path = require('path');

// Test Case Definitions
const testCases = {
  // Authentication
  'user-registration': {
    name: 'User Registration',
    description: 'Verify that a new user can successfully register for an account',
    preconditions: 'User is not logged in and is on the registration page',
    steps: [
      { step: 'Navigate to the registration page', expected: 'Registration form is displayed' },
      { step: 'Enter valid user information (username, email, password)', expected: 'Form accepts the input without validation errors' },
      { step: 'Submit the registration form', expected: 'System processes the registration' },
      { step: 'Check for confirmation message', expected: 'Success message is displayed' },
      { step: 'Attempt to login with new credentials', expected: 'User is successfully logged in and redirected to dashboard' }
    ],
    variations: [
      { name: 'Invalid Email', description: 'Attempt registration with invalid email format', expectedResult: 'Validation error for email field is displayed' },
      { name: 'Weak Password', description: 'Attempt registration with weak password', expectedResult: 'Password strength validation message is displayed' },
      { name: 'Existing User', description: 'Attempt registration with existing username/email', expectedResult: 'Error message indicating user already exists' }
    ]
  },
  
  'user-login': {
    name: 'User Login',
    description: 'Verify that a registered user can successfully log in',
    preconditions: 'User is registered and not currently logged in',
    steps: [
      { step: 'Navigate to the login page', expected: 'Login form is displayed' },
      { step: 'Enter valid username/email and password', expected: 'Form accepts the input' },
      { step: 'Click the login button', expected: 'System authenticates the user' },
      { step: 'Check redirection', expected: 'User is redirected to the dashboard' },
      { step: 'Verify authentication state', expected: 'User appears as logged in (profile info visible, auth-only features available)' }
    ],
    variations: [
      { name: 'Invalid Credentials', description: 'Attempt login with incorrect password', expectedResult: 'Error message indicating invalid credentials' },
      { name: 'Remember Me', description: 'Login with "Remember Me" checked', expectedResult: 'User remains logged in after browser restart' },
      { name: 'Session Timeout', description: 'Wait for session timeout', expectedResult: 'User is prompted to re-authenticate' }
    ]
  },
  
  // Session Management
  'session-creation': {
    name: 'Session Creation',
    description: 'Verify that a user can create a new listening session',
    preconditions: 'User is logged in and on the dashboard',
    steps: [
      { step: 'Click "Create Session" button', expected: 'Session creation modal appears' },
      { step: 'Enter session name and settings', expected: 'Form accepts input' },
      { step: 'Click "Create" button', expected: 'System creates the session' },
      { step: 'Check redirection', expected: 'User is redirected to the new session page' },
      { step: 'Verify session details', expected: 'Session name and settings match those entered' }
    ],
    variations: [
      { name: 'Empty Session Name', description: 'Attempt to create session without a name', expectedResult: 'Validation error is displayed' },
      { name: 'Duplicate Session Name', description: 'Create session with existing name', expectedResult: 'System allows creation or suggests a unique name' }
    ]
  },
  
  'session-joining': {
    name: 'Session Joining',
    description: 'Verify that a user can join an existing session',
    preconditions: 'User is logged in, and a session created by another user exists',
    steps: [
      { step: 'Receive session invite link/code', expected: 'User has access to a valid invite' },
      { step: 'Navigate to invite link or enter code', expected: 'System processes the invite' },
      { step: 'Confirm joining the session', expected: 'System adds user to session' },
      { step: 'Check redirection', expected: 'User is redirected to the session page' },
      { step: 'Verify session details', expected: 'User appears in the participants list' }
    ],
    variations: [
      { name: 'Invalid Invite', description: 'Attempt to join with invalid code', expectedResult: 'Error message indicating invalid invitation' },
      { name: 'Expired Invite', description: 'Attempt to join with expired invite', expectedResult: 'Error message indicating expired invitation' }
    ]
  },
  
  // Playlist Management
  'playlist-management': {
    name: 'Playlist Management',
    description: 'Verify that users can add and remove tracks from a session playlist',
    preconditions: 'User is in an active session',
    steps: [
      { step: 'View recommendations tab', expected: 'List of recommended tracks is displayed' },
      { step: 'Click "Add" button for a track', expected: 'Track is added to playlist' },
      { step: 'Switch to playlist tab', expected: 'Added track appears in playlist' },
      { step: 'Click "Remove" button for the track', expected: 'Track is removed from playlist' },
      { step: 'Verify other users see changes', expected: 'All session participants see the updated playlist' }
    ],
    variations: [
      { name: 'Add Multiple Tracks', description: 'Add several tracks to playlist', expectedResult: 'All tracks appear in correct order' },
      { name: 'Concurrent Changes', description: 'Multiple users modify playlist simultaneously', expectedResult: 'Changes are synchronized correctly' }
    ]
  },
  
  // Recommendations
  'recommendation-display': {
    name: 'Recommendation Display',
    description: 'Verify that personalized track recommendations are displayed',
    preconditions: 'User is in an active session',
    steps: [
      { step: 'Navigate to recommendations tab', expected: 'Recommendations are loaded' },
      { step: 'Wait for recommendations to display', expected: 'List of personalized tracks is shown' },
      { step: 'Verify track details', expected: 'Each track shows title, artist, album, and duration' },
      { step: 'Add a track to playlist', expected: 'Recommendations update to reflect the selection' },
      { step: 'Check for more recommendations button', expected: 'Option to load more recommendations is available if applicable' }
    ],
    variations: [
      { name: 'New User', description: 'Check recommendations for new user', expectedResult: 'Generic popular recommendations are shown' },
      { name: 'Group Recommendations', description: 'Check recommendations with multiple users', expectedResult: 'Recommendations balance preferences of all users' }
    ]
  },
  
  'track-search': {
    name: 'Track Search',
    description: 'Verify that users can search for tracks',
    preconditions: 'User is in an active session',
    steps: [
      { step: 'Navigate to recommendations tab', expected: 'Search input is available' },
      { step: 'Enter search query', expected: 'Search input accepts text' },
      { step: 'Submit search', expected: 'System displays loading indicator' },
      { step: 'Wait for search results', expected: 'Relevant search results are displayed' },
      { step: 'Verify search results', expected: 'Results match search query and show track details' }
    ],
    variations: [
      { name: 'No Results', description: 'Search for nonexistent track', expectedResult: 'No results message is displayed' },
      { name: 'Partial Match', description: 'Search with partial track/artist name', expectedResult: 'Relevant partial matches are returned' }
    ]
  },
  
  // Export Functionality
  'export-to-spotify': {
    name: 'Export to Spotify',
    description: 'Verify that users can export playlist to Spotify',
    preconditions: 'User is in an active session with tracks in the playlist',
    steps: [
      { step: 'Navigate to playlist tab', expected: 'Playlist with tracks is displayed' },
      { step: 'Click "Export to Spotify" button', expected: 'Export confirmation dialog appears' },
      { step: 'Confirm export', expected: 'System initiates Spotify authentication if needed' },
      { step: 'Complete Spotify authorization if prompted', expected: 'System exports playlist to Spotify' },
      { step: 'Check for success confirmation', expected: 'Success message with link to Spotify playlist is shown' }
    ],
    variations: [
      { name: 'Empty Playlist', description: 'Attempt to export empty playlist', expectedResult: 'Warning message that playlist is empty' },
      { name: 'Not Authenticated', description: 'Export without Spotify authentication', expectedResult: 'System prompts for Spotify authentication' }
    ]
  },
  
  // Real-time Updates
  'real-time-updates': {
    name: 'Real-time Updates',
    description: 'Verify that real-time updates are propagated to all session participants',
    preconditions: 'Multiple users are in the same active session',
    steps: [
      { step: 'User 1: Add a track to playlist', expected: 'User 1 sees track added to playlist' },
      { step: 'User 2: Check playlist', expected: 'User 2 sees the new track without refreshing' },
      { step: 'User 3: Join the session', expected: 'User 1 and 2 see User 3 added to participants list' },
      { step: 'User 2: Remove a track', expected: 'All users see the track removed in real-time' },
      { step: 'User 3: Leave the session', expected: 'User 1 and 2 see User 3 removed from participants' }
    ],
    variations: [
      { name: 'Network Interruption', description: 'Temporarily disconnect one user', expectedResult: 'Updates resume when connection is restored' },
      { name: 'Concurrent Updates', description: 'Multiple users perform actions simultaneously', expectedResult: 'All updates are processed correctly' }
    ]
  },
  
  // Error Handling
  'error-handling': {
    name: 'Error Handling',
    description: 'Verify that the application handles errors gracefully',
    preconditions: 'User is using the application',
    steps: [
      { step: 'Simulate network disconnection', expected: 'Error notification appears' },
      { step: 'Attempt an action while offline', expected: 'Appropriate error message is shown' },
      { step: 'Restore network connection', expected: 'System recovers and reconnects' },
      { step: 'Simulate API error (using test mode)', expected: 'Error boundary catches the error' },
      { step: 'Check for recovery options', expected: 'User is presented with retry or fallback options' }
    ],
    variations: [
      { name: 'Authentication Error', description: 'Simulate auth token expiration', expectedResult: 'User is prompted to re-authenticate' },
      { name: 'WebSocket Error', description: 'Simulate WebSocket failure', expectedResult: 'System attempts to reconnect automatically' },
      { name: 'Form Validation', description: 'Submit form with invalid data', expectedResult: 'Validation errors are displayed clearly' }
    ]
  }
};

/**
 * Generates a detailed test script from a test case
 * @param {string} testCaseId - ID of the test case
 * @returns {string} Formatted test script markdown
 */
function generateTestScript(testCaseId) {
  const testCase = testCases[testCaseId];
  if (!testCase) {
    return `Test case '${testCaseId}' not found.`;
  }
  
  let script = `# Test Script: ${testCase.name}\n\n`;
  script += `## Description\n${testCase.description}\n\n`;
  script += `## Preconditions\n${testCase.preconditions}\n\n`;
  
  script += `## Test Steps\n\n`;
  script += `| # | Step | Expected Result | Actual Result | Pass/Fail | Notes |\n`;
  script += `|---|------|-----------------|---------------|-----------|-------|\n`;
  
  testCase.steps.forEach((step, index) => {
    script += `| ${index + 1} | ${step.step} | ${step.expected} | | | |\n`;
  });
  
  script += `\n## Variations\n\n`;
  
  testCase.variations.forEach((variation, index) => {
    script += `### Variation ${index + 1}: ${variation.name}\n`;
    script += `Description: ${variation.description}\n`;
    script += `Expected Result: ${variation.expectedResult}\n\n`;
    script += `| # | Step | Expected Result | Actual Result | Pass/Fail | Notes |\n`;
    script += `|---|------|-----------------|---------------|-----------|-------|\n`;
    script += `| 1 | Execute variation: ${variation.description} | ${variation.expectedResult} | | | |\n\n`;
  });
  
  script += `## Test Data\n`;
  script += `- Test User: test_user1 (TestPass123!)\n`;
  script += `- Alt Test User: test_user2 (TestPass123!)\n`;
  script += `- Test Session: SESSION001\n\n`;
  
  script += `## Test Environment\n`;
  script += `- Browser: \n`;
  script += `- OS: \n`;
  script += `- Screen Resolution: \n`;
  script += `- Device: \n\n`;
  
  script += `## Test Results\n`;
  script += `- Overall Result: [PASS/FAIL]\n`;
  script += `- Tested By: \n`;
  script += `- Test Date: \n`;
  script += `- Issues Found: \n`;
  
  return script;
}

/**
 * Generate all test scripts and save to files
 */
function generateAllTestScripts() {
  const outputDir = path.join(__dirname, 'test-scripts');
  
  // Create output directory if it doesn't exist
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }
  
  // Generate scripts for each test case
  Object.keys(testCases).forEach(testCaseId => {
    const script = generateTestScript(testCaseId);
    const outputFile = path.join(outputDir, `${testCaseId}.md`);
    
    fs.writeFileSync(outputFile, script);
    console.log(`Generated test script: ${outputFile}`);
  });
  
  console.log('All test scripts generated successfully!');
}

/**
 * Generate a specific test script
 * @param {string} testCaseId - ID of the test case
 */
function generateSingleTestScript(testCaseId) {
  const outputDir = path.join(__dirname, 'test-scripts');
  
  // Create output directory if it doesn't exist
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }
  
  const script = generateTestScript(testCaseId);
  const outputFile = path.join(outputDir, `${testCaseId}.md`);
  
  fs.writeFileSync(outputFile, script);
  console.log(`Generated test script: ${outputFile}`);
}

// Generate all scripts when run directly
if (require.main === module) {
  generateAllTestScripts();
}

module.exports = {
  generateTestScript,
  generateSingleTestScript,
  generateAllTestScripts,
  testCases
}; 