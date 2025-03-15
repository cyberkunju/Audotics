import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../../services/database.service';
import { SpotifyService } from '../../services/spotify.service';
import { ContentBasedModel, AudioFeatures, ModelEvalMetrics, RecommendationResult } from '../models/content-based.model';
import { Track, TrackFeatures, User } from '@prisma/client';

// Extend the Track type to include possible genres property
interface ExtendedTrack extends Track {
  genres?: string | null;
}

/**
 * Service for managing ML data, training, and generating recommendations
 */
@Injectable()
export class MLDataService {
  private contentModel: ContentBasedModel;
  private readonly logger = new Logger(MLDataService.name);

  constructor(
    private database: DatabaseService,
    private spotify: SpotifyService
  ) {
    this.contentModel = new ContentBasedModel();
    this.initializeModel();
  }

  /**
   * Initialize the ML model, loading from disk if available
   */
  private async initializeModel(): Promise<void> {
    try {
      const loaded = await this.contentModel.loadModel();
      if (loaded) {
        this.logger.log('Content-based model loaded from disk');
      } else {
        this.logger.log('No saved model found, model will be initialized with random weights');
        this.logger.log('Call trainModel() to train the model with user data');
      }
    } catch (error) {
      this.logger.error('Error initializing model', error);
    }
  }

  /**
   * Prepare training data from user listening history
   */
  async prepareTrainingData() {
    this.logger.log('Preparing training data from user listening history');
    
    // Get all tracks with audio features
    const tracks = await this.database.track.findMany({
      include: {
        audioFeatures: true,
        interactions: {
          include: {
            user: true
          }
        }
      }
    });

    // Filter tracks that have audio features
    const tracksWithFeatures = tracks.filter(t => t.audioFeatures);
    this.logger.log(`Found ${tracksWithFeatures.length} tracks with audio features`);

    // Group tracks by user
    const userTracks = tracks.reduce((acc: Map<string, Track[]>, track) => {
      track.interactions.forEach(interaction => {
        if (!acc.has(interaction.userId)) {
          acc.set(interaction.userId, []);
        }
        acc.get(interaction.userId)!.push(track);
      });
      return acc;
    }, new Map<string, Track[]>());

    this.logger.log(`Found listening history for ${userTracks.size} users`);

    // Create similar pairs based on user listening history
    const similarPairs: [number, number][] = [];
    const trackIndices = new Map(
      tracksWithFeatures.map((t, i) => [t.id, i])
    );
    
    // Create a map to store pair scores
    const pairScores = new Map<string, number>();

    // Create pairs from user's listened tracks
    userTracks.forEach((userTracksList, userId) => {
      // Remove duplicates - convert to string IDs
      const uniqueTrackIds = [...new Set(userTracksList.map(track => track.id))];
      
      // Only process users with at least 2 tracks
      if (uniqueTrackIds.length >= 2) {
        // Create all possible pairs
        for (let i = 0; i < uniqueTrackIds.length; i++) {
          for (let j = i + 1; j < uniqueTrackIds.length; j++) {
            const track1Id = uniqueTrackIds[i];
            const track2Id = uniqueTrackIds[j];
            
            const idx1 = trackIndices.get(track1Id);
            const idx2 = trackIndices.get(track2Id);
            
            if (typeof idx1 === 'number' && typeof idx2 === 'number') {
              // Store pair score (default basic score)
              const pairKey1 = `${idx1}-${idx2}`;
              const pairKey2 = `${idx2}-${idx1}`;
              
              pairScores.set(pairKey1, (pairScores.get(pairKey1) || 0) + 0.8);
              pairScores.set(pairKey2, (pairScores.get(pairKey2) || 0) + 0.8);
              
              // Add pairs in both directions for symmetric learning
              similarPairs.push([idx1, idx2]);
              similarPairs.push([idx2, idx1]);
            }
          }
        }
      }
    });

    this.logger.log(`Created ${similarPairs.length} similar track pairs from user history`);

    // Add genre-based pairs if we still need more
    if (similarPairs.length < 1000) {
      this.logger.log('Adding genre-based pairs to supplement training data');
      
      // Group tracks by genre
      const genreMap = new Map<string, string[]>();
      
      // Cast to ExtendedTrack to handle genres property
      tracksWithFeatures.forEach((track) => {
        const extendedTrack = track as unknown as ExtendedTrack;
        if (extendedTrack.genres) {
          try {
            const genres = JSON.parse(extendedTrack.genres);
            if (Array.isArray(genres)) {
              genres.forEach(genre => {
                if (!genreMap.has(genre)) {
                  genreMap.set(genre, []);
                }
                genreMap.get(genre)!.push(track.id);
              });
            }
          } catch (e) {
            // Skip if genres is not JSON parseable
            this.logger.warn(`Could not parse genres for track ${track.id}`);
          }
        }
      });
      
      let genrePairsCount = 0;
      
      // For each genre with at least 2 tracks, create pairs
      genreMap.forEach((trackIds, genre) => {
        if (trackIds.length >= 2) {
          // Limit the number of pairs per genre to avoid bias
          const maxPairsPerGenre = 100;
          let pairsCreated = 0;
          
          // Shuffle track IDs for random pair selection
          const shuffledIds = [...trackIds].sort(() => Math.random() - 0.5);
          
          for (let i = 0; i < shuffledIds.length && pairsCreated < maxPairsPerGenre; i++) {
            for (let j = i + 1; j < shuffledIds.length && pairsCreated < maxPairsPerGenre; j++) {
              const idx1 = trackIndices.get(shuffledIds[i]);
              const idx2 = trackIndices.get(shuffledIds[j]);
              
              if (typeof idx1 === 'number' && typeof idx2 === 'number') {
                const pairKey1 = `${idx1}-${idx2}`;
                const pairKey2 = `${idx2}-${idx1}`;
                
                if (!pairScores.has(pairKey1)) {
                  similarPairs.push([idx1, idx2]);
                  similarPairs.push([idx2, idx1]);
                  pairScores.set(pairKey1, 0.3); // Genre-based pairs get lower score
                  pairScores.set(pairKey2, 0.3);
                  genrePairsCount += 2;
                  pairsCreated += 2;
                }
              }
            }
          }
        }
      });
      
      this.logger.log(`Added ${genrePairsCount} genre-based pairs`);
    }

    this.logger.log(`Total training pairs: ${similarPairs.length}`);

    return {
      features: tracksWithFeatures.map(t => t.audioFeatures!),
      similarPairs,
      trackIds: tracksWithFeatures.map(t => t.id),
      pairScores
    };
  }

