import { Injectable } from '@nestjs/common';
import { Track, TrackFeatures } from '@prisma/client';

/**
 * Interface for NLP recommendation request
 */
export interface NLPRecommendationRequest {
  query: string;
  userId?: string;
  limit?: number;
}

/**
 * Interface for mood detection results
 */
export interface MoodAnalysisResult {
  primaryMood: string;
  confidence: number;
  secondaryMoods: Array<{mood: string, confidence: number}>;
}

/**
 * Interface for context detection results
 */
export interface ContextAnalysisResult {
  location?: string;
  activity?: string;
  weather?: string;
  timeOfDay?: string;
  social?: string;
}

/**
 * Interface for music attribute detection results
 */
export interface MusicAttributesResult {
  genres?: string[];
  artists?: string[];
  era?: string;
  tempo?: 'slow' | 'medium' | 'fast';
  instruments?: string[];
  characteristics?: string[];
}

/**
 * Interface for NLP analysis results
 */
export interface NLPAnalysisResult {
  mood: MoodAnalysisResult;
  context: ContextAnalysisResult;
  musicAttributes: MusicAttributesResult;
  originalQuery: string;
}

/**
 * Model for generating music recommendations based on natural language input
 */
export class NLPRecommendationModel {
  /**
   * Analyze a natural language query to extract mood, context, and music attributes
   */
  public analyzeQuery(query: string): NLPAnalysisResult {
    // This is a placeholder implementation
    // In a real implementation, this would use NLP techniques or an LLM API
    
    const result: NLPAnalysisResult = {
      mood: {
        primaryMood: 'neutral',
        confidence: 0.5,
        secondaryMoods: []
      },
      context: {},
      musicAttributes: {},
      originalQuery: query
    };
    
    // Simple keyword-based analysis for demonstration
    // Mood detection
    if (query.includes('sad') || query.includes('depressed') || query.includes('melancholy')) {
      result.mood.primaryMood = 'sad';
      result.mood.confidence = 0.8;
    } else if (query.includes('happy') || query.includes('cheerful') || query.includes('joy')) {
      result.mood.primaryMood = 'happy';
      result.mood.confidence = 0.8;
    } else if (query.includes('energetic') || query.includes('pumped') || query.includes('workout')) {
      result.mood.primaryMood = 'energetic';
      result.mood.confidence = 0.8;
    } else if (query.includes('relaxed') || query.includes('calm') || query.includes('chill')) {
      result.mood.primaryMood = 'relaxed';
      result.mood.confidence = 0.8;
    }
    
    // Context detection
    if (query.includes('raining') || query.includes('rainy')) {
      result.context.weather = 'rainy';
    }
    if (query.includes('gym') || query.includes('workout') || query.includes('exercise')) {
      result.context.activity = 'workout';
    }
    if (query.includes('party') || query.includes('friends')) {
      result.context.social = 'party';
    }
    if (query.includes('morning')) {
      result.context.timeOfDay = 'morning';
    } else if (query.includes('night') || query.includes('evening')) {
      result.context.timeOfDay = 'night';
    }
    
    // Music attributes detection
    if (query.includes('bass')) {
      result.musicAttributes.characteristics = ['bass'];
    }
    if (query.includes('beats')) {
      if (!result.musicAttributes.characteristics) {
        result.musicAttributes.characteristics = [];
      }
      result.musicAttributes.characteristics.push('beats');
    }
    
    // Artist detection
    if (query.includes('adele')) {
      result.musicAttributes.artists = ['Adele'];
    }
    
    // Genre detection
    if (query.includes('wildwest') || query.includes('western')) {
      result.musicAttributes.genres = ['country', 'western'];
    }
    if (query.includes('evergreen')) {
      result.musicAttributes.era = 'classic';
    }
    
    return result;
  }
  
  /**
   * Convert NLP analysis to audio feature preferences
   */
  private analysisToAudioFeatures(analysis: NLPAnalysisResult): Partial<TrackFeatures> {
    const features: Partial<TrackFeatures> = {};
    
    // Map mood to valence and energy
    switch (analysis.mood.primaryMood) {
      case 'happy':
        features.valence = 0.8;
        features.energy = 0.7;
        break;
      case 'sad':
        features.valence = 0.2;
        features.energy = 0.3;
        break;
      case 'energetic':
        features.energy = 0.9;
        features.tempo = 140;
        break;
      case 'relaxed':
        features.energy = 0.3;
        features.acousticness = 0.7;
        break;
    }
    
    // Map context to features
    if (analysis.context.activity === 'workout') {
      features.energy = 0.9;
      features.tempo = 150;
    }
    if (analysis.context.weather === 'rainy') {
      features.acousticness = 0.7;
      features.energy = features.energy ? Math.min(features.energy, 0.5) : 0.5;
    }
    
    // Map music attributes
    if (analysis.musicAttributes.characteristics?.includes('bass')) {
      features.energy = 0.8;
    }
    
    return features;
  }
  
  /**
   * Generate recommendations based on a natural language query
   */
  public async getRecommendationsFromQuery(
    request: NLPRecommendationRequest,
    availableTracks: Array<Track & { audioFeatures: TrackFeatures | null }>
  ): Promise<Track[]> {
    const analysis = this.analyzeQuery(request.query);
    const preferredFeatures = this.analysisToAudioFeatures(analysis);
    
    // Filter tracks with audio features
    const tracksWithFeatures = availableTracks.filter(t => t.audioFeatures !== null);
    
    if (tracksWithFeatures.length === 0) {
      return [];
    }
    
    // Score tracks based on feature similarity
    const scoredTracks = tracksWithFeatures.map(track => {
      let score = 0;
      let matchCount = 0;
      
      // Calculate similarity score based on audio features
      Object.entries(preferredFeatures).forEach(([key, value]) => {
        const trackValue = track.audioFeatures[key];
        if (typeof trackValue === 'number' && typeof value === 'number') {
          // Calculate difference (0 = perfect match, 1 = maximum difference)
          const difference = Math.abs(trackValue - value);
          // Convert to similarity (1 = perfect match, 0 = maximum difference)
          const similarity = 1 - difference;
          score += similarity;
          matchCount++;
        }
      });
      
      // Artist matching
      if (analysis.musicAttributes.artists?.length) {
        const artistMatch = analysis.musicAttributes.artists.some(artist => 
          track.artists?.some(trackArtist => 
            trackArtist.toLowerCase().includes(artist.toLowerCase())
          )
        );
        if (artistMatch) {
          score += 2; // Strong bonus for artist match
          matchCount++;
        }
      }
      
      // Calculate average score
      const avgScore = matchCount > 0 ? score / matchCount : 0;
      
      return {
        track,
        score: avgScore
      };
    });
    
    // Sort by score and return top tracks
    const limit = request.limit || 10;
    return scoredTracks
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(item => item.track);
  }
} 