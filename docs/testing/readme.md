# Audotics Testing Framework

This directory contains all the testing resources for the Audotics application, including both manual and automated tests, test utilities, and reporting tools.

## Directory Structure

```
testing/
├── test-scripts/                 # Manual and automated test scripts
│   ├── real-time-updates.md      # WebSocket and real-time features test script
│   ├── recommendation-and-search.md # Recommendation system test script
│   ├── export-to-spotify.md      # Spotify export functionality test script
│   └── run-automated-tests.js    # Automated test runner for browser tests
├── run-all-tests.js              # Orchestrates running all automated tests
├── run-manual-tests.js           # Helper for executing manual tests
├── test-utils.js                 # Utilities for automated tests
├── test-utils-stubs.js           # Stub implementations of test utilities
├── ml-recommendation-test.js     # ML recommendation testing script
├── performance-testing.js        # Performance benchmarking script
├── issue-tracker.md              # Tracker for test issues and resolution
├── test-execution-plan.md        # Detailed plan for final testing phase
├── test-execution-tracker.md     # Tracks executed tests and results
├── test-results-template.md      # Template for documenting test results
├── cross-browser-testing.md      # Cross-browser testing instructions
├── ml-accuracy-testing.md        # ML accuracy validation methodology
├── run-tests.sh                  # Shell script for Linux/Mac to run tests
├── run-tests.bat                 # Batch script for Windows to run tests
├── package.json                  # NPM package for testing dependencies
└── README.md                     # This file
```

## Getting Started

### Prerequisites

- Node.js 16+ installed
- NPM 7+ installed
- Chrome browser for Puppeteer tests
- Authorization credentials for tested endpoints

### Installation

1. Install dependencies:
```bash
cd testing
npm install
```

2. Set up environment:
```bash
cp .env.example .env  # Create environment file from template
# Edit .env with appropriate values
```

## Running Tests

### Running Manual Tests

The testing framework includes an interactive helper for executing manual tests:

```bash
npm run manual-tests
```

This launches an interactive menu where you can:
- Select specific test scripts to execute
- View formatted test instructions in your browser
- Record and save test results
- Generate comprehensive test reports
- Track issues found during testing

### Running Automated Tests

#### Running All Tests

```bash
npm test
```

This will execute all automated tests and generate a comprehensive report in the `reports` directory.

#### Running Specific Test Categories

```bash
# WebSocket and real-time features tests
npm run test:websocket

# ML recommendation tests
npm run test:ml 

# Performance benchmarks
npm run test:performance

# End-to-end tests
npm run test:e2e
```

### Cross-Browser Testing

Follow the instructions in `cross-browser-testing.md` to verify compatibility across different browsers.

## ML Recommendation Testing

The ML recommendation testing framework verifies the accuracy and relevance of music recommendations:

1. Run the ML recommendation tests:
```bash
npm run test:ml
```

2. Review the results in the generated report, which will include metrics such as:
   - Recommendation accuracy
   - Diversity scores
   - Response time measurements
   - Group preference satisfaction

See `ml-accuracy-testing.md` for detailed information about the testing methodology.

## Performance Testing

Performance tests measure system responsiveness and throughput:

```bash
npm run test:performance
```

The test generates reports with metrics including:
- Response time (average, median, 95th percentile)
- Concurrent user support
- Resource utilization
- Error rates under load

## Test Results and Reporting

### Viewing Test Results

After running tests, reports are generated in the `reports` directory:
- HTML reports for human-readable results
- JSON files for programmatic consumption
- Charts visualizing key metrics

### Issue Tracking

Any issues found during testing should be:
1. Documented in `issue-tracker.md`
2. Categorized by severity (Critical, High, Medium, Low)
3. Assigned to the appropriate team member
4. Tracked through resolution

## Test Execution Workflow

1. Review `test-execution-plan.md` for the comprehensive testing approach
2. Run tests according to the plan's priority order
3. Document results in `test-execution-tracker.md`
4. Address any critical or high-priority issues immediately
5. Generate final test summary report before launch

## Troubleshooting

### Puppeteer Fails to Launch Chrome
```bash
# Solution 1: Install required dependencies
sudo apt-get install -y gconf-service libasound2 libatk1.0-0 libatk-bridge2.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgcc1 libgconf-2-4 libgdk-pixbuf2.0-0 libglib2.0-0 libgtk-3-0 libnspr4 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 ca-certificates fonts-liberation libappindicator1 libnss3 lsb-release xdg-utils wget

# Solution 2: Run Puppeteer with no-sandbox mode (use with caution)
# Edit test-utils.js and modify the puppeteer.launch() options
```

### WebSocket Tests Failing
- Verify the WebSocket server is running and accessible
- Check network firewall settings
- Ensure authentication tokens are valid

### Other Issues
For any other issues, please contact the testing team lead. 