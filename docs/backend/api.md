# Audotics API Documentation

This document provides an overview of the Audotics backend API endpoints.

## Authentication

Authentication is handled via Spotify OAuth. Most endpoints require authentication via the AuthGuard.

## User Endpoints

### Register User
- **Endpoint**: `POST /user/register`
- **Description**: Register a new user with Spotify authorization code
- **Request Body**:
  ```json
  {
    "code": "spotify_authorization_code"
  }
  ```
- **Response**: User object and tokens

### Login
- **Endpoint**: `GET /user/login`
- **Description**: Get Spotify authentication URL
- **Response**: Auth URL for Spotify OAuth

### Get User Profile
- **Endpoint**: `GET /user/:userId`
- **Description**: Get user profile information
- **Response**: User object with preferences

### Update Profile
- **Endpoint**: `PUT /user/:userId`
- **Description**: Update user profile information
- **Request Body**:
  ```json
  {
    "displayName": "New Display Name"
  }
  ```
- **Response**: Updated user object

### Get User Preferences
- **Endpoint**: `GET /user/:userId/preferences`
- **Description**: Get user music preferences
- **Response**: User preferences object

### Update User Preferences
- **Endpoint**: `PUT /user/:userId/preferences`
- **Description**: Update user music preferences
- **Request Body**:
  ```json
  {
    "genres": ["rock", "pop"],
    "features": {
      "energy": 0.8,
      "danceability": 0.7
    }
  }
  ```
- **Response**: Updated preferences object

## Spotify Integration Endpoints

### Get Current User Profile
- **Endpoint**: `GET /spotify/me`
- **Description**: Get current user's Spotify profile
- **Response**: Spotify user profile

### Get Top Tracks
- **Endpoint**: `GET /spotify/top-tracks`
- **Query Parameters**:
  - `timeRange`: Time range for top tracks (short_term, medium_term, long_term)
- **Response**: List of user's top tracks

### Get Top Artists
- **Endpoint**: `GET /spotify/top-artists`
- **Query Parameters**:
  - `timeRange`: Time range for top artists (short_term, medium_term, long_term)
- **Response**: List of user's top artists

### Get Saved Tracks
- **Endpoint**: `GET /spotify/saved-tracks`
- **Query Parameters**:
  - `limit`: Number of tracks to return (default: 20)
  - `offset`: Offset for pagination (default: 0)
- **Response**: List of user's saved tracks

### Search
- **Endpoint**: `GET /spotify/search`
- **Query Parameters**:
  - `q`: Search query
  - `type`: Type of search (track, artist, album)
  - `limit`: Number of results to return (default: 20)
- **Response**: Search results

### Get Recommendations
- **Endpoint**: `GET /spotify/recommendations`
- **Query Parameters**:
  - `seed_tracks`: Comma-separated list of track IDs
  - `seed_artists`: Comma-separated list of artist IDs
  - `seed_genres`: Comma-separated list of genres
  - `limit`: Number of recommendations to return (default: 20)
  - `target_energy`: Target energy value (0.0 to 1.0)
  - `target_danceability`: Target danceability value (0.0 to 1.0)
  - `target_valence`: Target valence value (0.0 to 1.0)
  - `target_acousticness`: Target acousticness value (0.0 to 1.0)
  - `target_popularity`: Target popularity value (0 to 100)
- **Response**: List of recommended tracks

### Get Audio Features
- **Endpoint**: `GET /spotify/audio-features`
- **Query Parameters**:
  - `ids`: Comma-separated list of track IDs
- **Response**: Audio features for the specified tracks

### Create Playlist
- **Endpoint**: `POST /spotify/create-playlist`
- **Request Body**:
  ```json
  {
    "name": "Playlist Name",
    "description": "Playlist Description"
  }
  ```
- **Response**: Created playlist object

### Add Tracks to Playlist
- **Endpoint**: `POST /spotify/add-to-playlist`
- **Request Body**:
  ```json
  {
    "playlistId": "spotify_playlist_id",
    "trackUris": ["spotify:track:id1", "spotify:track:id2"]
  }
  ```
- **Response**: Success status

### Get Available Genres
- **Endpoint**: `GET /spotify/genres`
- **Description**: Get available genre seeds for recommendations
- **Response**: List of available genres

### Get Track
- **Endpoint**: `GET /spotify/track`
- **Query Parameters**:
  - `id`: Track ID
- **Response**: Track information

### Get Multiple Tracks
- **Endpoint**: `GET /spotify/tracks`
- **Query Parameters**:
  - `ids`: Comma-separated list of track IDs
- **Response**: Information for multiple tracks

### Get Group Recommendations
- **Endpoint**: `GET /spotify/group-recommendations`
- **Request Body**:
  ```json
  {
    "userPreferences": [
      {
        "topArtistIds": ["artist_id1", "artist_id2"],
        "topTrackIds": ["track_id1", "track_id2"],
        "favoriteGenres": ["rock", "pop"],
        "audioFeatures": {
          "energy": 0.8,
          "danceability": 0.7,
          "valence": 0.6,
          "acousticness": 0.3
        }
      }
    ]
  }
  ```
- **Response**: Group recommendations

## Machine Learning Endpoints

### Collect User Data
- **Endpoint**: `POST /ml/user/:userId/collect-data`
- **Description**: Collect and process user data for ML model
- **Request Body**:
  ```json
  {
    "access_token": "spotify_access_token"
  }
  ```
- **Response**: Status of data collection

### Get Personalized Recommendations
- **Endpoint**: `GET /ml/user/:userId/recommendations`
- **Query Parameters**:
  - `limit`: Number of recommendations to return (default: 20)
- **Response**: Personalized track recommendations

### Train Content Model
- **Endpoint**: `POST /ml/train-content-model`
- **Request Body**:
  ```json
  {
    "epochs": 50,
    "validationSplit": 0.2,
    "batchSize": 32
  }
  ```
- **Response**: Training results and metrics

### Evaluate Model
- **Endpoint**: `GET /ml/evaluate-model`
- **Description**: Evaluate the current ML model
- **Response**: Evaluation metrics

### Get Similar Tracks
- **Endpoint**: `GET /ml/track/:trackId/similar`
- **Query Parameters**:
  - `limit`: Number of similar tracks to return (default: 10)
- **Response**: List of similar tracks with similarity scores

### Get Model Status
- **Endpoint**: `GET /ml/model-status`
- **Description**: Get the status of the ML model
- **Response**: Model status information

### Update Model
- **Endpoint**: `POST /ml/update-model`
- **Request Body**:
  ```json
  {
    "force": false
  }
  ```
- **Response**: Model update status

## Group Session Endpoints

### Create Group Session
- **Endpoint**: `POST /group-session`
- **Description**: Create a new group listening session
- **Request Body**:
  ```json
  {
    "name": "Session Name",
    "description": "Session Description"
  }
  ```
- **Response**: Created session object

### Join Group Session
- **Endpoint**: `POST /group-session/:sessionId/join`
- **Description**: Join an existing group session
- **Response**: Session information

### Leave Group Session
- **Endpoint**: `POST /group-session/:sessionId/leave`
- **Description**: Leave a group session
- **Response**: Success status

### Get Group Session
- **Endpoint**: `GET /group-session/:sessionId`
- **Description**: Get information about a group session
- **Response**: Session details and participants

## NLP Recommendation Endpoints

### Get NLP-based Recommendations
- **Endpoint**: `POST /nlp-recommendation`
- **Request Body**:
  ```json
  {
    "query": "Upbeat songs for a workout",
    "limit": 10
  }
  ```
- **Response**: Recommendations based on natural language query 