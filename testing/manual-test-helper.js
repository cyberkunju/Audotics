#!/usr/bin/env node

/**
 * Audotics Manual Test Helper
 * 
 * Interactive CLI tool to assist testers in executing manual test cases
 * and documenting their results for the Audotics application.
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const chalk = require('chalk');
const { marked } = require('marked');
const open = require('open');

// Configure readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Test case definitions directory
const TEST_CASES_DIR = path.join(__dirname, 'manual-test-cases');
const RESULTS_DIR = path.join(__dirname, 'results', 'manual-tests');

// Ensure directories exist
if (!fs.existsSync(TEST_CASES_DIR)) {
  fs.mkdirSync(TEST_CASES_DIR, { recursive: true });
}

if (!fs.existsSync(RESULTS_DIR)) {
  fs.mkdirSync(RESULTS_DIR, { recursive: true });
}

// Current test session information
const session = {
  tester: '',
  testCase: null,
  currentStep: 0,
  results: [],
  startTime: null,
  notes: []
};

/**
 * Display welcome message and instructions
 */
function showWelcome() {
  console.clear();
  console.log(chalk.blue('='.repeat(80)));
  console.log(chalk.blue.bold('      AUDOTICS MANUAL TEST HELPER'));
  console.log(chalk.blue('='.repeat(80)));
  console.log();
  console.log('This tool will guide you through manual test cases for the Audotics application.');
  console.log('It will help you record your test results and document any issues found.');
  console.log();
  console.log(chalk.cyan('Instructions:'));
  console.log('  1. Select a test case to execute');
  console.log('  2. Follow the test steps displayed on screen');
  console.log('  3. For each step, indicate if it passed, failed, or was skipped');
  console.log('  4. Add notes or observations when prompted');
  console.log('  5. A summary report will be generated upon completion');
  console.log();
}

/**
 * Prompt for tester name
 */
function promptTesterName() {
  rl.question(chalk.yellow('Enter your name: '), (name) => {
    if (!name.trim()) {
      console.log(chalk.red('Name is required. Please try again.'));
      return promptTesterName();
    }
    
    session.tester = name.trim();
    listTestCases();
  });
}

/**
 * List available test cases for selection
 */
function listTestCases() {
  console.clear();
  console.log(chalk.blue('Available Test Cases:'));
  console.log(chalk.blue('='.repeat(80)));
  
  // Check if test cases directory exists and has files
  if (!fs.existsSync(TEST_CASES_DIR)) {
    console.log(chalk.yellow('\nNo test cases found. Creating example test cases...'));
    createExampleTestCases();
  }
  
  const testCaseFiles = fs.readdirSync(TEST_CASES_DIR)
    .filter(file => file.endsWith('.json'))
    .sort();
  
  if (testCaseFiles.length === 0) {
    console.log(chalk.yellow('\nNo test cases found. Creating example test cases...'));
    createExampleTestCases();
    return listTestCases();
  }
  
  const testCases = testCaseFiles.map((file, index) => {
    try {
      const testCase = JSON.parse(
        fs.readFileSync(path.join(TEST_CASES_DIR, file), 'utf8')
      );
      
      return {
        id: index + 1,
        filename: file,
        name: testCase.name,
        description: testCase.description,
        steps: testCase.steps.length
      };
    } catch (error) {
      return {
        id: index + 1,
        filename: file,
        name: `Error: ${error.message}`,
        description: 'Invalid test case file',
        steps: 0
      };
    }
  });
  
  testCases.forEach(testCase => {
    console.log(`${chalk.green(testCase.id)}. ${chalk.white.bold(testCase.name)}`);
    console.log(`   ${testCase.description}`);
    console.log(`   ${chalk.blue(`Steps: ${testCase.steps}`)} - ${chalk.gray(testCase.filename)}`);
    console.log();
  });
  
  console.log(`${chalk.green('0')}. Exit`);
  console.log();
  
  promptTestCaseSelection(testCases);
}

/**
 * Prompt for test case selection
 * @param {Array} testCases - List of available test cases
 */
function promptTestCaseSelection(testCases) {
  rl.question(chalk.yellow('Select a test case number: '), (answer) => {
    const selection = parseInt(answer.trim(), 10);
    
    if (isNaN(selection)) {
      console.log(chalk.red('Invalid selection. Please enter a number.'));
      return promptTestCaseSelection(testCases);
    }
    
    if (selection === 0) {
      console.log(chalk.yellow('Exiting...'));
      return rl.close();
    }
    
    const selectedCase = testCases.find(tc => tc.id === selection);
    
    if (!selectedCase) {
      console.log(chalk.red('Invalid selection. Please try again.'));
      return promptTestCaseSelection(testCases);
    }
    
    loadTestCase(selectedCase.filename);
  });
}

