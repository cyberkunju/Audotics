# Test Script: Export to Spotify

## Description
Verify that users can successfully export a session playlist to their Spotify account.

## Preconditions
- User is logged in
- User is in an active session
- Session playlist contains at least one track
- User has a valid Spotify account

## Test Steps

| # | Step | Expected Result | Actual Result | Pass/Fail | Notes |
|---|------|-----------------|---------------|-----------|-------|
| 1 | Navigate to the session page and ensure playlist has tracks | Session page loads with playlist containing tracks | | | |
| 2 | Click the "Export to Spotify" button | Export confirmation dialog appears | | | |
| 3 | Review the confirmation dialog | Dialog displays information about the export process | | | |
| 4 | Confirm the export | System initiates the export process | | | |
| 5 | If not authenticated with Spotify, system should redirect to Spotify login | Spotify authentication page opens | | | |
| 6 | Complete Spotify authorization if prompted | User is redirected back to the application | | | |
| 7 | Wait for export process to complete | Loading indicator is displayed during export | | | |
| 8 | Verify success confirmation | Success message with link to Spotify playlist is shown | | | |
| 9 | Click the link to the Spotify playlist | Spotify web or app opens with the exported playlist | | | |
| 10 | Verify the exported playlist | Playlist in Spotify contains all tracks from the session playlist | | | |

## Variations

### Variation 1: Empty Playlist
Description: Attempt to export an empty playlist
Expected Result: Warning message that playlist is empty

| # | Step | Expected Result | Actual Result | Pass/Fail | Notes |
|---|------|-----------------|---------------|-----------|-------|
| 1 | Navigate to a session with no tracks in the playlist | Session page loads with empty playlist | | | |
| 2 | Click the "Export to Spotify" button | Warning message appears indicating the playlist is empty | | | |
| 3 | Verify the error message | Message clearly explains the issue and recommends adding tracks | | | |
| 4 | Attempt to proceed anyway (if option exists) | System prevents export and maintains the warning | | | |

### Variation 2: Not Authenticated with Spotify
Description: Export without prior Spotify authentication
Expected Result: System prompts for Spotify authentication

| # | Step | Expected Result | Actual Result | Pass/Fail | Notes |
|---|------|-----------------|---------------|-----------|-------|
| 1 | Ensure user is not authenticated with Spotify (clear cookies/cache if necessary) | User has no active Spotify session | | | |
| 2 | Navigate to a session with tracks in the playlist | Session page loads with playlist containing tracks | | | |
| 3 | Click the "Export to Spotify" button | Export confirmation dialog appears | | | |
| 4 | Confirm the export | System redirects to Spotify authentication | | | |
| 5 | Complete Spotify authentication | User is redirected back to the application | | | |
| 6 | Verify export process continues | Export process continues and completes successfully | | | |

### Variation 3: Network Interruption During Export
Description: Simulate network issues during export process
Expected Result: System handles the error gracefully

| # | Step | Expected Result | Actual Result | Pass/Fail | Notes |
|---|------|-----------------|---------------|-----------|-------|
| 1 | Begin the export process | Export process initiates | | | |
| 2 | Disconnect from network during export | Network connection is lost | | | |
| 3 | Observe error handling | System displays appropriate error message | | | |
| 4 | Reconnect to network | Network connection is restored | | | |
| 5 | Attempt to retry the export | Export process can be restarted | | | |
| 6 | Complete the export | Export completes successfully after retry | | | |

### Variation 4: Duplicate Playlist Name
Description: Export to Spotify when a playlist with the same name already exists
Expected Result: System handles duplicate names appropriately

| # | Step | Expected Result | Actual Result | Pass/Fail | Notes |
|---|------|-----------------|---------------|-----------|-------|
| 1 | Create a playlist in Spotify with the same name as the session | Playlist exists in Spotify | | | |
| 2 | Attempt to export the session playlist | Export process initiates | | | |
| 3 | Observe how the system handles the duplicate name | System either appends a unique identifier to the name or asks for confirmation to overwrite | | | |
| 4 | Complete the export | Export completes successfully with appropriate playlist naming | | | |

## Test Data
- Test User: test_user1 (TestPass123!)
- Spotify Test Account: spotify_test@example.com (SpotifyTestPass123!)
- Test Session with Tracks: SESSION001
- Test Session without Tracks: SESSION002

## Test Environment
- Browser: 
- OS: 
- Screen Resolution: 
- Device: 
- Spotify API Version:

## Test Results
- Overall Result: [PASS/FAIL]
- Tested By: 
- Test Date: 
- Issues Found: 