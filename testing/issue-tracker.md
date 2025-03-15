# Audotics Testing Issue Tracker

## Overview
This document tracks all issues identified during pre-launch testing, their status, priority, and resolution plan.

## Issue Status Legend
- 🔴 **Critical** - Blocker for launch, must be fixed immediately
- 🟠 **High** - Should be fixed before launch
- 🟡 **Medium** - Fix if time permits, otherwise post-launch
- 🟢 **Low** - Minor issue, can be fixed post-launch
- ✅ **Resolved** - Issue has been fixed and verified

## Authentication & User Management

| ID | Issue Description | Steps to Reproduce | Environment | Priority | Assigned To | Status | Resolution |
|----|------------------|-------------------|-------------|----------|-------------|--------|------------|
| AUTH-01 | Password reset email not received when using test email service | 1. Go to login page<br>2. Click "Forgot Password"<br>3. Enter test email: testuser@audotics.com<br>4. Submit request<br>5. Check test email service inbox | Chrome 121.0, Windows 11<br>Test Environment | 🔴 Critical | Backend Team | ✅ Resolved | SMTP configuration updated and verified working |
| AUTH-02 | SSO with Spotify occasionally fails with "Authorization Error" | 1. Attempt to log in with Spotify<br>2. Approve authorization on Spotify<br>3. Redirect back to app fails ~20% of the time<br>4. Error message: "Authorization Error: Invalid state parameter" | Firefox 122.0, macOS 14<br>Test Environment | 🟠 High | Auth Team | In Progress | Investigating state parameter handling in callback process |
| AUTH-03 | | | | | | | |

## WebSocket & Real-time Updates

| ID | Issue Description | Steps to Reproduce | Environment | Priority | Assigned To | Status | Resolution |
|----|------------------|-------------------|-------------|----------|-------------|--------|------------|
| WS-01 | WebSocket connection fails to automatically reconnect after network interruption | 1. Join a group session<br>2. Disconnect network (disable WiFi)<br>3. Wait 10 seconds<br>4. Reconnect network<br>5. Observe that session shows "Disconnected" and requires manual refresh | Firefox 122.0, macOS 14<br>Test Environment | 🟠 High | Backend Team | ✅ Resolved | Implemented exponential backoff reconnection strategy |
| WS-02 | Rapid changes in group session cause UI to freeze temporarily | 1. Join a group session with 4+ members<br>2. Have multiple members add tracks in rapid succession<br>3. Observe UI freezes for 2-3 seconds during update bursts | Chrome 121.0, Windows 11<br>Test Environment | 🟡 Medium | Frontend Team | Open | Optimizing rendering of rapid updates, implementing debounce |
| WS-03 | | | | | | | |

## Recommendation System

| ID | Issue Description | Steps to Reproduce | Environment | Priority | Assigned To | Status | Resolution |
|----|------------------|-------------------|-------------|----------|-------------|--------|------------|
| REC-01 | Group recommendation response time exceeds 1000ms threshold with 5+ members | 1. Create a group with 5 members<br>2. Each member with different music preferences<br>3. Request group recommendations<br>4. Measure response time (consistently 2300-2800ms) | Chrome 121.0, Windows 11<br>Test Environment | 🟠 High | ML Team | ✅ Resolved | Optimized preference aggregation algorithm and implemented result caching |
| REC-02 | Recommendations heavily favor popular tracks with insufficient diversity | 1. Create new user account<br>2. Set preference for "indie rock"<br>3. Get recommendations<br>4. Observe 80%+ of recommendations are mainstream rock tracks | Any browser<br>Test Environment | 🟡 Medium | ML Team | In Progress | Adjusting diversity weighting in recommendation algorithm |
| REC-03 | | | | | | | |

## Playlist Management

| ID | Issue Description | Steps to Reproduce | Environment | Priority | Assigned To | Status | Resolution |
|----|------------------|-------------------|-------------|----------|-------------|--------|------------|
| PLY-01 | Reordering tracks in a large playlist (100+ tracks) causes UI lag | 1. Create playlist with 100+ tracks<br>2. Enter edit mode<br>3. Attempt to drag tracks to reorder<br>4. UI becomes unresponsive for 1-2 seconds per drag | Chrome 121.0, Windows 11<br>Test Environment | 🟡 Medium | Frontend Team | Open | Implementing windowed rendering for large playlists |
| PLY-02 | Collaborative playlist edits occasionally create duplicate tracks | 1. Create collaborative playlist<br>2. Have two users add the same track nearly simultaneously<br>3. Both tracks appear in playlist instead of deduplicating | Any browser<br>Test Environment | 🟠 High | Backend Team | In Progress | Implementing proper conflict resolution for collaborative edits |
| PLY-03 | | | | | | | |

## Search Functionality

