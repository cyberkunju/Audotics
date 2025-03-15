# Playlist Management Test Script

## Test Information
- **Test ID**: PLAYLIST-001
- **Priority**: High
- **Feature**: Playlist Management
- **Test Type**: Manual & Automated
- **Test Environment**: Test Server (https://test.audotics.com)

## Description
This test script verifies the playlist management functionality of the Audotics application, including creation, editing, sharing, and collaborative playlist features.

## Preconditions
1. Test environment is accessible
2. Test user accounts are available:
   - Primary User: playlisttest@audotics.com / Test123!
   - Collaborator: collaborator@audotics.com / Test123!
   - Friend: friend@audotics.com / Test123!
3. Test music database contains adequate sample data
4. Users have permission to create and share playlists

## Test Steps - Playlist Creation

| # | Action | Expected Result | Status | Notes |
|---|--------|-----------------|--------|-------|
| 1 | Log in as Primary User | Login succeeds, user is directed to dashboard | | |
| 2 | Navigate to "My Playlists" section | Playlists page loads showing existing playlists (if any) and "Create New" button | | |
| 3 | Click "Create New Playlist" button | Creation modal appears with fields for name, description, and privacy settings | | |
| 4 | Enter name: "Test Rock Playlist" | Name is accepted | | |
| 5 | Enter description: "A collection of classic rock tracks" | Description is accepted | | |
| 6 | Set privacy to "Public" | Public option is selected | | |
| 7 | Click "Create" button | Playlist is created and user is redirected to empty playlist view | | |
| 8 | Verify playlist details | Playlist page shows correct name, description, and privacy setting | | |
| 9 | Click "Add Tracks" button | Search or recommendation interface appears | | |
| 10 | Search for "queen" and add 3 tracks | Tracks are added to the playlist | | |
| 11 | Verify playlist now contains the added tracks | The 3 tracks appear in the playlist with correct metadata (artist, duration, album) | | |

## Test Steps - Playlist Editing

| # | Action | Expected Result | Status | Notes |
|---|--------|-----------------|--------|-------|
| 1 | Open the previously created playlist | Playlist view opens showing all tracks | | |
| 2 | Click "Edit Playlist" button | Edit mode is activated with editable fields | | |
| 3 | Change the name to "Ultimate Rock Playlist" | Name field updates | | |
| 4 | Update the description | Description field updates | | |
| 5 | Change privacy setting to "Private" | Privacy setting updates | | |
| 6 | Click "Save Changes" | Changes are saved and view returns to normal mode | | |
| 7 | Refresh the page | Playlist loads with the updated information | | |
| 8 | Reorder tracks by dragging the first track to the third position | Tracks reorder visually | | |
| 9 | Click "Save Order" | New track order is saved | | |
| 10 | Hover over a track and click "Remove" button | Confirmation dialog appears | | |
| 11 | Confirm removal | Track is removed from playlist | | |
| 12 | Add 3 more tracks from a different artist | Tracks are added to the playlist | | |
| 13 | Click "Sort by Artist" | Tracks are reordered alphabetically by artist | | |
| 14 | Click "Sort by Title" | Tracks are reordered alphabetically by title | | |
| 15 | Click "Sort by Recently Added" | Tracks are reordered with newest additions first | | |

## Test Steps - Playlist Sharing

| # | Action | Expected Result | Status | Notes |
|---|--------|-----------------|--------|-------|
| 1 | Open a playlist and click "Share" button | Sharing options appear (Link, Email, Social, Embed) | | |
| 2 | Click "Get Shareable Link" | Link is generated and copied to clipboard | | |
| 3 | Log out and log in as Friend user | Login succeeds, dashboard appears | | |
| 4 | Paste the link in the browser address bar | Browser navigates to the shared playlist | | |
| 5 | Verify playlist is viewable but not editable | Playlist shows all tracks but no edit options | | |
| 6 | Click "Add to My Playlists" | Confirmation dialog appears | | |
| 7 | Confirm addition | Success message appears, playlist is added to user's library | | |
| 8 | Navigate to Friend's playlists | The added playlist appears as a copy | | |
| 9 | Log out and log back in as Primary User | Login succeeds | | |
| 10 | Go to the playlist and click "Share by Email" | Email sharing dialog appears | | |
| 11 | Enter Collaborator's email and send | Confirmation of email sent appears | | |
| 12 | Set playlist back to "Public" | Privacy setting updates to Public | | |
| 13 | Click "Share to Social" | Social sharing options appear (Twitter, Facebook, etc.) | | |
| 14 | Select a social platform | Platform sharing dialog appears | | |

## Test Steps - Collaborative Playlists

| # | Action | Expected Result | Status | Notes |
|---|--------|-----------------|--------|-------|
| 1 | Create a new playlist named "Collaborative Test" | New playlist is created | | |
| 2 | Click "Playlist Settings" | Settings panel appears | | |
| 3 | Enable "Collaborative Mode" | Collaborative mode is enabled | | |
| 4 | Click "Add Collaborators" | Collaborator invitation interface appears | | |
| 5 | Add Collaborator's email and send invitation | Invitation is sent, confirmation appears | | |
| 6 | Log out and log in as Collaborator | Login succeeds | | |
| 7 | Check notifications | Invitation notification is present | | |
| 8 | Accept the invitation | User is added as collaborator, playlist appears in their library | | |
| 9 | Open the collaborative playlist | Playlist opens with edit permissions | | |
| 10 | Add 2 new tracks to the playlist | Tracks are successfully added | | |
| 11 | Log out and log in as Primary User | Login succeeds | | |
| 12 | Open the collaborative playlist | Playlist shows the tracks added by Collaborator | | |
| 13 | Check the activity feed for the playlist | Activity feed shows collaborator's additions | | |
| 14 | Remove one track added by collaborator | Track is removed | | |
| 15 | Log out and log in as Collaborator again | Login succeeds | | |
| 16 | Check the collaborative playlist | Playlist reflects the removal | | |
| 17 | Check notifications | Notification about removed track may appear | | |

## Test Steps - Playlist Import/Export

| # | Action | Expected Result | Status | Notes |
|---|--------|-----------------|--------|-------|
| 1 | Log in as Primary User | Login succeeds | | |
| 2 | Go to "My Playlists" and click "Import Playlist" | Import options appear (Spotify, CSV, etc.) | | |
| 3 | Select "Import from Spotify" | Spotify authorization flow begins | | |
| 4 | Authorize Audotics to access Spotify data | Authorization completes | | |
| 5 | Select a playlist from the Spotify account | Playlist selection is confirmed | | |
| 6 | Confirm import | Import process begins and completes | | |
| 7 | Verify imported playlist | Playlist appears with correct name and tracks from Spotify | | |
| 8 | Go to a playlist and click "Export" | Export options appear | | |
| 9 | Select "Export to Spotify" | Confirmation dialog appears | | |
| 10 | Confirm export | Export process begins and completes successfully | | |
| 11 | Select "Export as CSV" | File download begins | | |
| 12 | Open the downloaded CSV file | File contains correct playlist data | | |

## Test Steps - Playlist Functionality

| # | Action | Expected Result | Status | Notes |
|---|--------|-----------------|--------|-------|
| 1 | Open a playlist with multiple tracks | Playlist view shows all tracks | | |
| 2 | Click "Play All" button | Playback begins from the first track | | |
| 3 | Click "Shuffle" button | Playlist order is randomized for playback | | |
| 4 | Navigate away and back to the playlist | Shuffle state is preserved if applicable | | |
| 5 | Click "Add to Queue" on a specific track | Track is added to playback queue | | |
| 6 | Click "Create Radio from Playlist" | Radio station based on playlist characteristics is created | | |
| 7 | Click "Analyze Playlist" | Analysis view shows genre distribution, mood, era breakdown | | |
| 8 | Click "Find Similar" on the playlist | Recommendations for similar playlists appear | | |
| 9 | Add a playlist to a "Playlist Folder" | Playlist is successfully added to the folder | | |
| 10 | Set a custom playlist image | Image is uploaded and displayed as playlist cover | | |

## Performance and Edge Cases

| # | Test Case | Expected Result | Status | Notes |
|---|-----------|-----------------|--------|-------|
| 1 | Create a very large playlist (200+ tracks) | System handles large playlist without performance issues | | |
| 2 | Rapid addition/removal of tracks | All operations complete correctly without errors | | |
| 3 | Multiple collaborators editing simultaneously | Changes are properly synchronized with minimal conflicts | | |
| 4 | Try to add the same track multiple times | System either prevents duplicates or handles them gracefully | | |
| 5 | Test with tracks that have very long titles/names | UI properly displays or truncates long text | | |
| 6 | Test with tracks that have special characters | Special characters display correctly | | |
| 7 | Create playlist with emoji in the name | Emojis display correctly | | |
| 8 | Delete all tracks from a playlist | Empty state displays correctly | | |
| 9 | Test playlist limit per user (if applicable) | System enforces or communicates limits appropriately | | |

## Test Data

- Primary User: playlisttest@audotics.com / Test123!
- Collaborator: collaborator@audotics.com / Test123!
- Friend: friend@audotics.com / Test123!
- Playlist names: "Test Rock Playlist", "Ultimate Rock Playlist", "Collaborative Test"
- Tracks to add: Various tracks by Queen, The Beatles, Led Zeppelin

## Pass/Fail Criteria
- All "Expected Result" conditions must be met for critical test steps
- Playlist operations (create, edit, delete, share) complete successfully
- Collaborative features work correctly across users
- Import/export functions complete successfully
- Performance remains acceptable with large playlists
- No data loss during concurrent edits

## Notes
- Take screenshots of any unexpected behavior or error messages
- Note any sync delays in collaborative editing
- Monitor network traffic during import/export operations
- Test playlist limit thresholds if known

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