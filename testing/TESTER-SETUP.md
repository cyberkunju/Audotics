# Audotics Tester Setup Guide

## Introduction
This guide will help you set up your environment for testing the Audotics application before the March 5th, 2025 launch. Please follow these steps carefully to ensure a smooth testing process.

## Prerequisites
- A computer with Windows, macOS, or Linux
- Node.js (version 16.0.0 or higher)
- npm (version 7.0.0 or higher)
- Git
- Modern web browsers (Chrome, Firefox, Safari, Edge)
- Access to the Audotics testing environment

## Step 1: Clone the Repository

```bash
# Clone the repository
git clone https://github.com/yourorginization/audotics.git

# Navigate to the project directory
cd audotics
```

## Step 2: Set Up Environment Variables

Create a `.env.test` file in the project root with the following content:

```
API_URL=https://api-test.audotics.com
WEBSOCKET_URL=wss://ws-test.audotics.com
NODE_ENV=testing
DEBUG=true
```

## Step 3: Install Dependencies

```bash
# Install project dependencies
npm install

# Install testing dependencies
cd testing
npm install
```

## Step 4: Configure Test Accounts

The test accounts are already set up in the test environment. You can find the credentials in the [Test Data & Environments](./test-execution-summary.md#test-data--environments) section of the test execution summary.

For Spotify integration testing, you'll need to:
1. Request access to the Spotify test accounts from the Test Coordinator
2. Check the password manager for current credentials
3. Ensure the Spotify test accounts have sufficient content for testing

## Step 5: Install Additional Testing Tools

### For Automated Testing

```bash
# Install Puppeteer globally (for browser automation)
npm install -g puppeteer

# Install Artillery globally (for load testing)
npm install -g artillery
```

### For Accessibility Testing

```bash
# Install Axe CLI globally
npm install -g @axe-core/cli
```

### For Cross-Browser Testing

```bash
# Install Playwright
npx playwright install
# This will install browsers too
```

## Step 6: Set Up Mobile Testing Environment (Optional)

For mobile testing, you can use:
- Real devices (preferred for final verification)
- Browser developer tools mobile emulation
- BrowserStack or similar service (credentials in password manager)

## Step 7: Connect to Test Environment

1. Request VPN access from IT department if testing remotely
2. Connect to the test environment VPN using provided credentials
3. Verify access by navigating to https://test.audotics.com in your browser

## Step 8: Verify Testing Tools

Run the following commands to verify that your testing tools are correctly set up:

```bash
# Navigate to the testing directory
cd testing

# Check if shell script is executable (Linux/macOS only)
chmod +x run-tests.sh

# Run a simple test to verify setup
npm run test:verify
```

You should see output confirming that the test environment is correctly set up.

## Step 9: Familiarize Yourself with Testing Documentation

Review the following documents:
- [Test Execution Summary](./test-execution-summary.md)
- [Test Execution Plan](./test-execution-plan.md)
- Specific test scripts assigned to you

## Step 10: Join Communication Channels

Join the following communication channels for the testing phase:
- Slack channel: #audotics-launch-testing
- Video conference link for status meetings: [LINK]
- Emergency contact: #audotics-launch-911

## Troubleshooting

### Dependency Installation Issues
If you encounter issues installing dependencies:

```bash
# Clear npm cache
npm cache clean --force

# Try installation with verbose logging
npm install --verbose
```

### Test Environment Connection Issues
If you cannot connect to the test environment:
1. Verify VPN connection
2. Check firewall settings
3. Contact IT support at it-support@audotics.com

### Automated Testing Issues
If automated tests fail to run:

```bash
# Check Node.js version
node --version

# Check npm version
npm --version

# Update your Node.js if below v16.0.0
```

### WebSocket Testing Issues
If WebSocket connection fails:
1. Verify browser WebSocket support
2. Check network settings for any WebSocket restrictions
3. Ensure proper authentication before WebSocket connection

## Contact Information

If you encounter any issues during setup:
- Test Coordinator: [NAME] - [CONTACT]
- Technical Support: [EMAIL]
- Slack Channel: #audotics-testing-support

## Next Steps

After completing this setup:
1. Check the [Test Execution Tracker](./test-execution-tracker.md) for your assigned tests
2. Review test scripts for your assigned areas
3. Attend the testing kickoff meeting on March 4th, 2025 at 8:00 AM

Thank you for your contribution to ensuring the quality of the Audotics application! 