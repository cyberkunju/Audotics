/**
 * Audotics Manual Test Execution Helper
 * 
 * This script helps coordinate the execution of manual tests,
 * provides a guided interface for testing, and generates reports
 * based on test results.
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const marked = require('marked');
const open = require('open');
const chalk = require('chalk');

// Configuration
const config = {
  testsDir: path.join(__dirname, 'test-scripts'),
  resultsDir: path.join(__dirname, 'results'),
  reportDir: path.join(__dirname, 'reports'),
  issueTrackerPath: path.join(__dirname, 'issue-tracker.md'),
  testScripts: [
    { name: 'real-time-updates.md', label: 'WebSocket & Real-time Updates' },
    { name: 'recommendation-and-search.md', label: 'Recommendation & Search' },
    { name: 'export-to-spotify.md', label: 'Spotify Export' }
  ]
};

// Create necessary directories
[config.resultsDir, config.reportDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

/**
 * Main menu for test execution
 */
function showMainMenu() {
  console.clear();
  console.log(chalk.blue.bold('=============================================='));
  console.log(chalk.blue.bold('       AUDOTICS MANUAL TEST COORDINATOR       '));
  console.log(chalk.blue.bold('=============================================='));
  console.log('');
  console.log(chalk.yellow('Available Test Scripts:'));
  
  config.testScripts.forEach((script, index) => {
    console.log(`${index + 1}. ${script.label}`);
  });
  
  console.log('');
  console.log('A. View all test results');
  console.log('I. Open issue tracker');
  console.log('R. Generate summary report');
  console.log('Q. Exit');
  console.log('');
  
  rl.question('Enter your choice: ', (answer) => {
    if (answer.toLowerCase() === 'q') {
      rl.close();
      return;
    } else if (answer.toLowerCase() === 'a') {
      viewTestResults();
      return;
    } else if (answer.toLowerCase() === 'i') {
      openIssueTracker();
      return;
    } else if (answer.toLowerCase() === 'r') {
      generateSummaryReport();
      return;
    }
    
    const scriptIndex = parseInt(answer) - 1;
    if (isNaN(scriptIndex) || scriptIndex < 0 || scriptIndex >= config.testScripts.length) {
      console.log(chalk.red('Invalid choice. Please try again.'));
      setTimeout(showMainMenu, 2000);
      return;
    }
    
    const selectedScript = config.testScripts[scriptIndex];
    executeTest(selectedScript);
  });
}

/**
 * Execute a specific test
 */