| ID | Issue Description | Steps to Reproduce | Environment | Priority | Assigned To | Status | Resolution |
|----|------------------|-------------------|-------------|----------|-------------|--------|------------|
| SEARCH-01 | Search does not handle certain special characters correctly | 1. Search for artists with accented characters (e.g., "Björk")<br>2. No results returned<br>3. Searching without accents works correctly | All browsers<br>Test Environment | 🟠 High | Backend Team | In Progress | Updating search index to properly handle Unicode characters |
| SEARCH-02 | Search result pagination fails after page 5 | 1. Perform a search that returns many results (e.g., "a")<br>2. Navigate to page 5<br>3. Click "Next" or page 6<br>4. Error: "Failed to load results" | Safari 17.3, iOS<br>Test Environment | 🟡 Medium | Backend Team | Open | Investigating pagination token handling |
| SEARCH-03 | | | | | | | |

## Spotify Integration

| ID | Issue Description | Steps to Reproduce | Environment | Priority | Assigned To | Status | Resolution |
|----|------------------|-------------------|-------------|----------|-------------|--------|------------|
| SPOT-01 | Large playlist import (300+ tracks) from Spotify fails at ~80% | 1. Connect Spotify account<br>2. Attempt to import playlist with 300+ tracks<br>3. Import progress reaches ~80% then fails<br>4. Error: "Request timed out" | Chrome 121.0, Windows 11<br>Test Environment | 🟠 High | Integration Team | In Progress | Implementing chunked import for large playlists |
| SPOT-02 | Spotify playback control delayed by ~2 seconds on mobile | 1. Connect Spotify account<br>2. Start playback via Spotify integration<br>3. Use controls (play/pause/skip)<br>4. Actions take ~2s to affect Spotify playback | Safari 17.3, iOS<br>Test Environment | 🟡 Medium | Mobile Team | Open | Optimizing mobile API calls to Spotify Connect API |
| SPOT-03 | | | | | | | |

## UI/UX & Cross-browser

| ID | Issue Description | Steps to Reproduce | Environment | Priority | Assigned To | Status | Resolution |
|----|------------------|-------------------|-------------|----------|-------------|--------|------------|
| UI-01 | Track progress bar misaligned on mobile view | 1. Access group session on mobile device<br>2. Add track to playlist<br>3. Start playback<br>4. Observe progress bar is offset by ~20px to the right | Safari iOS 17.3.1<br>iPhone 13 Pro<br>Test Environment | 🟡 Medium | Frontend Team | ✅ Resolved | Fixed CSS alignment issue for mobile viewports |
| UI-02 | Dark mode text illegible in some modals | 1. Enable dark mode in settings<br>2. Open the "Share Playlist" modal<br>3. Text in some sections appears dark gray on black background | Firefox 122.0, macOS 14<br>Test Environment | 🟡 Medium | Frontend Team | Open | Adding missing dark mode class to modal elements |
| UI-03 | | | | | | | |

## Performance & Scalability

| ID | Issue Description | Steps to Reproduce | Environment | Priority | Assigned To | Status | Resolution |
|----|------------------|-------------------|-------------|----------|-------------|--------|------------|
| PERF-01 | Performance degradation with 50+ concurrent users | 1. Run load test with 50+ simulated users<br>2. API response times increase by 300%<br>3. CPU utilization reaches 95% | Test Environment | 🟠 High | Backend Team | In Progress | Implementing additional caching and optimizing database queries |
| PERF-02 | Memory leak in WebSocket server after 24+ hours | 1. Keep WebSocket connections open for 24+ hours<br>2. Monitor memory usage<br>3. Observe steady increase without plateau | Test Environment | 🟠 High | Backend Team | Open | Investigating event listener cleanup in WebSocket server |
| PERF-03 | | | | | | | |

## Issue Reporting Template

When adding a new issue, please follow this format:

```
| [ID] | [Brief description of the issue] | 
1. [Step 1]
2. [Step 2]
3. [Step 3] 
| [Browser/OS/Device] | [Priority] | [Assignee] | [Status] | [Resolution approach or fix] |
```

## Daily Status Summary

### March 4, 2025
- Total issues found: 11
- Critical: 1
- High: 6
- Medium: 4
- Low: 0
- Resolved: 3
- Remaining blockers: 0

### March 5, 2025
- Total issues found: 
- Critical: 
- High: 
- Medium: 
- Low: 
- Resolved: 
- Go/No-Go status: 

## Decision Log

| Date/Time | Decision | Rationale | Made By | Impact |
|-----------|----------|-----------|---------|--------|
| 2025-03-04 16:30 | Prioritize AUTH-01 fix | Password reset is a critical user journey | QA Lead & Product Owner | Backend team to address immediately, other non-critical issues deprioritized |
| 2025-03-04 17:45 | Defer UI-02 to post-launch | Issue only affects dark mode which is not default | UX Lead & QA Lead | Issue added to post-launch fix list, workaround documented |

## Issue Screenshots

Store screenshots of issues below for reference, with the issue ID in the header.

### AUTH-01
![Password Reset Email Not Received](./screenshots/auth-01-password-reset.png)

### WS-01
![WebSocket Reconnection Failure](./screenshots/ws-01-reconnection-failure.png)

### UI-01
![Mobile Progress Bar Misalignment](./screenshots/ui-01-progress-bar.png) 