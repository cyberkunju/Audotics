# Group Session Test Script

## Test Information
- **Test ID**: GROUP-001
- **Priority**: Critical
- **Feature**: Group Sessions & Real-time Updates
- **Test Type**: Manual & Automated
- **Test Environment**: Test Server (https://test.audotics.com)

## Description
This test script verifies the core group session functionality of the Audotics application, including creation, joining, real-time interactions, and WebSocket-based updates across multiple clients.

## Preconditions
1. Test environment is accessible
2. Multiple test browsers or devices are available for multi-user testing
3. Test user accounts are available:
   - Host User: hostuser@audotics.com / Host123!
   - Member 1: member1@audotics.com / Member123!
   - Member 2: member2@audotics.com / Member123!
4. All test users have at least 5 liked songs and music preferences set
5. WebSocket connectivity is available between clients and server

## Test Setup
1. Open three different browsers or devices
2. Log in to each browser/device with a different test user account
3. Ensure all users have their profile preferences configured

## Test Steps - Group Session Creation

| # | Action | Expected Result | Status | Notes |
|---|--------|-----------------|--------|-------|
| 1 | Log in as Host User | Login succeeds, user is directed to dashboard | | |
| 2 | Navigate to "Group Sessions" section | Group session page loads, showing previous sessions (if any) and "Create New" button | | |
| 3 | Click "Create New Session" button | Creation modal appears with fields for session name, privacy, and options | | |
| 4 | Enter session name: "Test Group Session" | Name is accepted | | |
| 5 | Set session to "Public" | Public option is selected | | |
| 6 | Enable "Collaborative Mode" | Collaborative mode is enabled | | |
| 7 | Click "Create" button | Session is created and user is redirected to session view | | |
| 8 | Verify session details | Session page shows correct name, settings, and host information | | |
| 9 | Verify invitation options | Options to invite via link, email, or username are available | | |
| 10 | Generate and copy invitation link | Link is generated and copied to clipboard | | |

## Test Steps - Joining Group Session

| # | Action | Expected Result | Status | Notes |
|---|--------|-----------------|--------|-------|
| 1 | In Browser 2 (Member 1), log in | Login succeeds, user is directed to dashboard | | |
| 2 | Paste the invitation link in the address bar | Browser navigates to the session join page | | |
| 3 | Click "Join Session" button | User successfully joins the session | | |
| 4 | In Browser 3 (Member 2), log in | Login succeeds, user is directed to dashboard | | |
| 5 | Navigate to "Group Sessions" and click "Browse Public Sessions" | List of public sessions appears, including "Test Group Session" | | |
| 6 | Click on "Test Group Session" | Session preview appears | | |
| 7 | Click "Join Session" button | User successfully joins the session | | |
| 8 | As Host, verify member list | Both Member 1 and Member 2 appear in the member list | | |
| 9 | As Member 1 and 2, verify member list | Host and both members appear in the member list | | |

## Test Steps - Real-time Interactions

| # | Action | Expected Result | Status | Notes |
|---|--------|-----------------|--------|-------|
| 1 | As Host, click "Add Track" button | Track search modal appears | | |
| 2 | Search for a popular track and select it | Track is added to the session playlist | | |
| 3 | Verify in Member 1 and 2 browsers | The added track appears in their playlist views without refreshing | | |
| 4 | As Member 1, use chat feature to send a message: "Hello group!" | Message is sent to the chat | | |
| 5 | Verify in Host and Member 2 browsers | Message appears in chat without refreshing | | |
| 6 | As Member 2, click reaction (thumbs up) on the track | Reaction is applied to the track | | |
| 7 | Verify in Host and Member 1 browsers | Reaction appears on the track without refreshing | | |
| 8 | As Host, start playback of the track | Playback begins | | |
| 9 | Verify in Member 1 and 2 browsers | Play status updates and track position syncs within 3 seconds | | |
| 10 | As Host, pause the track | Playback pauses | | |
| 11 | Verify in Member 1 and 2 browsers | Pause status updates within 3 seconds | | |

## Test Steps - Group Recommendations

| # | Action | Expected Result | Status | Notes |
|---|--------|-----------------|--------|-------|
| 1 | As Host, click "Get Group Recommendations" button | System generates recommendations based on all members' preferences | | |
| 2 | Verify recommendation list | Recommendations appear and reflect a mix of all members' preferences | | |
| 3 | As Member 1 and 2, verify recommendation list | Same recommendations appear in their views | | |
| 4 | As Host, add a recommended track to the playlist | Track is added to the session playlist | | |
| 5 | Verify in Member 1 and 2 browsers | The added track appears in their playlist views without refreshing | | |
| 6 | As Member 1, upvote a recommendation | Upvote is recorded | | |
| 7 | Verify in Host and Member 2 browsers | Upvote appears without refreshing | | |

## Test Steps - Session Management

| # | Action | Expected Result | Status | Notes |
|---|--------|-----------------|--------|-------|
| 1 | As Host, click "Session Settings" | Settings modal appears | | |
| 2 | Change session name to "Updated Test Session" | Name is updated | | |
| 3 | Verify in Member 1 and 2 browsers | Session name updates without refreshing | | |
| 4 | As Host, toggle "Collaborative Mode" off | Collaborative mode is disabled | | |
| 5 | As Member 1, attempt to add a track | Action is blocked with appropriate message | | |
| 6 | As Host, toggle "Collaborative Mode" back on | Collaborative mode is enabled | | |
| 7 | As Member 1, add a track | Track is successfully added | | |
| 8 | As Host, click "Remove Member" for Member 2 | Confirmation dialog appears | | |
| 9 | Confirm removal | Member 2 is removed from the session | | |
| 10 | In Member 2's browser | User is redirected to dashboard with notification | | |
| 11 | As Host, end the session by clicking "End Session" | Confirmation dialog appears | | |
| 12 | Confirm ending the session | Session ends, all users are redirected to dashboard | | |
| 13 | Verify session history | Session appears in history for all participants | | |

## WebSocket Connection Tests

| # | Check | Expected Result | Status | Notes |
|---|-------|-----------------|--------|-------|
| 1 | Monitor network tab for WebSocket connection | Persistent WebSocket connection established | | |
| 2 | Temporarily disable network and re-enable | WebSocket automatically reconnects | | |
| 3 | Measure time between action and update across clients | Updates propagate in < 3 seconds | | |
| 4 | Check error handling when offline | Appropriate error message appears, actions queue for retry | | |
| 5 | Check WebSocket heartbeat | Regular heartbeat packets maintain connection | | |

## Test Data

- Host User: hostuser@audotics.com / Host123!
- Member 1: member1@audotics.com / Member123!
- Member 2: member2@audotics.com / Member123!
- Tracks to search for: "Bohemian Rhapsody", "Billie Jean", "Hotel California"

## Pass/Fail Criteria
- All "Expected Result" conditions must be met for critical test steps
- Real-time updates must propagate within 3 seconds to all clients
- Session remains stable when members join/leave
- No data loss during collaborative editing
- WebSocket connection remains stable or recovers properly when interrupted

## Notes
- This test requires multiple simultaneous browsers or devices
- Network conditions should be typical for target users
- Take screenshots of any unexpected behavior or error messages
- Note any performance degradation with larger group sizes

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