  /**
   * Train the content-based model with user listening data
   */
  async trainModel(epochs: number = 50, validationSplit: number = 0.2, batchSize: number = 32): Promise<any> {
    this.logger.log(`Training content-based model with ${epochs} epochs and ${validationSplit} validation split`);
    
    const { features, similarPairs, trackIds, pairScores } = await this.prepareTrainingData();
    
    if (similarPairs.length === 0) {
      throw new Error('No training pairs available. Need user listening history data.');
    }
    
    this.logger.log(`Starting training with ${features.length} tracks and ${similarPairs.length} pairs`);
    
    // Split into training and test sets
    const testSize = Math.floor(similarPairs.length * 0.1); // 10% for testing
    const shuffledIndices = Array.from({ length: similarPairs.length }, (_, i) => i)
      .sort(() => Math.random() - 0.5);
    
    const testIndices = shuffledIndices.slice(0, testSize);
    const trainIndices = shuffledIndices.slice(testSize);
    
    const testPairs = testIndices.map(i => similarPairs[i]);
    const trainPairs = trainIndices.map(i => similarPairs[i]);
    
    // Configure early stopping
    const earlyStoppingOptions = {
      minDelta: 0.001, // Minimum improvement required to continue training
      patience: 5,     // Number of epochs to wait for improvement before stopping
      monitor: 'val_loss' // Monitor validation loss for early stopping
    };
    
    // Train the model with early stopping
    this.logger.log(`Training with ${trainPairs.length} pairs and testing with ${testPairs.length} pairs`);
    
    try {
      // Train the model
      const history = await this.contentModel.train(
        features, 
        trainPairs, 
        trackIds, 
        epochs, 
        batchSize, 
        validationSplit
      );
      
      // Evaluate the model
      this.logger.log('Training complete, evaluating model on test set');
      const evalMetrics = await this.contentModel.evaluateModel(features, testPairs, trackIds);
      
      this.logger.log('Model training complete. Evaluation metrics:');
      this.logger.log(`Precision: ${evalMetrics.precision.toFixed(4)}`);
      this.logger.log(`Recall: ${evalMetrics.recall.toFixed(4)}`);
      this.logger.log(`F1 Score: ${evalMetrics.f1Score.toFixed(4)}`);
      this.logger.log(`MAP: ${evalMetrics.meanAveragePrecision.toFixed(4)}`);
      this.logger.log(`NDCG: ${evalMetrics.ndcg.toFixed(4)}`);
      
      // Save some evaluation examples for reference
      await this.saveEvaluationExamples(features, trackIds, 5);
      
      return {
        history,
        metrics: evalMetrics
      };
    } catch (error) {
      this.logger.error('Error training model:', error);
      throw error;
    }
  }

