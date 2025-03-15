# Audotics Database Schema

This document outlines the database schema used in the Audotics application.

## Database Provider

The application uses PostgreSQL as the database provider.

## Models

### User

Represents a user of the application.

| Field | Type | Description |
|-------|------|-------------|
| id | String | Primary key, UUID |
| email | String | Unique email address |
| name | String | User's display name |
| password | String? | Optional password (for non-Spotify auth) |
| avatar | String? | URL to user's avatar image |
| spotifyId | String? | Spotify user ID |
| spotifyAccessToken | String? | Spotify API access token |
| spotifyRefreshToken | String? | Spotify API refresh token |
| spotifyTokenExpiry | DateTime? | Expiration time of Spotify token |
| createdAt | DateTime | When the user was created |
| updatedAt | DateTime | When the user was last updated |

**Relations:**
- One-to-one with `UserPreference`
- Many-to-many with `GroupSession`
- One-to-many with `Playlist`
- One-to-many with `TrackInteraction`
- One-to-many with `PlaylistUpdate`

### UserPreference

Stores user music preferences.

| Field | Type | Description |
|-------|------|-------------|
| id | String | Primary key, UUID |
| userId | String | Foreign key to User |
| topTracks | String[] | Array of Spotify track IDs |
| topArtists | String[] | Array of Spotify artist IDs |
| genres | String[] | Array of preferred music genres |
| features | Json? | Audio features preferences |
| lastUpdated | DateTime | When preferences were last updated |

**Relations:**
- One-to-one with `User`

### GroupSession

Represents a group listening session.

| Field | Type | Description |
|-------|------|-------------|
| id | String | Primary key, UUID |
| name | String | Session name |
| createdAt | DateTime | When the session was created |
| updatedAt | DateTime | When the session was last updated |
| active | Boolean | Whether the session is active |

**Relations:**
- Many-to-many with `User`
- One-to-one with `Playlist`

### Playlist

Represents a music playlist.

| Field | Type | Description |
|-------|------|-------------|
| id | String | Primary key, UUID |
| spotifyId | String? | Spotify playlist ID |
| name | String | Playlist name |
| description | String? | Playlist description |
| createdAt | DateTime | When the playlist was created |
| updatedAt | DateTime | When the playlist was last updated |
| creatorId | String | Foreign key to User |
| sessionId | String? | Foreign key to GroupSession |

**Relations:**
- Many-to-one with `User` (creator)
- One-to-one with `GroupSession`
- Many-to-many with `Track`
- One-to-many with `PlaylistUpdate`

### Track

Represents a music track.

| Field | Type | Description |
|-------|------|-------------|
| id | String | Primary key, UUID |
| spotifyId | String | Spotify track ID |
| name | String | Track name |
| artists | String[] | Array of artist names |
| album | String | Album name |
| popularity | Int | Popularity score (0-100) |
| createdAt | DateTime | When the track was added |
| updatedAt | DateTime | When the track was last updated |

**Relations:**
- One-to-one with `TrackFeatures`
- Many-to-many with `Playlist`
- One-to-many with `TrackInteraction`

### TrackFeatures

Stores audio features for a track.

| Field | Type | Description |
|-------|------|-------------|
| id | String | Primary key, UUID |
| trackId | String | Foreign key to Track |
| danceability | Float | Danceability score (0.0-1.0) |
| energy | Float | Energy score (0.0-1.0) |
| key | Int | Musical key |
| loudness | Float | Loudness in dB |
| mode | Int | Modality (0 = minor, 1 = major) |
| speechiness | Float | Speechiness score (0.0-1.0) |
| acousticness | Float | Acousticness score (0.0-1.0) |
| instrumentalness | Float | Instrumentalness score (0.0-1.0) |
| liveness | Float | Liveness score (0.0-1.0) |
| valence | Float | Valence/positivity score (0.0-1.0) |
| tempo | Float | Tempo in BPM |
| updatedAt | DateTime | When features were last updated |

**Relations:**
- One-to-one with `Track`

### TrackInteraction

Records user interactions with tracks.

| Field | Type | Description |
|-------|------|-------------|
| id | String | Primary key, UUID |
| userId | String | Foreign key to User |
| trackId | String | Foreign key to Track |
| type | String | Interaction type (play, skip, like, etc.) |
| timestamp | DateTime | When the interaction occurred |

**Relations:**
- Many-to-one with `User`
- Many-to-one with `Track`

### PlaylistUpdate

Records updates to playlists.

| Field | Type | Description |
|-------|------|-------------|
| id | String | Primary key, UUID |
| playlistId | String | Foreign key to Playlist |
| type | String | Update type (add, remove, reorder) |
| trackId | String | Track IDs affected by the update |
| userId | String | Foreign key to User who made the update |
| timestamp | DateTime | When the update occurred |

**Relations:**
- Many-to-one with `Playlist`
- Many-to-one with `User`

## Indexes

The schema includes indexes on frequently queried fields:

- User: email, name, spotifyId
- UserPreference: userId, topArtists, genres
- GroupSession: active, createdAt, updatedAt
- Playlist: creatorId, sessionId, createdAt
- Track: spotifyId, artists
- TrackFeatures: trackId
- PlaylistUpdate: playlistId + timestamp 