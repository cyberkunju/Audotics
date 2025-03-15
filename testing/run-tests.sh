#!/bin/bash
# Audotics Test Runner Script
# This script orchestrates running all the test scripts and collects the results

# Color codes for output formatting
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Create directories for test results and reports if they don't exist
mkdir -p ./results
mkdir -p ./reports
mkdir -p ./screenshots

# Current date and time for report naming
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
SUMMARY_REPORT="./reports/test_summary_${TIMESTAMP}.txt"
HTML_REPORT="./reports/test_summary_${TIMESTAMP}.html"

echo -e "${BLUE}=========================================${NC}"
echo -e "${BLUE}    AUDOTICS COMPREHENSIVE TEST RUNNER   ${NC}"
echo -e "${BLUE}=========================================${NC}"
echo -e "Starting tests at $(date)"
echo -e "Results will be saved to: ${SUMMARY_REPORT}\n"

# Initialize summary file
echo "# AUDOTICS TEST EXECUTION SUMMARY" > $SUMMARY_REPORT
echo "Date: $(date)" >> $SUMMARY_REPORT
echo "Environment: $(hostname)" >> $SUMMARY_REPORT
echo "" >> $SUMMARY_REPORT
echo "## TEST RESULTS" >> $SUMMARY_REPORT

# Track overall statistics
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0
SKIPPED_TESTS=0

# Function to run a test and record the result
run_test() {
    local test_name=$1
    local test_command=$2
    local test_type=$3
    local priority=$4
    
    echo -e "\n${YELLOW}Running test: ${test_name} (${priority} priority)${NC}"
    echo -e "Type: ${test_type}"
    echo -e "Command: ${test_command}"
    
    # Record start time
    local start_time=$(date +%s)
    
    # Run the test command
    eval $test_command
    local result=$?
    
    # Record end time and calculate duration
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    # Update counters
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    # Record result
    if [ $result -eq 0 ]; then
        echo -e "${GREEN}✓ PASSED${NC} (${duration}s)"
        PASSED_TESTS=$((PASSED_TESTS + 1))
        echo "- [x] ${test_name} (${priority}) - PASSED - ${duration}s" >> $SUMMARY_REPORT
    else
        echo -e "${RED}✗ FAILED${NC} (${duration}s)"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        echo "- [ ] ${test_name} (${priority}) - FAILED - ${duration}s" >> $SUMMARY_REPORT
    fi
    
    # Return the test result
    return $result
}

# Function to mark a test as skipped
skip_test() {
    local test_name=$1
    local reason=$2
    local priority=$3
    
    echo -e "\n${YELLOW}Skipping test: ${test_name} (${priority} priority)${NC}"
    echo -e "Reason: ${reason}"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    SKIPPED_TESTS=$((SKIPPED_TESTS + 1))
    
    echo "- [ ] ${test_name} (${priority}) - SKIPPED - ${reason}" >> $SUMMARY_REPORT
}

echo -e "\n${BLUE}Running Critical and High Priority Tests${NC}"
echo -e "================================================\n"

# Authentication Tests
run_test "Authentication Tests" "node ./run-automated-tests.js auth" "Functional" "Critical"
AUTH_RESULT=$?

# WebSocket & Real-time Updates
run_test "WebSocket & Real-time Updates" "npm run test:websocket" "Functional" "Critical"
WS_RESULT=$?

# Group Session Tests
run_test "Group Sessions" "node ./run-automated-tests.js group" "Functional" "Critical"
GROUP_RESULT=$?

# Recommendation Tests
run_test "ML Recommendation Tests" "npm run test:ml" "ML" "Critical"
ML_RESULT=$?

# Search Functionality Tests
run_test "Search Functionality" "node ./run-automated-tests.js search" "Functional" "Critical"
SEARCH_RESULT=$?

# Performance Benchmarks
run_test "Performance Benchmarks" "npm run test:performance" "Performance" "High"
PERF_RESULT=$?