  /**
   * Save evaluation examples to check recommendation quality
   */
  private async saveEvaluationExamples(
    features: AudioFeatures[], 
    trackIds: string[], 
    numExamples: number
  ): Promise<void> {
    this.logger.log(`Generating ${numExamples} recommendation examples for evaluation`);
    
    // Pick random tracks as query examples
    const trackIndices = Array.from({ length: features.length }, (_, i) => i)
      .sort(() => Math.random() - 0.5)
      .slice(0, numExamples);
    
    for (let i = 0; i < trackIndices.length; i++) {
      const queryIdx = trackIndices[i];
      const queryTrackId = trackIds[queryIdx];
      
      // Get query track
      const queryTrack = await this.database.track.findUnique({
        where: { id: queryTrackId },
        include: { audioFeatures: true }
      });
      
      if (!queryTrack) continue;
      
      this.logger.log(`Example ${i+1}: Recommendations for "${queryTrack.name}" by ${queryTrack.artists.join(', ')}`);
      
      // Get recommendations
      try {
        const recommendations = await this.getSimilarTracks(queryTrack.id, 5);
        
        // Get the full track information for each recommendation
        const tracksInfo = await this.database.track.findMany({
          where: {
            id: {
              in: recommendations.map(rec => rec.trackId)
            }
          }
        });
        
        // Create a map of track ID to track information
        const trackMap = new Map(
          tracksInfo.map(track => [track.id, track])
        );
        
        // Log recommendations
        recommendations.forEach((rec, idx) => {
          const track = trackMap.get(rec.trackId);
          if (track) {
            this.logger.log(`  ${idx+1}. "${track.name}" by ${track.artists.join(', ')} (score: ${rec.score.toFixed(4)})`);
          } else {
            this.logger.log(`  ${idx+1}. Unknown track (ID: ${rec.trackId}) (score: ${rec.score.toFixed(4)})`);
          }
        });
      } catch (error) {
        this.logger.error(`Failed to get recommendations for example ${i+1}:`, error);
      }
    }
  }

  /**
   * Get personalized recommendations for a user
   */
  async getRecommendationsForUser(userId: string, limit: number = 10): Promise<RecommendationResult[]> {
    const user = await this.database.user.findUnique({
      where: { id: userId }
    });
    
    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }
    
    // Get user's listening history
    const userInteractions = await this.database.trackInteraction.findMany({
      where: { userId },
      select: { trackId: true }
    });
    
    const userTrackIds = userInteractions.map(i => i.trackId);
    this.logger.log(`User ${userId} has ${userTrackIds.length} track interactions`);
    
    // Get all available tracks with audio features
    const tracks = await this.database.track.findMany({
      include: {
        audioFeatures: true
      }
    });
    