/**
 * Load selected test case from file
 * @param {string} filename - Test case filename
 */
function loadTestCase(filename) {
  try {
    const filePath = path.join(TEST_CASES_DIR, filename);
    const testCase = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    // Initialize session
    session.testCase = testCase;
    session.currentStep = 0;
    session.results = new Array(testCase.steps.length).fill(null);
    session.startTime = new Date();
    session.notes = [];
    
    // Begin test execution
    runTest();
  } catch (error) {
    console.log(chalk.red(`Error loading test case: ${error.message}`));
    rl.question(chalk.yellow('Press Enter to continue...'), () => {
      listTestCases();
    });
  }
}

/**
 * Execute the current test case
 */
function runTest() {
  console.clear();
  
  const testCase = session.testCase;
  
  // Display test case header
  console.log(chalk.blue('='.repeat(80)));
  console.log(chalk.blue.bold(`TEST CASE: ${testCase.name}`));
  console.log(chalk.blue('='.repeat(80)));
  console.log();
  console.log(`${chalk.white.bold('Description:')} ${testCase.description}`);
  console.log(`${chalk.white.bold('Prerequisites:')} ${testCase.prerequisites || 'None'}`);
  console.log(`${chalk.white.bold('Tester:')} ${session.tester}`);
  console.log(`${chalk.white.bold('Date:')} ${new Date().toLocaleString()}`);
  console.log();
  
  // Display progress
  console.log(chalk.blue(`Progress: ${session.currentStep + 1}/${testCase.steps.length} steps`));
  console.log(chalk.blue('='.repeat(80)));
  console.log();
  
  // If we've gone through all steps, show summary
  if (session.currentStep >= testCase.steps.length) {
    return showTestSummary();
  }
  
  // Display current step
  const currentStep = testCase.steps[session.currentStep];
  console.log(chalk.green.bold(`Step ${session.currentStep + 1}: ${currentStep.action}`));
  console.log(chalk.white(`Expected Result: ${currentStep.expected}`));
  
  if (currentStep.notes) {
    console.log(chalk.yellow(`Notes: ${currentStep.notes}`));
  }
  
  if (currentStep.screenshot) {
    console.log(chalk.cyan(`📸 Screenshot reference: ${currentStep.screenshot}`));
  }
  
  console.log();
  console.log(chalk.blue('='.repeat(80)));
  console.log();
  console.log(chalk.cyan('Options:'));
  console.log(`  ${chalk.green('P')} - Pass   ${chalk.red('F')} - Fail   ${chalk.yellow('S')} - Skip   ${chalk.blue('N')} - Add Note   ${chalk.magenta('Q')} - Quit Test`);
  console.log();
  
  promptStepResult();
}

/**
 * Prompt for step result
 */
function promptStepResult() {
  rl.question(chalk.yellow('Enter result (P/F/S/N/Q): '), (answer) => {
    const response = answer.trim().toUpperCase();
    
    switch (response) {
      case 'P':
        recordStepResult('PASS');
        break;
      case 'F':
        recordStepResult('FAIL');
        promptStepNote('Describe the failure: ');
        break;
      case 'S':
        recordStepResult('SKIP');
        promptStepNote('Reason for skipping: ');
        break;
      case 'N':
        promptStepNote('Add note: ');
        break;
      case 'Q':
        rl.question(chalk.red('Are you sure you want to quit this test? (y/n): '), (confirm) => {
          if (confirm.trim().toLowerCase() === 'y') {
            console.log(chalk.yellow('Test aborted.'));
            rl.question(chalk.yellow('Press Enter to return to test selection...'), () => {
              listTestCases();
            });
          } else {
            promptStepResult();
          }
        });
        break;
      default:
        console.log(chalk.red('Invalid option. Please enter P, F, S, N, or Q.'));
        promptStepResult();
    }
  });
}

/**
 * Record step result and advance to next step
 * @param {string} result - Step result (PASS/FAIL/SKIP)
 */
function recordStepResult(result) {
  session.results[session.currentStep] = result;
  console.log(chalk.blue(`Result recorded: ${result}`));
  
  session.currentStep++;
  runTest();
}

/**
 * Prompt for additional note
 * @param {string} prompt - Prompt text
 */
