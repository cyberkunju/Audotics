import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { ACCESS_TOKEN_COOKIE } from '@/lib/spotify-auth/constants'

// Default popular genres that are known to work with Spotify's API
const VALID_SPOTIFY_GENRES = [
  'pop', 'hip-hop', 'rock', 'r-n-b', 'indie-pop',
  'edm', 'dance', 'alternative', 'classical', 'jazz'
];

// Default popular tracks to use when nothing else works
const DEFAULT_POPULAR_TRACKS = [
  '4cOdK2wGLETKBW3PvgPWqT', // "Lose Yourself" - Eminem
  '1mea3bSkSGXuIRvnydlB5b', // "Bohemian Rhapsody" - Queen
  '3z8h0TU7ReDPLIbEnYhWZb', // "Billie Jean" - Michael Jackson
  '4h8VwCb1MTGoLKueQ1WgbD', // "Wake Me Up" - Avicii
  '2x8evxqUlF0eRabbW2JBJd', // "Thinking Out Loud" - Ed Sheeran
];

// Add this new function to fetch available genres
async function getAvailableGenres(accessToken: string): Promise<string[]> {
  try {
    const response = await fetch(
      'https://api.spotify.com/v1/recommendations/available-genre-seeds',
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        },
        cache: 'no-store'
      }
    );

    if (response.ok) {
      const data = await response.json();
      console.log(`Retrieved ${data.genres?.length || 0} available genres from Spotify`);
      return data.genres || [];
    } else {
      console.error(`Failed to fetch available genres: ${response.status}`);
      return VALID_SPOTIFY_GENRES;
    }
  } catch (error) {
    console.error('Error fetching available genres:', error);
    return VALID_SPOTIFY_GENRES;
  }
}