    // Generate recommendations
    this.logger.log(`Generating recommendations from ${tracks.length} available tracks`);
    return await this.contentModel.getRecommendations(tracks, userTrackIds, limit);
  }

  /**
   * Get similar tracks to a specific track
   */
  async getSimilarTracks(trackId: string, limit: number = 10): Promise<RecommendationResult[]> {
    // Get target track with audio features
    const targetTrack = await this.database.track.findUnique({
      where: { id: trackId },
      include: { audioFeatures: true }
    });

    if (!targetTrack?.audioFeatures) {
      throw new Error('Track audio features not found');
    }

    // Get candidate tracks
    const candidateTracks = await this.database.track.findMany({
      where: {
        NOT: { id: trackId },
        audioFeatures: { isNot: null }
      },
      include: { audioFeatures: true }
    });

    // Get similar tracks using the model
    const similarTracks = await this.contentModel.getSimilarTracks(
      targetTrack.audioFeatures,
      candidateTracks.map(t => t.audioFeatures!),
      candidateTracks.map(t => t.id),
      limit
    );

    // Format results with reasons
    return similarTracks.map(similar => ({
      trackId: similar.trackId,
      score: similar.similarity,
      reasons: [
        `Similar sound profile to "${targetTrack.name}"`,
        similar.similarity > 0.8 ? 'Very high audio similarity' : 'Matches audio characteristics'
      ]
    }));
  }

  /**
   * Evaluate the model on current data
   */
  async evaluateModel(): Promise<ModelEvalMetrics> {
    const { features, similarPairs, trackIds } = await this.prepareTrainingData();
    
    if (similarPairs.length === 0) {
      throw new Error('No data available for evaluation');
    }
    
    // Use all pairs for evaluation since we're just testing
    return await this.contentModel.evaluateModel(features, similarPairs, trackIds);
  }

  /**
   * Update track features from Spotify
   */
  async updateTrackFeatures(trackId: string): Promise<TrackFeatures> {
    // Get user access token from database
    const user = await this.database.user.findFirst({
      where: {
        spotifyAccessToken: { not: null }
      }
    });

    if (!user?.spotifyAccessToken) {
      throw new Error('No user with valid Spotify access token found');
    }

    // Get audio features from Spotify
    const features = await this.spotify.getAudioFeatures(user.spotifyAccessToken, [trackId]);
    
    if (!features || !features.length) {
      throw new Error('Could not fetch audio features');
    }

    // Update database with new features
    return await this.database.trackFeatures.upsert({
      where: { trackId },
      create: {
        trackId,
        ...features[0]
      },
      update: features[0]
    });
  }

  /**
   * Batch update audio features for multiple tracks
   */
  async batchUpdateAudioFeatures(limit: number = 50): Promise<number> {
    // Get tracks without audio features
    const tracksWithoutFeatures = await this.database.track.findMany({
      where: {
        audioFeatures: null
      },
      take: limit
    });
    
    if (tracksWithoutFeatures.length === 0) {
      return 0;
    }
    
    this.logger.log(`Fetching audio features for ${tracksWithoutFeatures.length} tracks`);
    
    // Get a user with a valid token
    const user = await this.database.user.findFirst({
      where: {
        spotifyAccessToken: { not: null }
      }
    });
    
    if (!user?.spotifyAccessToken) {
      throw new Error('No user with valid Spotify access token found');
    }
    
    // Process in batches of 20 (Spotify API limit)
    const batchSize = 20;
    let processed = 0;
    
    for (let i = 0; i < tracksWithoutFeatures.length; i += batchSize) {
      const batch = tracksWithoutFeatures.slice(i, i + batchSize);
      const trackIds = batch.map(t => t.id);
      
      try {
        const featuresArray = await this.spotify.getAudioFeatures(user.spotifyAccessToken, trackIds);
        
        if (featuresArray && featuresArray.length > 0) {
          // Update features in the database
          await Promise.all(featuresArray.map(async (features, idx) => {
            if (features) {
              await this.database.trackFeatures.upsert({
                where: { trackId: trackIds[idx] },
                create: {
                  trackId: trackIds[idx],
                  ...features
                },
                update: features
              });
              processed++;
            }
          }));
        }
        
        // Wait a bit to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        this.logger.error(`Error fetching audio features for batch: ${error.message}`);
      }
    }
    
    this.logger.log(`Successfully updated features for ${processed} tracks`);
    return processed;
  }

  /**
   * Finalize Weights & Biases run, closing the session properly
   */
  async finalizeWandbRun(): Promise<void> {
    try {
      if (this.contentModel) {
        await this.contentModel.finalize();
        this.logger.log('Successfully finalized Weights & Biases run');
      }
    } catch (error) {
      this.logger.error('Error finalizing Weights & Biases run', error);
      // Still return, don't throw, as this is cleanup functionality
    }
  }
} 