# Playlist Management Tests
run_test "Playlist Management" "node ./run-automated-tests.js playlist" "Functional" "High"
PLAYLIST_RESULT=$?

# Spotify Integration Tests
run_test "Spotify Integration" "node ./run-automated-tests.js spotify" "Integration" "High"
SPOTIFY_RESULT=$?

echo -e "\n${BLUE}Running Medium Priority Tests${NC}"
echo -e "================================================\n"

# Cross-browser compatibility
if [ -x "$(command -v playwright)" ]; then
    run_test "Cross-browser Compatibility" "npx playwright test" "Compatibility" "Medium"
    BROWSER_RESULT=$?
else
    skip_test "Cross-browser Compatibility" "Playwright not installed" "Medium"
    BROWSER_RESULT=2
fi

# Mobile Responsiveness Tests
if [ -x "$(command -v lighthouse)" ]; then
    run_test "Mobile Responsiveness" "node ./run-mobile-tests.js" "Compatibility" "Medium"
    MOBILE_RESULT=$?
else
    skip_test "Mobile Responsiveness" "Lighthouse not installed" "Medium"
    MOBILE_RESULT=2
fi

# Accessibility Tests
if [ -x "$(command -v axe)" ]; then
    run_test "Accessibility Tests" "node ./run-accessibility-tests.js" "Accessibility" "Medium"
    A11Y_RESULT=$?
else
    skip_test "Accessibility Tests" "Axe CLI not installed" "Medium"
    A11Y_RESULT=2
fi

echo -e "\n${BLUE}Generate Summary Report${NC}"
echo -e "================================================\n"

# Add summary statistics to report
echo "" >> $SUMMARY_REPORT
echo "## SUMMARY" >> $SUMMARY_REPORT
echo "- Total Tests: ${TOTAL_TESTS}" >> $SUMMARY_REPORT
echo "- Passed: ${PASSED_TESTS}" >> $SUMMARY_REPORT
echo "- Failed: ${FAILED_TESTS}" >> $SUMMARY_REPORT
echo "- Skipped: ${SKIPPED_TESTS}" >> $SUMMARY_REPORT
echo "- Pass Rate: $(( (PASSED_TESTS * 100) / (TOTAL_TESTS - SKIPPED_TESTS) ))%" >> $SUMMARY_REPORT