function promptStepNote(prompt) {
  rl.question(chalk.cyan(prompt), (note) => {
    if (note.trim()) {
      session.notes.push({
        step: session.currentStep + 1,
        note: note.trim()
      });
      console.log(chalk.blue('Note recorded.'));
    }
    
    // If this was called after recording a result, we don't need to prompt again
    if (session.results[session.currentStep] !== null) {
      runTest();
    } else {
      promptStepResult();
    }
  });
}

/**
 * Show test summary and save results
 */
function showTestSummary() {
  console.clear();
  console.log(chalk.blue('='.repeat(80)));
  console.log(chalk.blue.bold('TEST SUMMARY'));
  console.log(chalk.blue('='.repeat(80)));
  console.log();
  
  // Test case information
  console.log(chalk.white.bold(`Test Case: ${session.testCase.name}`));
  console.log(chalk.white(`Tester: ${session.tester}`));
  
  // Calculate execution time
  const endTime = new Date();
  const executionTime = (endTime - session.startTime) / 1000;
  console.log(chalk.white(`Date: ${endTime.toLocaleString()}`));
  console.log(chalk.white(`Execution Time: ${executionTime.toFixed(2)} seconds`));
  console.log();
  
  // Calculate statistics
  const stats = {
    total: session.results.length,
    pass: session.results.filter(r => r === 'PASS').length,
    fail: session.results.filter(r => r === 'FAIL').length,
    skip: session.results.filter(r => r === 'SKIP').length
  };
  
  stats.passRate = (stats.pass / (stats.total - stats.skip)) * 100 || 0;
  
  // Display statistics
  console.log(chalk.blue('Results Summary:'));
  console.log(`Total Steps: ${stats.total}`);
  console.log(`${chalk.green(`Passed: ${stats.pass}`)} | ${chalk.red(`Failed: ${stats.fail}`)} | ${chalk.yellow(`Skipped: ${stats.skip}`)}`);
  console.log(`${chalk.cyan(`Pass Rate: ${stats.passRate.toFixed(2)}%`)}`);
  console.log();
  
  // Display detailed results
  console.log(chalk.blue('Step Results:'));
  session.testCase.steps.forEach((step, index) => {
    const result = session.results[index];
    let resultText;
    
    switch (result) {
      case 'PASS':
        resultText = chalk.green('PASS');
        break;
      case 'FAIL':
        resultText = chalk.red('FAIL');
        break;
      case 'SKIP':
        resultText = chalk.yellow('SKIP');
        break;
      default:
        resultText = chalk.gray('No Result');
    }
    
    console.log(`Step ${index + 1}: ${resultText} - ${step.action}`);
    
    // Display notes for this step
    const stepNotes = session.notes.filter(n => n.step === index + 1);
    if (stepNotes.length > 0) {
      stepNotes.forEach(note => {
        console.log(`  ${chalk.cyan(`Note: ${note.note}`)}`);
      });
    }
  });
  
  console.log();
  
  // Save results
  const reportPath = saveTestResults(stats);
  
  console.log(chalk.blue('='.repeat(80)));
  console.log();
  console.log(chalk.green(`Test results saved to: ${reportPath}`));
  console.log();
  
  rl.question(chalk.yellow('Would you like to view the HTML report? (y/n): '), async (answer) => {
    if (answer.trim().toLowerCase() === 'y') {
      await open(reportPath);
    }
    
    rl.question(chalk.yellow('Press Enter to return to test selection...'), () => {
      listTestCases();
    });
  });
}

/**
 * Save test results to file
 * @param {Object} stats - Test statistics
 * @returns {string} - Path to saved report
 */
function saveTestResults(stats) {
  const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\..+/g, '');
  const testCaseName = session.testCase.name.replace(/[^a-z0-9]/gi, '-').toLowerCase();
  const filename = `${testCaseName}-${timestamp}`;
  
  // Create results object
  const results = {
    testCase: session.testCase.name,
    testId: session.testCase.id,
    tester: session.tester,
    timestamp: new Date().toISOString(),
    executionTime: (new Date() - session.startTime) / 1000,
    stats,
    stepResults: session.testCase.steps.map((step, index) => ({
      step: index + 1,
      action: step.action,
      expected: step.expected,
      result: session.results[index],
      notes: session.notes.filter(n => n.step === index + 1).map(n => n.note)
    }))
  };
  
  // Save JSON results
  const jsonPath = path.join(RESULTS_DIR, `${filename}.json`);
  fs.writeFileSync(jsonPath, JSON.stringify(results, null, 2));
  
  // Generate HTML report
  const htmlPath = path.join(RESULTS_DIR, `${filename}.html`);
  const htmlContent = generateHTMLReport(results);
  fs.writeFileSync(htmlPath, htmlContent);
  
  return htmlPath;
}

