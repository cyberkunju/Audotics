# REST API Documentation

## Overview
The Audotics REST API provides programmatic access to the music recommendation system. This document outlines the available endpoints, authentication methods, and usage examples.

## Base URL
```
Production: https://api.audotics.com/v1
Staging: https://api-staging.audotics.com/v1
```

## Authentication
All API requests require authentication using JWT tokens.

### Authentication Header
```http
Authorization: Bearer <your_jwt_token>
```

## Rate Limiting
- 1000 requests per hour for authenticated users
- 100 requests per hour for unauthenticated users
- Rate limit headers included in responses

## Endpoints

### User Management

#### Create User
```http
POST /users
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "secure_password",
  "name": "John Doe"
}
```

#### Get User Profile
```http
GET /users/{user_id}
```

#### Update User Preferences
```http
PUT /users/{user_id}/preferences
Content-Type: application/json

{
  "favorite_genres": ["rock", "jazz"],
  "preferred_artists": ["artist_id1", "artist_id2"]
}
```

### Music Recommendations

#### Get Personalized Recommendations
```http
GET /recommendations
Query Parameters:
  - limit (optional): number of recommendations (default: 20)
  - offset (optional): pagination offset (default: 0)
  - context (optional): listening context
```

#### Get Similar Songs
```http
GET /songs/{song_id}/similar
Query Parameters:
  - limit (optional): number of similar songs (default: 10)
```

#### Get Trending Songs
```http
GET /trending
Query Parameters:
  - genre (optional): filter by genre
  - timeframe (optional): "day", "week", "month" (default: "week")
```

### Playlists

#### Create Playlist
```http
POST /playlists
Content-Type: application/json

{
  "name": "My Awesome Playlist",
  "description": "A collection of great songs",
  "is_public": true
}
```

#### Add Songs to Playlist
```http
POST /playlists/{playlist_id}/songs
Content-Type: application/json

{
  "song_ids": ["song_id1", "song_id2"]
}
```

#### Get Playlist Details
```http
GET /playlists/{playlist_id}
```

### User Feedback

#### Submit Song Rating
```http
POST /feedback/songs/{song_id}
Content-Type: application/json

{
  "rating": 5,
  "context": "playlist"
}
```

#### Skip Song
```http
POST /feedback/songs/{song_id}/skip
Content-Type: application/json

{
  "timestamp": "2024-12-09T15:30:00Z",
  "reason": "not_interested"
}
```

## Response Formats

### Success Response
```json
{
  "status": "success",
  "data": {
    // Response data
  },
  "meta": {
    "page": 1,
    "total": 100,
    "limit": 20
  }
}
```

### Error Response
```json
{
  "status": "error",
  "error": {
    "code": "invalid_request",
    "message": "Invalid request parameters",
    "details": {
      // Additional error details
    }
  }
}
```

## Error Codes
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 429: Too Many Requests
- 500: Internal Server Error

## Pagination
All list endpoints support pagination using:
- `limit`: Number of items per page (default: 20, max: 100)
- `offset`: Number of items to skip (default: 0)

## Filtering
Many endpoints support filtering using query parameters:
- `genre`: Filter by music genre
- `artist`: Filter by artist
- `year`: Filter by release year
- `mood`: Filter by mood classification

## Examples

### Get Recommendations
```python
import requests

def get_recommendations(token, limit=20):
    headers = {
        'Authorization': f'Bearer {token}'
    }
    response = requests.get(
        'https://api.audotics.com/v1/recommendations',
        headers=headers,
        params={'limit': limit}
    )
    return response.json()
```

### Create Playlist
```python
import requests

def create_playlist(token, name, description):
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }
    data = {
        'name': name,
        'description': description,
        'is_public': True
    }
    response = requests.post(
        'https://api.audotics.com/v1/playlists',
        headers=headers,
        json=data
    )
    return response.json()
```

## SDK Support
Official SDKs are available for:
- Python
- JavaScript
- Java
- Ruby
- Go

## Additional Resources
- [API Changelog](versioning.md)
- [GraphQL API](graphql.md)
- [WebSocket API](websocket.md)
- [Authentication Guide](auth.md)
- [Rate Limiting Details](rate_limits.md)
