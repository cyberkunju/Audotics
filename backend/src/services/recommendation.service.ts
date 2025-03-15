import { Injectable } from '@nestjs/common';
import { DatabaseService } from './database.service';
import * as path from 'path';

interface RecommendationResult {
  trackId: string;
  score: number;
  reasons: string[];
}

@Injectable()
export class RecommendationService {
  constructor(private readonly db: DatabaseService) {
    console.log('Recommendation service initialized');
  }

  /**
   * Calculate similarity between two audio features
   */
  private calculateFeatureSimilarity(features1: any, features2: any): number {
    if (!features1 || !features2) return 0;
    
    // Calculate Euclidean distance between feature vectors
    const distance = Math.sqrt(
      Math.pow((features1.acousticness || 0) - (features2.acousticness || 0), 2) +
      Math.pow((features1.danceability || 0) - (features2.danceability || 0), 2) +
      Math.pow((features1.energy || 0) - (features2.energy || 0), 2) +
      Math.pow((features1.instrumentalness || 0) - (features2.instrumentalness || 0), 2) +
      Math.pow((features1.liveness || 0) - (features2.liveness || 0), 2) +
      Math.pow((features1.speechiness || 0) - (features2.speechiness || 0), 2) +
      Math.pow((features1.valence || 0) - (features2.valence || 0), 2)
    );
    
    // Convert distance to similarity (1 = identical, 0 = completely different)
    // Using a sigmoid-like function to normalize between 0 and 1
    return 1 / (1 + distance);
  }

  /**
   * Generate human-readable reasons for recommendation based on audio features comparison
   */
  private generateRecommendationReasons(
    sourceFeatures: any,
    recommendedFeatures: any,
    similarity: number
  ): string[] {
    const reasons: string[] = [];
    
    // Add general similarity reason
    if (similarity > 0.9) {
      reasons.push('Very similar audio profile');
    } else if (similarity > 0.7) {
      reasons.push('Similar audio profile');
    } else if (similarity > 0.5) {
      reasons.push('Somewhat similar audio profile');
    } else {
      reasons.push('Different but complementary audio profile');
    }
    
    // Compare specific features
    if (Math.abs(sourceFeatures.energy - recommendedFeatures.energy) < 0.1) {
      reasons.push('Similar energy level');
    }
    
    if (Math.abs(sourceFeatures.tempo - recommendedFeatures.tempo) < 10) {
      reasons.push('Similar tempo');
    }
    
    if (Math.abs(sourceFeatures.valence - recommendedFeatures.valence) < 0.15) {
      reasons.push('Similar mood/valence');
    }
    
    if (Math.abs(sourceFeatures.danceability - recommendedFeatures.danceability) < 0.15) {
      reasons.push('Similar danceability');
    }
    
    if (Math.abs(sourceFeatures.acousticness - recommendedFeatures.acousticness) < 0.15) {
      reasons.push('Similar acousticness');
    }
    
    if (sourceFeatures.key === recommendedFeatures.key) {
      reasons.push('Same musical key');
    }
    
    if (sourceFeatures.mode === recommendedFeatures.mode) {
      reasons.push('Same musical mode');
    }
    
    // Ensure we return at least one reason
    if (reasons.length <= 1) {
      reasons.push('Based on content similarity analysis');
    }
    
    return reasons;
  }

