import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { ACCESS_TOKEN_COOKIE } from '@/lib/spotify-auth/constants';

// This is a simple implementation that simulates AI enhancement
// In a production environment, this would connect to a real ML model
export async function POST(request: Request) {
  try {
    // Parse the request body, with validation
    let body;
    try {
      body = await request.json();
    } catch (error) {
      console.error('Failed to parse request body:', error);
      return NextResponse.json(
        { message: 'Invalid request body', tracks: [] },
        { status: 400 }
      );
    }

    const { tracks, audioFeatures, preferences } = body;

    // Validate input data
    if (!tracks || !Array.isArray(tracks) || tracks.length === 0) {
      console.warn('Invalid or empty tracks array provided to enhance endpoint');
      return NextResponse.json(
        { message: 'No tracks provided to enhance', tracks: [] },
        { status: 200 }  // Return 200 for empty but valid requests
      );
    }

    const cookieStore = await cookies();
    const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;

    if (!accessToken) {
      console.error('No access token provided to enhance endpoint');
      return NextResponse.json(
        { message: 'Unauthorized', tracks: [] },
        { status: 401 }
      );
    }

    // Process tracks with our hybrid recommendation system
    const enhancedTracks = await processWithHybridSystem(tracks, audioFeatures, preferences);

    return NextResponse.json(enhancedTracks);
  } catch (error) {
    console.error('AI enhancement error:', error);
    // Return the original tracks if available
    const tracks = (error as any)?.tracks || [];
    return NextResponse.json(
      { 
        message: 'Internal server error in enhancement', 
        tracks 
      },
      { status: 200 } // Return 200 with original tracks as fallback
    );
  }
}

async function processWithHybridSystem(tracks: any[], audioFeatures: any = [], preferences: any = {}) {
  try {
    // Validate or set default preferences
    const validatedPreferences = {
      energy: typeof preferences?.energy === 'number' ? preferences.energy : 0.6,
      danceability: typeof preferences?.danceability === 'number' ? preferences.danceability : 0.6,
      valence: typeof preferences?.valence === 'number' ? preferences.valence : 0.6,
      acousticness: typeof preferences?.acousticness === 'number' ? preferences.acousticness : 0.5,
      popularity: typeof preferences?.popularity === 'number' ? preferences.popularity : 60
    };
    
    // Make sure audioFeatures is an array
    const validAudioFeatures = Array.isArray(audioFeatures) ? audioFeatures : [];
    
    // Process each track with simulated AI scoring
    const enhancedTracks = tracks.map((track: any) => {
      if (!track) return null; // Skip null/undefined tracks
      
      // Get audio features for this track
      const features = validAudioFeatures.find((f: any) => f && f.id === track.id);
      
      // Calculate a score based on audio features and preferences
      let score = 50; // Default baseline score
      let matchReasons = [];
      
      // Base popularity score (0-100)
      const popularityScore = track.popularity || 50;
      score += (popularityScore / 100) * 30; // 30% weight to popularity
      
      if (popularityScore > 70) {
        matchReasons.push('Popular track that many users enjoy');
      }
      
      // Process audio features if available
      if (features) {
        // Match energy preference
        if (Math.abs(features.energy - validatedPreferences.energy) < 0.2) {
          score += 20;
          if (features.energy > 0.7) {
            matchReasons.push('High energy track matching your preferences');
          } else if (features.energy < 0.3) {
            matchReasons.push('Calm, low energy track matching your mood preferences');
          } else {
            matchReasons.push('Energy level matches your preferences');
          }
        }
        
        // Match danceability preference
        if (Math.abs(features.danceability - validatedPreferences.danceability) < 0.2) {
          score += 20;
          if (features.danceability > 0.7) {
            matchReasons.push('Very danceable track');
          } else {
            matchReasons.push('Danceability matches your preferences');
          }
        }
        
        // Match valence (positivity) preference
        if (Math.abs(features.valence - validatedPreferences.valence) < 0.2) {
          score += 15;
          if (features.valence > 0.7) {
            matchReasons.push('Upbeat, positive vibe');
          } else if (features.valence < 0.3) {
            matchReasons.push('Emotional or melancholic mood');
          } else {
            matchReasons.push('Emotional tone matches your preferences');
          }
        }
        
        // Match acousticness preference
        if (Math.abs(features.acousticness - validatedPreferences.acousticness) < 0.2) {
          score += 15;
          if (features.acousticness > 0.7) {
            matchReasons.push('Acoustic sound matching your preferences');
          } else if (features.acousticness < 0.3) {
            matchReasons.push('Electronic/produced sound matching your taste');
          }
        }
      } else {
        // If no features, add some default reasons
        matchReasons.push('Based on your listening history');
      }
      
      // Add artist-based reason
      if (track.artists && track.artists.length > 0) {
        matchReasons.push(`Similar to other ${track.artists[0].name} tracks you might enjoy`);
      }
      
      // Normalize score to 0-100 range
      score = Math.min(Math.max(score, 30), 98);
      
      // Add small random factor for variety (±2%)
      score += (Math.random() * 4) - 2;
      
      // Round score for cleaner UI
      score = Math.round(score);
      
      // Ensure we have at least one reason
      if (matchReasons.length === 0) {
        matchReasons.push('Based on your listening patterns');
      }
      
      // Limit to top 3 reasons
      if (matchReasons.length > 3) {
        matchReasons = matchReasons.slice(0, 3);
      }
      
      return {
        ...track,
        ai_score: score,
        match_reasons: matchReasons
      };
    }).filter(Boolean); // Remove any null entries
    
    // Sort tracks by AI score
    enhancedTracks.sort((a: any, b: any) => b.ai_score - a.ai_score);
    
    return {
      tracks: enhancedTracks,
      message: 'Recommendations enhanced with hybrid AI system'
    };
  } catch (error) {
    console.error('AI processing error:', error);
    return {
      tracks,
      message: 'Failed to enhance recommendations with AI',
    };
  }
} 