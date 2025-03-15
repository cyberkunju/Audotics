# Test Script: Real-time Updates

## Description
Verify that real-time updates are propagated to all session participants through WebSocket connections.

## Preconditions
- Multiple users are logged in to the application
- A group session exists
- Test users have access to the same session

## Test Steps

| # | Step | Expected Result | Actual Result | Pass/Fail | Notes |
|---|------|-----------------|---------------|-----------|-------|
| 1 | User 1: Open browser and navigate to an active session | Session page loads and WebSocket connection is established (check browser network tab) | | | |
| 2 | User 2: Open browser and navigate to the same session | Session page loads and WebSocket connection is established | | | |
| 3 | User 1: Add a track to the playlist | Track is added to the playlist for User 1 | | | |
| 4 | Observe User 2's interface | User 2 sees the new track added to the playlist without refreshing | | | |
| 5 | User 2: Add a different track to the playlist | Track is added to the playlist for User 2 | | | |
| 6 | Observe User 1's interface | User 1 sees the new track added by User 2 without refreshing | | | |
| 7 | User 3: Join the session | User 3 successfully joins the session | | | |
| 8 | Observe User 1 and User 2's interfaces | Both users see User 3 added to the participants list in real-time | | | |
| 9 | User 2: Remove a track from the playlist | Track is removed from User 2's playlist | | | |
| 10 | Observe User 1 and User 3's interfaces | Both users see the track removed from the playlist in real-time | | | |
| 11 | User 3: Leave the session | User 3 successfully leaves the session | | | |
| 12 | Observe User 1 and User 2's interfaces | Both users see User 3 removed from the participants list in real-time | | | |

## Variations

### Variation 1: Network Interruption
Description: Temporarily disconnect one user to test reconnection
Expected Result: Updates resume when connection is restored

| # | Step | Expected Result | Actual Result | Pass/Fail | Notes |
|---|------|-----------------|---------------|-----------|-------|
| 1 | User 1: Disconnect from the network (disable Wi-Fi or unplug Ethernet) | Connection status indicator shows disconnected | | | |
| 2 | User 2: Add a track to the playlist | Track is added to the playlist for User 2 | | | |
| 3 | User 1: Reconnect to the network | Connection status indicator shows reconnecting then connected | | | |
| 4 | Observe User 1's interface after reconnection | User 1's playlist synchronizes to include the track added by User 2 | | | |

### Variation 2: Concurrent Updates
Description: Multiple users perform actions simultaneously
Expected Result: All updates are processed correctly and in a consistent order

| # | Step | Expected Result | Actual Result | Pass/Fail | Notes |
|---|------|-----------------|---------------|-----------|-------|
| 1 | User 1 and User 2: Simultaneously add different tracks to the playlist | Both tracks are added to the playlist | | | |
| 2 | Observe both users' interfaces | Both users see the same playlist with both tracks added in the same order | | | |
| 3 | User 1, User 2, and User 3: All perform different actions simultaneously (add track, remove track, change track order) | All actions are processed without errors | | | |
| 4 | Observe all users' interfaces | All users see identical playlists and participant lists | | | |

### Variation 3: WebSocket Reconnection
Description: Test automatic WebSocket reconnection
Expected Result: WebSocket automatically attempts to reconnect when connection is lost

| # | Step | Expected Result | Actual Result | Pass/Fail | Notes |
|---|------|-----------------|---------------|-----------|-------|
| 1 | User 1: Open browser developer tools and forcibly close the WebSocket connection | WebSocket connection closes | | | |
| 2 | Observe reconnection behavior | System automatically attempts to reconnect WebSocket | | | |
| 3 | After reconnection, check if session state is synchronized | User 1's session state matches other participants | | | |

## Test Data
- Test User: test_user1 (TestPass123!)
- Alt Test User: test_user2 (TestPass123!)
- Third Test User: test_user3 (TestPass123!)
- Test Session: SESSION001

## Test Environment
- Browser: 
- OS: 
- Screen Resolution: 
- Device: 

## Test Results
- Overall Result: [PASS/FAIL]
- Tested By: 
- Test Date: 
- Issues Found: 