  async getPersonalizedRecommendations(userId: string, limit = 20): Promise<any[]> {
    try {
      // Get user's listening history
      const userInteractions = await this.db.trackInteraction.findMany({
        where: { userId },
        select: { trackId: true }
      });
      
      const userTrackIds = userInteractions.map(i => i.trackId);
      console.log(`User ${userId} has ${userTrackIds.length} track interactions`);
      
      // Get all available tracks with audio features
      const tracks = await this.db.track.findMany({
        include: {
          audioFeatures: true
        }
      });
      
      console.log(`Generating recommendations from ${tracks.length} available tracks`);
      
      // If user has no history, return popular tracks
      if (userTrackIds.length === 0) {
        console.log('User has no listening history, returning popular tracks');
        return tracks
          .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
          .slice(0, limit)
          .map(track => ({
            ...track,
            score: (track.popularity || 50) / 100,
            reasons: ['Popular track you might enjoy']
          }));
      }
      
      // Get user's listened tracks
      const userTracks = tracks.filter(t => userTrackIds.includes(t.id));
      
      // Calculate average audio features for user's tracks
      const avgFeatures = {
        acousticness: 0,
        danceability: 0,
        energy: 0,
        instrumentalness: 0,
        liveness: 0,
        speechiness: 0,
        valence: 0,
        tempo: 0,
        key: 0,
        mode: 0
      };
      
      let tracksWithFeatures = 0;
      
      userTracks.forEach(track => {
        if (track.audioFeatures) {
          tracksWithFeatures++;
          avgFeatures.acousticness += track.audioFeatures.acousticness || 0;
          avgFeatures.danceability += track.audioFeatures.danceability || 0;
          avgFeatures.energy += track.audioFeatures.energy || 0;
          avgFeatures.instrumentalness += track.audioFeatures.instrumentalness || 0;
          avgFeatures.liveness += track.audioFeatures.liveness || 0;
          avgFeatures.speechiness += track.audioFeatures.speechiness || 0;
          avgFeatures.valence += track.audioFeatures.valence || 0;
          avgFeatures.tempo += track.audioFeatures.tempo || 0;
          
          // For key and mode, we'll use the most common values later
          avgFeatures.key += track.audioFeatures.key || 0;
          avgFeatures.mode += track.audioFeatures.mode || 0;
        }
      });
      
      // Calculate average
      if (tracksWithFeatures > 0) {
        avgFeatures.acousticness /= tracksWithFeatures;
        avgFeatures.danceability /= tracksWithFeatures;
        avgFeatures.energy /= tracksWithFeatures;
        avgFeatures.instrumentalness /= tracksWithFeatures;
        avgFeatures.liveness /= tracksWithFeatures;
        avgFeatures.speechiness /= tracksWithFeatures;
        avgFeatures.valence /= tracksWithFeatures;
        avgFeatures.tempo /= tracksWithFeatures;
        
        // For key and mode, use the average as an approximation
        avgFeatures.key = Math.round(avgFeatures.key / tracksWithFeatures);
        avgFeatures.mode = Math.round(avgFeatures.mode / tracksWithFeatures);
      }
      
      // Get candidate tracks (exclude user history)
      const candidateTracks = tracks.filter(t => !userTrackIds.includes(t.id) && t.audioFeatures);
      
      // Calculate similarities and generate reasons
      const recommendations: RecommendationResult[] = candidateTracks.map(track => {
        if (!track.audioFeatures) {
          return {
            trackId: track.id,
            score: (track.popularity || 50) / 100,
            reasons: ['Popular track you might enjoy']
          };
        }
        
        const similarity = this.calculateFeatureSimilarity(avgFeatures, track.audioFeatures);
        
        // Generate explanation reasons
        const reasons = this.generateRecommendationReasons(
          avgFeatures,
          track.audioFeatures,
          similarity
        );
        
        return {
          trackId: track.id,
          score: similarity,
          reasons
        };
      });
      
      // Sort by similarity and return top k
      const topRecommendations = recommendations
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
      
      // Get full track information for the recommendations
      const recommendedTrackIds = topRecommendations.map(rec => rec.trackId);
      const recommendedTracks = await this.db.track.findMany({
        where: { id: { in: recommendedTrackIds } },
        include: {
          audioFeatures: true
        }
      });
      
      // Match recommendations with track information
      const enrichedRecommendations = topRecommendations.map(rec => {
        const track = recommendedTracks.find(t => t.id === rec.trackId);
        return {
          ...track,
          score: rec.score,
          reasons: rec.reasons
        };
      });
      
      return enrichedRecommendations;
    } catch (error) {
      console.error('Error getting personalized recommendations:', error);
      
      // Fallback to popularity-based recommendations
    const tracks = await this.db.track.findMany({
      take: limit,
      orderBy: {
        popularity: 'desc'
      },
      include: {
        audioFeatures: true
      }
    });

      return tracks.map(track => ({
        ...track,
        score: (track.popularity || 50) / 100,
        reasons: ['Popular track you might enjoy']
      }));
    }
  }

  async getGroupRecommendations(userIds: string[], limit = 20) {
    // This is a placeholder for group recommendation logic
    // In a real implementation, this would aggregate preferences from all users
    // and use collaborative filtering or other algorithms
    
    try {
      // Get all users' listening history
      const userInteractions = await this.db.trackInteraction.findMany({
        where: { userId: { in: userIds } },
        select: { trackId: true, userId: true }
      });
      
      // Group tracks by user
      const userTracks = new Map<string, Set<string>>();
      userIds.forEach(id => userTracks.set(id, new Set()));
      
      userInteractions.forEach(interaction => {
        const userTrackSet = userTracks.get(interaction.userId);
        if (userTrackSet) {
          userTrackSet.add(interaction.trackId);
        }
      });
      
      // Find tracks that multiple users have listened to
      const trackCounts = new Map<string, number>();
      userInteractions.forEach(interaction => {
        const count = trackCounts.get(interaction.trackId) || 0;
        trackCounts.set(interaction.trackId, count + 1);
      });
      
      // Get all available tracks with audio features
      const tracks = await this.db.track.findMany({
        include: {
          audioFeatures: true
        }
      });
      
      // Score tracks based on group preferences
      const scoredTracks = tracks.map(track => {
        // How many users have listened to this track
        const userCount = trackCounts.get(track.id) || 0;
        const userRatio = userCount / userIds.length;
        
        // Popularity factor
        const popularity = track.popularity || 50;
        
        // Combined score (70% user overlap, 30% popularity)
        const score = (userRatio * 0.7) + (popularity / 100 * 0.3);
        
        return {
          ...track,
          score,
          reasons: [
            userCount > 0 
              ? `${userCount} group members have listened to this track` 
              : 'Popular track for your group'
          ]
        };
      });
      
      // Sort by score and return top tracks
      return scoredTracks
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
    } catch (error) {
      console.error('Error getting group recommendations:', error);
      
      // Fallback to popularity-based recommendations
    const tracks = await this.db.track.findMany({
      take: limit,
      orderBy: {
        popularity: 'desc'
      },
      include: {
        audioFeatures: true
      }
    });

      return tracks.map(track => ({
        ...track,
        score: (track.popularity || 50) / 100,
        reasons: ['Popular track for your group']
      }));
    }
  }
} 