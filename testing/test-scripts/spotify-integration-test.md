# Spotify Integration Test Script

## Test Information
- **Test ID**: SPOT-001
- **Priority**: Critical
- **Feature**: Spotify Integration
- **Test Type**: Manual & Automated
- **Test Environment**: Test Server (https://test.audotics.com)

## Description
This test script verifies the Spotify integration functionality of the Audotics application, including account linking, data synchronization, playlist import/export, and playback capabilities.

## Preconditions
1. Test environment is accessible
2. Test user accounts are available:
   - Audotics User: spotifytest@audotics.com / Test123!
3. Spotify test accounts are available:
   - Premium Account: [Refer to password manager]
   - Free Account: [Refer to password manager]
4. Spotify API credentials are properly configured in the test environment
5. Spotify test accounts have existing playlists and listening history

## Test Steps - Account Linking

| # | Action | Expected Result | Status | Notes |
|---|--------|-----------------|--------|-------|
| 1 | Log in to Audotics as test user | Login succeeds, user is directed to dashboard | | |
| 2 | Navigate to "Account Settings" | Settings page loads with integration options | | |
| 3 | Click "Connect Spotify" button | Spotify authorization page opens | | |
| 4 | Log in with Spotify Premium test account | Login succeeds | | |
| 5 | Review permissions requested by Audotics | Permissions include read/write access to playlists, listening history, etc. | | |
| 6 | Approve the authorization | Redirects back to Audotics with successful connection message | | |
| 7 | Verify connection status | Account settings page shows "Connected to Spotify" with account email | | |
| 8 | Check for imported profile data | User profile shows Spotify display name, profile picture if applicable | | |
| 9 | Log out and log back in to Audotics | Login succeeds and Spotify connection persists | | |
| 10 | Try to connect already connected account again | System handles gracefully (shows already connected or refreshes token) | | |

## Test Steps - Spotify Data Import

| # | Action | Expected Result | Status | Notes |
|---|--------|-----------------|--------|-------|
| 1 | Go to "Import Data" in settings | Import options appear for Spotify data | | |
| 2 | Select "Import Listening History" | Confirmation dialog appears | | |
| 3 | Confirm import | Import process begins with progress indicator | | |
| 4 | Wait for import to complete | Success message appears when complete | | |
| 5 | Navigate to Audotics music library | Library contains tracks from Spotify history | | |
| 6 | Select "Import Playlists" | List of Spotify playlists appears | | |
| 7 | Select several playlists to import | Selection is confirmed | | |
| 8 | Confirm import | Import process begins with progress indicator | | |
| 9 | Navigate to "My Playlists" | Imported Spotify playlists appear with correct names and tracks | | |
| 10 | Check for playlist metadata | Cover art, descriptions, and track counts match Spotify data | | |
| 11 | Import a very large playlist (200+ tracks) | System handles large playlist import without errors | | |
| 12 | Import a playlist with non-standard characters | Playlist name and tracks import correctly with special characters | | |

## Test Steps - Spotify Data Export

| # | Action | Expected Result | Status | Notes |
|---|--------|-----------------|--------|-------|
| 1 | Create a new Audotics playlist called "Export Test" | Playlist is created successfully | | |
| 2 | Add several tracks to the playlist | Tracks are added successfully | | |
| 3 | Click "Export to Spotify" | Confirmation dialog appears | | |
| 4 | Confirm export | Export process begins with progress indicator | | |
| 5 | Wait for completion | Success message appears | | |
| 6 | Log in to Spotify directly | Login succeeds | | |
| 7 | Check Spotify playlists | "Export Test" playlist appears with correct tracks | | |
| 8 | Edit a playlist in Audotics that was previously exported | Edits are made successfully | | |
| 9 | Click "Sync with Spotify" | Sync process begins | | |
| 10 | Check Spotify playlists again | Changes are reflected in the Spotify playlist | | |
| 11 | Export a Collaborative Playlist | Export completes successfully | | |
| 12 | Test Audotics "one-click export" shortcut | Export process begins immediately with minimal confirmation steps | | |

## Test Steps - Spotify Playback Control

| # | Action | Expected Result | Status | Notes |
|---|--------|-----------------|--------|-------|
| 1 | Ensure Spotify app is open on a device | Spotify app is ready | | |
| 2 | In Audotics, click "Play on Spotify" for a track | Track begins playing on Spotify | | |
| 3 | Use Audotics playback controls to pause | Playback pauses on Spotify | | |
| 4 | Use Audotics playback controls to resume | Playback resumes on Spotify | | |
| 5 | Use Audotics controls to skip to next track | Spotify skips to next track | | |
| 6 | Use Audotics controls to adjust volume | Volume changes on Spotify | | |
| 7 | Click "Play on Spotify" for a playlist | Playlist begins playing on Spotify | | |
| 8 | Use device selector in Audotics | List of available Spotify playback devices appears | | |
| 9 | Select a different device | Playback transfers to selected device | | |
| 10 | Start playing content, close Audotics tab/window | Spotify playback continues uninterrupted | | |
| 11 | Reopen Audotics and navigate to Now Playing | Playback status is correctly synchronized | | |
| 12 | Test with Spotify Free account (if applicable) | System handles free account limitations appropriately | | |

## Test Steps - Real-time Synchronization

| # | Action | Expected Result | Status | Notes |
|---|--------|-----------------|--------|-------|
| 1 | In Audotics, start playing a track via Spotify | Track plays successfully | | |
| 2 | Directly in Spotify app, skip to next track | Audotics UI updates to reflect current track | | |
| 3 | In Audotics, add current track to a playlist | Track is added to Audotics playlist | | |
| 4 | Click "Add to Spotify Playlist" in Audotics | Track is added to selected Spotify playlist | | |
| 5 | In Spotify app, create a new playlist | After refresh or sync, playlist appears in Audotics | | |
| 6 | In Spotify app, add tracks to a playlist | After refresh or sync, added tracks appear in Audotics | | |
| 7 | Use Spotify app to like/save a track | After refresh or sync, track appears in Audotics liked songs | | |
| 8 | In Audotics, save a track as favorite | Track is saved to Spotify Liked Songs | | |

## Test Steps - Error Handling and Edge Cases

| # | Action | Expected Result | Status | Notes |
|---|--------|-----------------|--------|-------|
| 1 | Revoke Audotics permissions in Spotify account | System detects revoked permissions on next operation | | |
| 2 | Attempt to use Spotify features after revocation | Clear error message appears with reconnection option | | |
| 3 | Reconnect Spotify account | Connection re-establishes successfully | | |
| 4 | Test with expired Spotify auth token | System handles refresh token flow correctly | | |
| 5 | Disconnect Spotify account in Audotics | Account disconnects with confirmation message | | |
| 6 | Try to import Spotify playlist with region-restricted tracks | System handles unavailable tracks gracefully | | |
| 7 | Try to export playlist with local files | System handles non-Spotify tracks appropriately | | |
| 8 | Test with intermittent network connectivity | System handles interruptions and resumes operations | | |
| 9 | Attempt very frequent API calls | System handles rate limiting correctly | | |
| 10 | Test multi-device scenarios (phone, desktop, etc.) | System correctly identifies and synchronizes across devices | | |

## Test Steps - Performance Testing

| # | Action | Expected Result | Status | Notes |
|---|--------|-----------------|--------|-------|
| 1 | Measure Spotify authorization flow time | Flow completes in < 5 seconds (excluding user input) | | |
| 2 | Measure playlist import time (50 tracks) | Import completes in reasonable time (< 10 seconds) | | |
| 3 | Measure response time for playback controls | Controls respond in < 500ms | | |
| 4 | Monitor API call frequency during active use | Calls remain below Spotify API rate limits | | |
| 5 | Monitor memory usage during large data transfers | Memory usage remains stable | | |
| 6 | Test concurrent operations (import while playing) | Both operations complete successfully without interference | | |

## Test Data

- Audotics User: spotifytest@audotics.com / Test123!
- Spotify Premium Account: [Refer to password manager]
- Spotify Free Account: [Refer to password manager]
- Playlist names for testing: "Export Test", "Import Test", "Large Playlist"

## Pass/Fail Criteria
- All "Expected Result" conditions must be met for critical test steps
- Spotify account connection and authorization works reliably
- Data import/export completes successfully with accurate data transfer
- Playback control functions work with appropriate latency (< 500ms)
- Error handling provides clear user feedback and recovery options
- Integration works across both Premium and Free Spotify accounts with appropriate limitations

## Notes
- Take screenshots of any unexpected behavior or error messages
- Note any significant delays in data synchronization
- Monitor network traffic during API operations
- Pay special attention to differences between Premium and Free account behaviors
- Document any Spotify API rate limiting issues encountered

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