function executeTest(scriptInfo) {
  console.clear();
  console.log(chalk.blue.bold(`Executing: ${scriptInfo.label}`));
  console.log('');
  
  // Read the test script
  const scriptPath = path.join(config.testsDir, scriptInfo.name);
  const scriptContent = fs.readFileSync(scriptPath, 'utf8');
  
  // Display test information
  console.log(chalk.yellow('Test Description:'));
  
  // Extract description section
  const descriptionMatch = scriptContent.match(/## Description\s+([\s\S]*?)(?=##|$)/);
  if (descriptionMatch && descriptionMatch[1]) {
    console.log(descriptionMatch[1].trim());
  }
  
  console.log('');
  console.log(chalk.yellow('Preconditions:'));
  
  // Extract preconditions section
  const preconditionsMatch = scriptContent.match(/## Preconditions\s+([\s\S]*?)(?=##|$)/);
  if (preconditionsMatch && preconditionsMatch[1]) {
    console.log(preconditionsMatch[1].trim());
  }
  
  console.log('');
  console.log(chalk.green('Opening test script in browser for execution...'));
  
  // Generate HTML version of the script for better readability
  const htmlPath = path.join(config.resultsDir, `${scriptInfo.name.replace('.md', '.html')}`);
  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Audotics - ${scriptInfo.label} Test</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; max-width: 1000px; margin: 0 auto; padding: 20px; }
        h1 { color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px; }
        h2 { color: #2980b9; }
        table { border-collapse: collapse; width: 100%; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
        th { background-color: #f2f2f2; }
        .test-results { background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin-top: 20px; }
        .pass { color: green; }
        .fail { color: red; }
      </style>
    </head>
    <body>
      <div class="content">
        ${marked.parse(scriptContent)}
      </div>
      <div class="test-results">
        <h2>Test Results</h2>
        <form id="testResultForm">
          <p>Overall Result: 
            <label><input type="radio" name="result" value="PASS"> PASS</label>
            <label><input type="radio" name="result" value="FAIL"> FAIL</label>
          </p>
          <p>
            <label for="tester">Tested By:</label>
            <input type="text" id="tester" name="tester" style="width: 200px;">
          </p>
          <p>
            <label for="issues">Issues Found:</label><br>
            <textarea id="issues" name="issues" rows="5" style="width: 100%;"></textarea>
          </p>
          <p>
            <button type="button" onclick="saveResults()">Save Results</button>
          </p>
        </form>
      </div>
      <script>
        function saveResults() {
          const result = document.querySelector('input[name="result"]:checked')?.value;
          const tester = document.getElementById('tester').value;
          const issues = document.getElementById('issues').value;
          
          if (!result || !tester) {
            alert('Please complete all required fields.');
            return;
          }
          
          const data = {
            result,
            tester,
            issues,
            date: new Date().toISOString(),
            script: "${scriptInfo.name}"
          };
          
          // Save results to file via download
          const blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'});
          const a = document.createElement('a');
          a.download = "${scriptInfo.name.replace('.md', '-results.json')}";
          a.href = URL.createObjectURL(blob);
          a.click();
          
          alert('Test results saved! Please move the downloaded file to the "testing/results" directory.');
        }
      </script>
    </body>
    </html>
  `;
  
  fs.writeFileSync(htmlPath, htmlContent);
  
  // Open in browser
  open(htmlPath);
  
  rl.question('\nPress Enter when you have completed the test to return to the main menu...', () => {
    showMainMenu();
  });
}

/**
 * View all test results
 */
function viewTestResults() {
  console.clear();
  console.log(chalk.blue.bold('=============================================='));
  console.log(chalk.blue.bold('           AUDOTICS TEST RESULTS              '));
  console.log(chalk.blue.bold('=============================================='));
  console.log('');
  
  // Read all result files
  const resultFiles = fs.readdirSync(config.resultsDir)
    .filter(file => file.endsWith('-results.json'));
  
  if (resultFiles.length === 0) {
    console.log(chalk.yellow('No test results found yet.'));
    rl.question('\nPress Enter to return to the main menu...', showMainMenu);
    return;
  }
  
  console.log(chalk.yellow('Test Results Summary:'));
  console.log('');
  
  resultFiles.forEach(file => {
    try {
      const resultPath = path.join(config.resultsDir, file);
      const resultData = JSON.parse(fs.readFileSync(resultPath, 'utf8'));
      
      // Find matching test script
      const scriptInfo = config.testScripts.find(s => s.name === resultData.script);
      const label = scriptInfo ? scriptInfo.label : resultData.script;
      
      // Display result
      const resultColor = resultData.result === 'PASS' ? chalk.green : chalk.red;
      console.log(`${chalk.cyan(label)}: ${resultColor(resultData.result)}`);
      console.log(`  Tested by: ${resultData.tester} on ${new Date(resultData.date).toLocaleString()}`);
      
      if (resultData.issues && resultData.issues.trim()) {
        console.log(chalk.yellow('  Issues:'));
        console.log(`  ${resultData.issues.replace(/\n/g, '\n  ')}`);
      }
      
      console.log('');
    } catch (error) {
      console.log(chalk.red(`Error reading result file ${file}: ${error.message}`));
    }
  });
  
  rl.question('Press Enter to return to the main menu...', showMainMenu);
}

/**
 * Open issue tracker
 */
function openIssueTracker() {
  console.log(chalk.green('Opening issue tracker...'));
  open(config.issueTrackerPath);
  setTimeout(showMainMenu, 1000);
}

/**
 * Generate a summary report of all test results
 */
function generateSummaryReport() {
  console.clear();
  console.log(chalk.blue.bold('Generating Test Summary Report...'));
  
  // Read all result files
  const resultFiles = fs.readdirSync(config.resultsDir)
    .filter(file => file.endsWith('-results.json'));
  
  if (resultFiles.length === 0) {
    console.log(chalk.yellow('No test results found yet.'));
    rl.question('\nPress Enter to return to the main menu...', showMainMenu);
    return;
  }
  
  const results = resultFiles.map(file => {
    try {
      const resultPath = path.join(config.resultsDir, file);
      return JSON.parse(fs.readFileSync(resultPath, 'utf8'));
    } catch (error) {
      console.log(chalk.red(`Error reading result file ${file}: ${error.message}`));
      return null;
    }
  }).filter(Boolean);
  
  // Generate summary statistics
  const totalTests = results.length;
  const passedTests = results.filter(r => r.result === 'PASS').length;
  const failedTests = totalTests - passedTests;
  const passRate = totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0;
  
  // Generate report content
  const reportDate = new Date().toISOString().split('T')[0];
  const reportName = `test-summary-${reportDate}.html`;
  const reportPath = path.join(config.reportDir, reportName);
  
  const reportContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Audotics - Test Summary Report</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; max-width: 1000px; margin: 0 auto; padding: 20px; }
        h1 { color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px; }
        h2 { color: #2980b9; }
        .summary { background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0; }
        .progress-bar { height: 20px; background-color: #e9ecef; border-radius: 5px; margin: 10px 0; }
        .progress-bar div { height: 100%; border-radius: 5px; background-color: #4caf50; width: ${passRate}%; }
        table { border-collapse: collapse; width: 100%; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
        th { background-color: #f2f2f2; }
        .pass { color: green; }
        .fail { color: red; }
      </style>
    </head>
    <body>
      <h1>Audotics Test Summary Report</h1>
      <p>Generated: ${new Date().toLocaleString()}</p>
      
      <div class="summary">
        <h2>Overall Summary</h2>
        <p>Total Tests: ${totalTests}</p>
        <p>Passed: <span class="pass">${passedTests}</span></p>
        <p>Failed: <span class="fail">${failedTests}</span></p>
        <p>Pass Rate: ${passRate}%</p>
        <div class="progress-bar"><div></div></div>
      </div>
      
      <h2>Test Results Details</h2>
      <table>
        <thead>
          <tr>
            <th>Test</th>
            <th>Result</th>
            <th>Tested By</th>
            <th>Date</th>
            <th>Issues</th>
          </tr>
        </thead>
        <tbody>
          ${results.map(result => {
            const scriptInfo = config.testScripts.find(s => s.name === result.script);
            const label = scriptInfo ? scriptInfo.label : result.script;
            return `
              <tr>
                <td>${label}</td>
                <td class="${result.result.toLowerCase()}">${result.result}</td>
                <td>${result.tester}</td>
                <td>${new Date(result.date).toLocaleString()}</td>
                <td>${result.issues || 'None'}</td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
      
      <h2>Launch Readiness Assessment</h2>
      <div>
        <p><strong>Status:</strong> ${passRate >= 90 ? 
          '<span class="pass">READY FOR LAUNCH</span>' : 
          '<span class="fail">NOT READY - Critical tests failing</span>'
        }</p>
        <p><strong>Recommendation:</strong> ${
          passRate >= 90 ? 
          'All critical tests are passing. The application is ready for launch.' : 
          'Some critical tests are failing. Fix the issues before proceeding with launch.'
        }</p>
      </div>
    </body>
    </html>
  `;
  
  fs.writeFileSync(reportPath, reportContent);
  
  console.log(chalk.green(`Report generated at: ${reportPath}`));
  open(reportPath);
  
  rl.question('\nPress Enter to return to the main menu...', showMainMenu);
}

// Start the application
console.log(chalk.yellow('Starting Audotics Manual Test Coordinator...'));
setTimeout(showMainMenu, 1000); 