export async function GET() {
  try {
    const cookieStore = await cookies()
    const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value

    if (!accessToken) {
      console.error('No access token found in cookie')
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    console.log('Fetching recommendations from Spotify API')
    
    // Try to get valid seeds - using multiple approaches for resilience
    let seedTracks = '';
    let seedArtists = '';
    let usingFallback = false;
    let usingDefaultTracks = false;
    
    // Approach 1: Try user's top tracks
    try {
      const topTracksResponse = await fetch(
        'https://api.spotify.com/v1/me/top/tracks?limit=5&time_range=short_term',
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          },
          cache: 'no-store'
        }
      )

      if (topTracksResponse.ok) {
        const topTracks = await topTracksResponse.json()
        if (topTracks.items && topTracks.items.length > 0) {
          // Limit to 2 tracks to avoid exceeding Spotify's seed limit
          seedTracks = topTracks.items
            .slice(0, 2)
            .map((track: any) => track.id)
            .join(',')
          console.log('Using top tracks as seeds:', seedTracks)
        }
      } else {
        console.error(`Failed to fetch top tracks: ${topTracksResponse.status}`)
      }
    } catch (error) {
      console.error('Error fetching top tracks:', error)
    }
    
    // Approach 2: If top tracks failed, try recently played
    if (!seedTracks) {
      try {
        const recentlyPlayedResponse = await fetch(
          'https://api.spotify.com/v1/me/player/recently-played?limit=5',
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`
            },
            cache: 'no-store'
          }
        )
        
        if (recentlyPlayedResponse.ok) {
          const recentlyPlayed = await recentlyPlayedResponse.json()
          if (recentlyPlayed.items && recentlyPlayed.items.length > 0) {
            // Limit to 2 tracks to avoid exceeding Spotify's seed limit
            seedTracks = recentlyPlayed.items
              .slice(0, 2)
              .map((item: any) => item.track.id)
              .join(',')
            console.log('Using recently played tracks as seeds:', seedTracks)
          }
        } else {
          console.error(`Failed to fetch recently played: ${recentlyPlayedResponse.status}`)
        }
      } catch (error) {
        console.error('Error fetching recently played:', error)
      }
    }
    
    // Approach 3: Try to get top artists
    try {
      const topArtistsResponse = await fetch(
        'https://api.spotify.com/v1/me/top/artists?limit=3&time_range=short_term',
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          },
          cache: 'no-store'
        }
      )
      
      if (topArtistsResponse.ok) {
        const topArtists = await topArtistsResponse.json()
        if (topArtists.items && topArtists.items.length > 0) {
          // Limit to 2 artists to avoid exceeding Spotify's seed limit
          seedArtists = topArtists.items
            .slice(0, 2)
            .map((artist: any) => artist.id)
            .join(',')
          console.log('Using top artists as seeds:', seedArtists)
        }
      } else {
        console.warn('Could not fetch top artists')
      }
    } catch (error) {
      console.error('Error fetching top artists:', error)
    }

    // Build URL with seed parameters
    let recommendationsUrl = 'https://api.spotify.com/v1/recommendations?limit=20';
    
    // Approach 4: If no user data available, use genre seeds as fallback
    if (!seedTracks && !seedArtists) {
      console.log('No valid seed tracks or artists available - using fallback genres');
      
      // Try to get available genres from Spotify
      const availableGenres = await getAvailableGenres(accessToken);
      
      // Use available genres if we got them, otherwise use our default list
      const genrePool = availableGenres.length > 0 ? availableGenres : VALID_SPOTIFY_GENRES;
      
      // Pick 2 random valid genres
      const selectedGenres = genrePool
        .sort(() => 0.5 - Math.random())
        .slice(0, 2)
        .join(',');
      
      recommendationsUrl += `&seed_genres=${selectedGenres}&market=US`;
      console.log(`Using fallback genres for recommendations: ${selectedGenres}`);
      usingFallback = true;
    } else {
      // Use available user data
      if (seedTracks) {
        recommendationsUrl += `&seed_tracks=${seedTracks}`
      }
      
      if (seedArtists) {
        recommendationsUrl += `&seed_artists=${seedArtists}`
      }
      
      // Always add market parameter to improve results
      recommendationsUrl += '&market=US'
    }
    
    console.log(`Recommendations URL: ${recommendationsUrl}`)
    
    // Try to get recommendations from Spotify
    let recommendations;
    try {
      const recommendationsResponse = await fetch(
        recommendationsUrl,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          },
          cache: 'no-store'
        }
      )

      if (recommendationsResponse.ok) {
        recommendations = await recommendationsResponse.json()
        console.log(`Got ${recommendations.tracks?.length || 0} recommendations from Spotify`)
      } else {
        console.error(`Failed to fetch recommendations: ${recommendationsResponse.status}`)
        recommendations = { tracks: [] };
      }
    } catch (error) {
      console.error('Error fetching recommendations:', error)
      recommendations = { tracks: [] };
    }
    
    // Approach 5 (Last resort): If no recommendations, use default popular tracks
    if (!recommendations.tracks || recommendations.tracks.length === 0) {
      console.log('No recommendations returned - using default popular tracks')
      usingDefaultTracks = true;
      
      // Get details for default tracks
      try {
        const defaultTracksResponse = await fetch(
          `https://api.spotify.com/v1/tracks?ids=${DEFAULT_POPULAR_TRACKS.join(',')}&market=US`,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`
            },
            cache: 'no-store'
          }
        )
        
        if (defaultTracksResponse.ok) {
          const defaultTracks = await defaultTracksResponse.json()
          if (defaultTracks.tracks && defaultTracks.tracks.length > 0) {
            recommendations = { tracks: defaultTracks.tracks };
            console.log(`Using ${defaultTracks.tracks.length} default popular tracks`)
          }
        } else {
          console.error(`Failed to fetch default tracks: ${defaultTracksResponse.status}`)
        }
      } catch (error) {
        console.error('Error fetching default tracks:', error)
      }
    }
    
    // If we still have no tracks after all attempts, return empty array
    if (!recommendations.tracks || recommendations.tracks.length === 0) {
      return NextResponse.json({ 
        tracks: [],
        usingFallback,
        usingDefaultTracks
      })
    }
    
    // Get audio features for all recommended tracks to use in our hybrid system
    let audioFeatures = []
    try {
      const trackIds = recommendations.tracks.map((track: any) => track.id).join(',')
      const audioFeaturesResponse = await fetch(
        `https://api.spotify.com/v1/audio-features?ids=${trackIds}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          },
          cache: 'no-store'
        }
      )
      
      if (audioFeaturesResponse.ok) {
        const featuresData = await audioFeaturesResponse.json()
        audioFeatures = featuresData.audio_features
        console.log(`Retrieved audio features for ${audioFeatures.length} tracks`)
      } else {
        console.warn('Could not fetch audio features, continuing with basic recommendations')
      }
    } catch (error) {
      console.error('Error fetching audio features:', error)
    }
    
    // Now enhance the recommendations using our AI endpoint
    console.log('Enhancing recommendations with AI system')
    try {
      const enhanceResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/recommendations/enhance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': `${ACCESS_TOKEN_COOKIE}=${accessToken}`
        },
        body: JSON.stringify({
          tracks: recommendations.tracks,
          audioFeatures,
          preferences: {
            energy: 0.7,
            danceability: 0.6,
            valence: 0.7,
            acousticness: 0.4,
            popularity: 60
          }
        })
      })
      
      if (enhanceResponse.ok) {
        const enhancedRecommendations = await enhanceResponse.json()
        console.log('Successfully enhanced recommendations with AI')
        return NextResponse.json({
          ...enhancedRecommendations,
          usingFallback,
          usingDefaultTracks
        })
      } else {
        console.warn(`Failed to enhance recommendations: ${enhanceResponse.status}`)
      }
    } catch (error) {
      console.error('Error enhancing recommendations:', error)
    }
    
    // Fallback to standard recommendations if enhancement fails
    return NextResponse.json({ 
      tracks: recommendations.tracks,
      usingFallback,
      usingDefaultTracks
    })
  } catch (error) {
    console.error('Error in recommendations route:', error)
    // Return empty tracks instead of error
    return NextResponse.json({ 
      tracks: [],
      usingFallback: true,
      usingDefaultTracks: true,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
} 