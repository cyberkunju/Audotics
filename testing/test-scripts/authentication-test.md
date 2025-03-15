# Authentication Test Script

## Test Information
- **Test ID**: AUTH-001
- **Priority**: Critical
- **Feature**: User Authentication
- **Test Type**: Manual & Automated
- **Test Environment**: Test Server (https://test.audotics.com)

## Description
This test script verifies the core authentication functionality of the Audotics application, including registration, login, SSO with Spotify, and password reset.

## Preconditions
1. Test environment is accessible
2. Test user accounts are available:
   - Standard user: testuser@audotics.com / Test123!
   - No account exists for: newuser@audotics.com
3. Spotify test account is available with credentials in the password manager
4. Email testing service is configured to catch password reset emails

## Test Steps - Registration

| # | Action | Expected Result | Status | Notes |
|---|--------|-----------------|--------|-------|
| 1 | Navigate to https://test.audotics.com | Landing page loads correctly with Register/Login options | | |
| 2 | Click "Register" button | Registration form appears with fields for email, password, confirm password, and terms acceptance | | |
| 3 | Enter email: "newuser@audotics.com" | Email is accepted | | |
| 4 | Enter password that is too short (e.g., "test") | Error message indicates password requirements | | |
| 5 | Enter valid password: "TestUser123!" | Password is accepted | | |
| 6 | Enter different password in confirm field: "TestUser321!" | Error message indicates passwords don't match | | |
| 7 | Enter matching password in confirm field: "TestUser123!" | Confirmation is accepted | | |
| 8 | Submit form without checking terms checkbox | Error message indicates terms must be accepted | | |
| 9 | Check terms checkbox and submit form | Registration completes successfully with confirmation message, user is redirected to profile setup | | |
| 10 | Complete basic profile setup (music preferences) | Profile setup completes and dashboard is shown | | |

## Test Steps - Login

| # | Action | Expected Result | Status | Notes |
|---|--------|-----------------|--------|-------|
| 1 | Navigate to https://test.audotics.com | Landing page loads correctly with Register/Login options | | |
| 2 | Click "Login" button | Login form appears with fields for email and password | | |
| 3 | Enter invalid email: "nonexistent@audotics.com" | No validation error for the email field itself | | |
| 4 | Enter password: "AnyPassword123" and submit | Generic error message appears indicating invalid credentials (should not specify which field is wrong) | | |
| 5 | Enter valid email: "testuser@audotics.com" | Email is accepted | | |
| 6 | Enter incorrect password: "WrongPassword123" and submit | Generic error message appears indicating invalid credentials | | |
| 7 | Enter correct password: "Test123!" and submit | Login completes successfully, user is redirected to dashboard | | |
| 8 | Check that user-specific content appears | Dashboard shows personalized content for the test user | | |
| 9 | Logout by clicking user menu and selecting "Logout" | User is logged out and returned to landing page | | |

## Test Steps - SSO with Spotify

| # | Action | Expected Result | Status | Notes |
|---|--------|-----------------|--------|-------|
| 1 | Navigate to https://test.audotics.com | Landing page loads correctly with Register/Login options | | |
| 2 | Click "Login with Spotify" button | Spotify authorization page appears | | |
| 3 | Enter Spotify test account credentials and approve | Authorization completes, user is redirected back to Audotics | | |
| 4 | Observe the Audotics dashboard | User is successfully logged in via Spotify, dashboard shows personalized content | | |
| 5 | Check profile section | Profile shows data from Spotify (display name, profile picture if available) | | |
| 6 | Logout | User is logged out and returned to landing page | | |

## Test Steps - Password Reset

| # | Action | Expected Result | Status | Notes |
|---|--------|-----------------|--------|-------|
| 1 | Navigate to https://test.audotics.com | Landing page loads correctly with Register/Login options | | |
| 2 | Click "Login" button | Login form appears | | |
| 3 | Click "Forgot Password?" link | Password reset form appears | | |
| 4 | Enter non-existent email: "nonexistent@audotics.com" and submit | Success message appears (application should not reveal whether email exists) | | |
| 5 | Enter valid email: "testuser@audotics.com" and submit | Success message appears | | |
| 6 | Check the email testing service | Password reset email is received for testuser@audotics.com | | |
| 7 | Click the password reset link in the email | Password reset page opens | | |
| 8 | Enter new password: "NewTest456!" and confirm | Password is updated, confirmation page appears | | |
| 9 | Navigate to login page | Login form appears | | |
| 10 | Login with email "testuser@audotics.com" and the new password | Login succeeds, user is redirected to dashboard | | |

## Security Checks

| # | Check | Expected Result | Status | Notes |
|---|-------|-----------------|--------|-------|
| 1 | Examine login requests in browser dev tools | Passwords are not sent in plaintext (should use HTTPS) | | |
| 2 | Examine cookies set after login | Authentication cookies are HttpOnly and Secure | | |
| 3 | Attempt to use an expired session token | User is redirected to login page | | |
| 4 | Check localStorage/sessionStorage | No sensitive authentication data stored unencrypted | | |
| 5 | Check for brute force protection | After 5 failed attempts, temporary lockout or CAPTCHA appears | | |

## Test Data

- Test user: testuser@audotics.com / Test123!
- New user: newuser@audotics.com / TestUser123!
- Spotify test account: [Refer to password manager]

## Pass/Fail Criteria
- All "Expected Result" conditions must be met for critical test steps (1-7 in Login, 1-5 in Registration, 1-4 in SSO, 1-10 in Password Reset)
- No security vulnerabilities identified in Security Checks
- Authentication process completes within performance SLA (< 2 seconds)

## Notes
- Any vulnerabilities found during testing should be immediately reported to the security team
- Test data should be refreshed after testing is complete
- Take screenshots of any unexpected behavior or error messages

## Test Results

**Tester Name**: ___________________________

**Date Tested**: ___________________________

**Overall Result**: □ PASS  □ FAIL

**Issues Found**:
___________________________
___________________________
___________________________

**Additional Comments**:
___________________________
___________________________
___________________________ 