# Generate HTML report
cat > $HTML_REPORT << EOF
<!DOCTYPE html>
<html>
<head>
    <title>Audotics Test Results</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; max-width: 1200px; margin: 0 auto; padding: 20px; }
        h1 { color: #1DB954; border-bottom: 2px solid #1DB954; padding-bottom: 10px; }
        h2 { color: #191414; margin-top: 20px; }
        .summary { background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
        .test-results { margin-bottom: 30px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th, td { text-align: left; padding: 10px; border-bottom: 1px solid #ddd; }
        th { background-color: #f2f2f2; }
        .passed { color: #4CAF50; font-weight: bold; }
        .failed { color: #F44336; font-weight: bold; }
        .skipped { color: #FF9800; font-weight: bold; }
        .critical { background-color: #ffebee; }
        .high { background-color: #fff8e1; }
        .medium { background-color: #f1f8e9; }
        .progress-bar { height: 20px; background-color: #f5f5f5; border-radius: 5px; margin: 10px 0; }
        .progress-bar div { height: 100%; background-color: #4CAF50; border-radius: 5px; }
    </style>
</head>
<body>
    <h1>Audotics Test Results</h1>
    <p>Date: $(date)</p>
    <p>Environment: $(hostname)</p>
    
    <div class="summary">
        <h2>Summary</h2>
        <p><strong>Total Tests:</strong> ${TOTAL_TESTS}</p>
        <p><strong>Passed:</strong> <span class="passed">${PASSED_TESTS}</span></p>
        <p><strong>Failed:</strong> <span class="failed">${FAILED_TESTS}</span></p>
        <p><strong>Skipped:</strong> <span class="skipped">${SKIPPED_TESTS}</span></p>
        <p><strong>Pass Rate:</strong> $(( (PASSED_TESTS * 100) / (TOTAL_TESTS - SKIPPED_TESTS) ))%</p>
        <div class="progress-bar">
            <div style="width: $(( (PASSED_TESTS * 100) / (TOTAL_TESTS - SKIPPED_TESTS) ))%;"></div>
        </div>
    </div>
    
    <div class="test-results">
        <h2>Critical Tests</h2>
        <table>
            <tr>
                <th>Test</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Type</th>
            </tr>
            <tr class="critical">
                <td>Authentication Tests</td>
                <td class="$([ $AUTH_RESULT -eq 0 ] && echo 'passed' || echo 'failed')">$([ $AUTH_RESULT -eq 0 ] && echo 'PASSED' || echo 'FAILED')</td>
                <td>Critical</td>
                <td>Functional</td>
            </tr>
            <tr class="critical">
                <td>WebSocket & Real-time Updates</td>
                <td class="$([ $WS_RESULT -eq 0 ] && echo 'passed' || echo 'failed')">$([ $WS_RESULT -eq 0 ] && echo 'PASSED' || echo 'FAILED')</td>
                <td>Critical</td>
                <td>Functional</td>
            </tr>
            <tr class="critical">
                <td>Group Sessions</td>
                <td class="$([ $GROUP_RESULT -eq 0 ] && echo 'passed' || echo 'failed')">$([ $GROUP_RESULT -eq 0 ] && echo 'PASSED' || echo 'FAILED')</td>
                <td>Critical</td>
                <td>Functional</td>
            </tr>
            <tr class="critical">
                <td>ML Recommendation Tests</td>
                <td class="$([ $ML_RESULT -eq 0 ] && echo 'passed' || echo 'failed')">$([ $ML_RESULT -eq 0 ] && echo 'PASSED' || echo 'FAILED')</td>
                <td>Critical</td>
                <td>ML</td>
            </tr>
            <tr class="critical">
                <td>Search Functionality</td>
                <td class="$([ $SEARCH_RESULT -eq 0 ] && echo 'passed' || echo 'failed')">$([ $SEARCH_RESULT -eq 0 ] && echo 'PASSED' || echo 'FAILED')</td>
                <td>Critical</td>
                <td>Functional</td>
            </tr>
        </table>
        
        <h2>High Priority Tests</h2>
        <table>
            <tr>
                <th>Test</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Type</th>
            </tr>
            <tr class="high">
                <td>Performance Benchmarks</td>
                <td class="$([ $PERF_RESULT -eq 0 ] && echo 'passed' || echo 'failed')">$([ $PERF_RESULT -eq 0 ] && echo 'PASSED' || echo 'FAILED')</td>
                <td>High</td>
                <td>Performance</td>
            </tr>
            <tr class="high">
                <td>Playlist Management</td>
                <td class="$([ $PLAYLIST_RESULT -eq 0 ] && echo 'passed' || echo 'failed')">$([ $PLAYLIST_RESULT -eq 0 ] && echo 'PASSED' || echo 'FAILED')</td>
                <td>High</td>
                <td>Functional</td>
            </tr>
            <tr class="high">
                <td>Spotify Integration</td>
                <td class="$([ $SPOTIFY_RESULT -eq 0 ] && echo 'passed' || echo 'failed')">$([ $SPOTIFY_RESULT -eq 0 ] && echo 'PASSED' || echo 'FAILED')</td>
                <td>High</td>
                <td>Integration</td>
            </tr>
        </table>
        
        <h2>Medium Priority Tests</h2>
        <table>
            <tr>
                <th>Test</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Type</th>
            </tr>
            <tr class="medium">
                <td>Cross-browser Compatibility</td>
                <td class="$([ $BROWSER_RESULT -eq 0 ] && echo 'passed' || ([ $BROWSER_RESULT -eq 2 ] && echo 'skipped' || echo 'failed'))">
                    $([ $BROWSER_RESULT -eq 0 ] && echo 'PASSED' || ([ $BROWSER_RESULT -eq 2 ] && echo 'SKIPPED' || echo 'FAILED'))
                </td>
                <td>Medium</td>
                <td>Compatibility</td>
            </tr>
            <tr class="medium">
                <td>Mobile Responsiveness</td>
                <td class="$([ $MOBILE_RESULT -eq 0 ] && echo 'passed' || ([ $MOBILE_RESULT -eq 2 ] && echo 'skipped' || echo 'failed'))">
                    $([ $MOBILE_RESULT -eq 0 ] && echo 'PASSED' || ([ $MOBILE_RESULT -eq 2 ] && echo 'SKIPPED' || echo 'FAILED'))
                </td>
                <td>Medium</td>
                <td>Compatibility</td>
            </tr>
            <tr class="medium">
                <td>Accessibility Tests</td>
                <td class="$([ $A11Y_RESULT -eq 0 ] && echo 'passed' || ([ $A11Y_RESULT -eq 2 ] && echo 'skipped' || echo 'failed'))">
                    $([ $A11Y_RESULT -eq 0 ] && echo 'PASSED' || ([ $A11Y_RESULT -eq 2 ] && echo 'SKIPPED' || echo 'FAILED'))
                </td>
                <td>Medium</td>
                <td>Accessibility</td>
            </tr>
        </table>
    </div>
    
    <div class="launch-recommendation">
        <h2>Launch Recommendation</h2>
        <p><strong>Status:</strong> 
            $([ $AUTH_RESULT -eq 0 ] && [ $WS_RESULT -eq 0 ] && [ $GROUP_RESULT -eq 0 ] && [ $ML_RESULT -eq 0 ] && [ $SEARCH_RESULT -eq 0 ] && 
              echo '<span class="passed">GO</span> - All critical tests passed' || 
              echo '<span class="failed">NO-GO</span> - One or more critical tests failed')
        </p>
        <p><strong>Next Steps:</strong>
            $([ $FAILED_TESTS -eq 0 ] && 
              echo 'Proceed with launch as scheduled.' || 
              echo 'Address failed tests before proceeding with launch.')
        </p>
    </div>
</body>
</html>
EOF

echo -e "${BLUE}Test execution completed.${NC}"
echo -e "Summary:"
echo -e "  Total Tests: ${BLUE}${TOTAL_TESTS}${NC}"
echo -e "  Passed: ${GREEN}${PASSED_TESTS}${NC}"
echo -e "  Failed: ${RED}${FAILED_TESTS}${NC}"
echo -e "  Skipped: ${YELLOW}${SKIPPED_TESTS}${NC}"
echo -e "  Pass Rate: ${BLUE}$(( (PASSED_TESTS * 100) / (TOTAL_TESTS - SKIPPED_TESTS) ))%${NC}"

echo -e "\nDetailed reports:"
echo -e "  Text Report: ${BLUE}${SUMMARY_REPORT}${NC}"
echo -e "  HTML Report: ${BLUE}${HTML_REPORT}${NC}"

# Launch Recommendation
if [ $AUTH_RESULT -eq 0 ] && [ $WS_RESULT -eq 0 ] && [ $GROUP_RESULT -eq 0 ] && [ $ML_RESULT -eq 0 ] && [ $SEARCH_RESULT -eq 0 ]; then
    echo -e "\n${GREEN}GO RECOMMENDATION${NC} - All critical tests passed"
else
    echo -e "\n${RED}NO-GO RECOMMENDATION${NC} - One or more critical tests failed"
fi

# Return overall success/failure
if [ $FAILED_TESTS -eq 0 ]; then
    exit 0
else
    exit 1
fi 