/**
 * Generate HTML report from test results
 * @param {Object} results - Test results
 * @returns {string} - HTML content
 */
function generateHTMLReport(results) {
  // Determine overall test status
  const status = results.stats.fail > 0 ? 'FAILED' : 'PASSED';
  const statusColor = status === 'PASSED' ? '#28a745' : '#dc3545';
  
  // Create summary table
  const summaryTable = `
    <table class="summary-table">
      <tr>
        <th>Test Case</th>
        <td>${results.testCase}</td>
      </tr>
      <tr>
        <th>Test ID</th>
        <td>${results.testId || 'N/A'}</td>
      </tr>
      <tr>
        <th>Tester</th>
        <td>${results.tester}</td>
      </tr>
      <tr>
        <th>Date</th>
        <td>${new Date(results.timestamp).toLocaleString()}</td>
      </tr>
      <tr>
        <th>Execution Time</th>
        <td>${results.executionTime.toFixed(2)} seconds</td>
      </tr>
      <tr>
        <th>Status</th>
        <td style="font-weight: bold; color: ${statusColor}">${status}</td>
      </tr>
    </table>
  `;
  
  // Create statistics table
  const statsTable = `
    <table class="stats-table">
      <tr>
        <th>Total Steps</th>
        <th>Passed</th>
        <th>Failed</th>
        <th>Skipped</th>
        <th>Pass Rate</th>
      </tr>
      <tr>
        <td>${results.stats.total}</td>
        <td style="color: #28a745">${results.stats.pass}</td>
        <td style="color: #dc3545">${results.stats.fail}</td>
        <td style="color: #ffc107">${results.stats.skip}</td>
        <td>${results.stats.passRate.toFixed(2)}%</td>
      </tr>
    </table>
  `;
  
  // Create detailed results table
  const detailedResults = results.stepResults.map(step => {
    // Determine result styling
    let resultStyle = '';
    let resultText = step.result || 'NO RESULT';
    
    switch (step.result) {
      case 'PASS':
        resultStyle = 'color: #28a745; font-weight: bold;';
        break;
      case 'FAIL':
        resultStyle = 'color: #dc3545; font-weight: bold;';
        break;
      case 'SKIP':
        resultStyle = 'color: #ffc107; font-weight: bold;';
        break;
    }
    
    // Format notes
    const notes = step.notes && step.notes.length > 0
      ? `<div class="notes"><strong>Notes:</strong><ul>${step.notes.map(note => `<li>${note}</li>`).join('')}</ul></div>`
      : '';
    
    return `
      <tr>
        <td>${step.step}</td>
        <td>${step.action}</td>
        <td>${step.expected}</td>
        <td style="${resultStyle}">${resultText}</td>
        <td>${notes}</td>
      </tr>
    `;
  }).join('');
  
  const detailedTable = `
    <table class="detailed-table">
      <tr>
        <th>#</th>
        <th>Action</th>
        <th>Expected Result</th>
        <th>Actual Result</th>
        <th>Notes</th>
      </tr>
      ${detailedResults}
    </table>
  `;
  
  // Create complete HTML report
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Audotics Test Report - ${results.testCase}</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
        }
        h1, h2, h3 {
          color: #2c3e50;
        }
        .header {
          background-color: #2c3e50;
          color: white;
          padding: 20px;
          border-radius: 5px;
          margin-bottom: 20px;
        }
        .status-badge {
          display: inline-block;
          padding: 8px 12px;
          border-radius: 4px;
          font-weight: bold;
          margin-left: 10px;
          background-color: ${statusColor};
          color: white;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
        }
        th, td {
          border: 1px solid #ddd;
          padding: 12px;
        }
        th {
          background-color: #f8f9fa;
          text-align: left;
        }
        .summary-table th {
          width: 200px;
        }
        .stats-table {
          text-align: center;
        }
        .detailed-table tr:hover {
          background-color: #f8f9fa;
        }
        .notes {
          margin-top: 8px;
        }
        .notes ul {
          margin: 5px 0;
          padding-left: 20px;
        }
        .footer {
          text-align: center;
          margin-top: 30px;
          padding-top: 10px;
          border-top: 1px solid #eee;
          color: #777;
          font-size: 14px;
        }
        @media print {
          body {
            padding: 0;
          }
          .header {
            background-color: white !important;
            color: black !important;
            padding: 0;
          }
          .status-badge {
            border: 1px solid #ddd;
          }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Audotics Test Report <span class="status-badge">${status}</span></h1>
        <p>Generated on ${new Date(results.timestamp).toLocaleString()}</p>
      </div>
      
      <h2>Test Summary</h2>
      ${summaryTable}
      
      <h2>Results Statistics</h2>
      ${statsTable}
      
      <h2>Detailed Results</h2>
      ${detailedTable}
      
      <div class="footer">
        <p>Audotics Testing Framework - Manual Test Helper</p>
      </div>
    </body>
    </html>
  `;
}

/**
 * Create example test cases if none exist
 */
function createExampleTestCases() {
  const authTestCase = {
    id: "AUTH-001",
    name: "User Authentication Test",
    description: "Verify that users can register, login, and logout successfully",
    prerequisites: "Clean browser state (no existing login sessions)",
    steps: [
      {
        action: "Navigate to the Audotics login page",
        expected: "Login page loads with username and password fields",
        notes: "URL should be https://test.audotics.com/login"
      },
      {
        action: "Click on 'Register' link or button",
        expected: "Registration form appears with required fields",
        notes: "Fields should include email, password, confirm password, and terms agreement"
      },
      {
        action: "Enter valid registration information and submit",
        expected: "Registration succeeds and user is redirected to the dashboard or profile setup",
        notes: "Use a test email like testuser-[timestamp]@example.com"
      },
      {
        action: "Logout by clicking on user profile and selecting 'Logout'",
        expected: "User is logged out and returned to the login page",
        notes: null
      },
      {
        action: "Login with the newly created credentials",
        expected: "Login succeeds and user is redirected to the dashboard",
        notes: null
      },
      {
        action: "Verify personalized content is visible",
        expected: "Dashboard shows personalized content for the logged-in user",
        notes: "Look for user name or welcome message"
      },
      {
        action: "Test incorrect password",
        expected: "Error message appears without revealing which field is incorrect",
        notes: "Security best practice: don't reveal if username exists"
      },
      {
        action: "Test 'Forgot Password' functionality",
        expected: "Reset password screen appears and accepts email address",
        notes: "Don't actually send reset emails in test environment"
      },
      {
        action: "Logout again",
        expected: "User is logged out successfully",
        notes: null
      }
    ]
  };
  
  const groupSessionTestCase = {
    id: "GROUP-001",
    name: "Group Session Functionality Test",
    description: "Verify that group sessions can be created and joined, with real-time updates",
    prerequisites: "At least one test user account logged in",
    steps: [
      {
        action: "Navigate to the Audotics dashboard",
        expected: "Dashboard loads with a 'Create Session' or similar option",
        notes: null
      },
      {
        action: "Click on 'Create Session' button",
        expected: "Session creation form appears",
        notes: null
      },
      {
        action: "Fill in session details and create session",
        expected: "New session is created and user is redirected to session page",
        notes: "Note the session code for later use"
      },
      {
        action: "Verify that session shows host controls",
        expected: "Host-specific controls are visible (invite, settings, etc.)",
        notes: null
      },
      {
        action: "Use another browser or incognito window to navigate to Join Session",
        expected: "Join session screen appears with code input",
        notes: "You'll need to login with a different test account"
      },
      {
        action: "Enter the session code from step 3",
        expected: "Second user successfully joins the session",
        notes: null
      },
      {
        action: "As host, add a track to the session",
        expected: "Track appears for both users in real time",
        notes: "May need to wait briefly for WebSocket update"
      },
      {
        action: "Test chat functionality between users",
        expected: "Messages appear for both users in real time",
        notes: null
      },
      {
        action: "Test recommendation feature for the group",
        expected: "System generates recommendations that blend preferences",
        notes: "This may take a moment as the ML system processes"
      },
      {
        action: "End the session as host",
        expected: "Session ends for all participants",
        notes: null
      }
    ]
  };
  
  // Create the example test case files
  fs.writeFileSync(
    path.join(TEST_CASES_DIR, 'auth-001.json'),
    JSON.stringify(authTestCase, null, 2)
  );
  
  fs.writeFileSync(
    path.join(TEST_CASES_DIR, 'group-001.json'),
    JSON.stringify(groupSessionTestCase, null, 2)
  );
  
  console.log(chalk.green('Created example test cases.'));
}

// Start the application
showWelcome();
promptTesterName();

// Handle exit
process.on('SIGINT', () => {
  console.log(chalk.yellow('\nExiting Audotics Manual Test Helper...'));
  rl.close();
  process.exit(0);
}); 