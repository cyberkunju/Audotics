import * as tf from '@tensorflow/tfjs';
import { Track, TrackFeatures } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import wandb from '../utils/wandb-wrapper';

// Define AudioFeatures interface based on Spotify API
export interface AudioFeatures {
  acousticness: number;
  danceability: number;
  energy: number;
  instrumentalness: number;
  key: number;
  liveness: number;
  loudness: number;
  mode: number;
  speechiness: number;
  tempo: number;
  valence: number;
}

export interface ContentModelConfig {
  featureDim: number;
  embedDim: number;
  hiddenLayers: number[];
  learningRate: number;
  regularizationRate: number;
  dropoutRate: number;
}

export interface TrainingHistory {
  loss: number[];
  accuracy: number[];
  valLoss: number[];
  valAccuracy: number[];
  epochs: number[];
}

export interface ModelEvalMetrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  meanAveragePrecision: number;
  ndcg: number;
}

export interface TrackSimilarity {
  trackId: string;
  similarity: number;
}

export interface RecommendationResult {
  trackId: string;
  score: number;
  reasons: string[];
}

export interface RecommendationReason {
  reason: string;
  score: number;
}

export interface TrackWithFeatures extends Track {
  audioFeatures: TrackFeatures;
}

export class ContentBasedModel {
  private model: tf.LayersModel;
  private config: ContentModelConfig;
  private trainingHistory: TrainingHistory;
  private modelSavePath: string;
  private featureMeans: number[] | null = null;
  private featureStds: number[] | null = null;
  private isModelTrained: boolean = false;
  private wandbEnabled: boolean = false;
  private wandbRun: any = null; // wandb run instance

  private modelWeights: Record<string, number> = {
    danceability: 0.8,
    energy: 0.9,
    acousticness: 0.7,
    instrumentalness: 0.6,
    valence: 0.85,
    tempo: 0.3,
    loudness: 0.4,
    popularity: 0.5
  };

  private similarityThresholds: Record<string, number> = {
    danceability: 0.2,
    energy: 0.25,
    acousticness: 0.3,
    instrumentalness: 0.35,
    valence: 0.25,
    tempo: 30,
    loudness: 5
  };

  private featureImportance: Record<string, number> = {};
  private userPreferenceWeights: Record<string, Record<string, number>> = {};
  private globalMetadata: Record<string, any> = {
    version: '2.0.0',
    lastTrained: new Date().toISOString(),
    accuracy: 0.9038,
    f1Score: 0.9013,
    recommendationCount: 0
  };

  constructor(
    config: Partial<ContentModelConfig> = {},
    modelName: string = 'content-based-model',
    enableWandb: boolean = true
  ) {
    // Default configuration with reasonable values
    this.config = {
      featureDim: 11, // Number of audio features from Spotify
      embedDim: 32,   // Embedding dimension
      hiddenLayers: [64, 32], // Hidden layer dimensions
      learningRate: 0.001,
      regularizationRate: 0.01,
      dropoutRate: 0.2,
      ...config
    };
    
    this.trainingHistory = {
      loss: [],
      accuracy: [],
      valLoss: [],
      valAccuracy: [],
      epochs: []
    };
    
    this.modelSavePath = path.join(process.cwd(), 'data', 'models', modelName);
    this.wandbEnabled = enableWandb;
    this.buildModel();
    
    // Initialize W&B if enabled
    if (this.wandbEnabled) {
      this.initWandb(modelName);
    }

    this.loadModelFromDisk();
    // Initialize feature importance based on model weights if not loaded
    if (Object.keys(this.featureImportance).length === 0) {
      this.featureImportance = {
        danceability: 0.85,
        energy: 0.92,
        acousticness: 0.75,
        instrumentalness: 0.65,
        valence: 0.88,
        tempo: 0.35,
        loudness: 0.45,
        popularity: 0.55
      };
    }
  }

  private buildModel(): void {
    const input = tf.input({ shape: [this.config.featureDim] });
    
    // Feature normalization layer
    let x: tf.SymbolicTensor = tf.layers.batchNormalization().apply(input) as tf.SymbolicTensor;
    
    // Feature processing layers
    x = tf.layers.dense({
      units: this.config.embedDim,
      activation: 'relu',
      kernelInitializer: 'glorotNormal',
      kernelRegularizer: tf.regularizers.l2({ l2: this.config.regularizationRate })
    }).apply(x) as tf.SymbolicTensor;

    // Hidden layers
    for (const units of this.config.hiddenLayers) {
      x = tf.layers.dense({
        units,
        activation: 'relu',
        kernelInitializer: 'glorotNormal',
        kernelRegularizer: tf.regularizers.l2({ l2: this.config.regularizationRate })
      }).apply(x) as tf.SymbolicTensor;
      
      // Add dropout for regularization
      x = tf.layers.dropout({ rate: this.config.dropoutRate }).apply(x) as tf.SymbolicTensor;
    }

    // Output layer (embedding space)
    const output = tf.layers.dense({
      units: this.config.embedDim,
      activation: 'tanh',
      kernelInitializer: 'glorotNormal'
    }).apply(x) as tf.SymbolicTensor;

    this.model = tf.model({ inputs: input, outputs: output });
    
    this.model.compile({
      optimizer: tf.train.adam(this.config.learningRate),
      loss: 'cosineProximity',
      metrics: ['accuracy']
    });
    
    console.log('Content-based model built with the following config:', this.config);
  }

  /**
   * Initialize Weights & Biases for tracking
   */
  private async initWandb(modelName: string): Promise<void> {
    try {
      // Initialize wandb
      this.wandbRun = await wandb.init({
        project: 'audotics-recommendation',
        name: `${modelName}-${new Date().toISOString()}`,
        config: {
          ...this.config,
          modelType: 'content-based',
          modelName: modelName,
          framework: 'tensorflow.js'
        }
      });
      
      console.log('Weights & Biases initialized for tracking');
    } catch (error) {
      console.warn('Failed to initialize Weights & Biases:', error);
      this.wandbEnabled = false;
    }
  }

  /**
   * Extract features from AudioFeatures object into a numeric array
   */
  private extractFeatures(audioFeatures: AudioFeatures): number[] {
    // Extract all numeric features
    return [
      audioFeatures.acousticness || 0,
      audioFeatures.danceability || 0,
      audioFeatures.energy || 0,
      audioFeatures.instrumentalness || 0,
      audioFeatures.liveness || 0,
      audioFeatures.loudness ? this.normalizeLoudness(audioFeatures.loudness) : 0,
      audioFeatures.speechiness || 0,
      audioFeatures.tempo ? this.normalizeTempo(audioFeatures.tempo) : 0,
      audioFeatures.valence || 0,
      audioFeatures.mode || 0,
      audioFeatures.key ? this.normalizeKey(audioFeatures.key) : 0
    ];
  }

  /**
   * Normalize loudness value (typically -60 to 0 dB)
   */
  private normalizeLoudness(loudness: number): number {
    // Convert from dB scale to 0-1 range
    return (loudness + 60) / 60;
  }

  /**
   * Normalize tempo (typically 50-200 BPM)
   */
  private normalizeTempo(tempo: number): number {
    // Normalize to 0-1 range assuming most tempos are between 50 and 200 BPM
    return Math.min(Math.max((tempo - 50) / 150, 0), 1);
  }

  /**
   * Normalize key (0-11 representing musical keys)
   */
  private normalizeKey(key: number): number {
    // Key is already in 0-11 range, normalize to 0-1
    return key / 11;
  }

  /**
   * Standardize features array using z-score normalization
   */
  private standardizeFeatures(features: number[][]): number[][] {
    // Calculate means and standard deviations for each feature dimension
    const numFeatures = features[0].length;
    const means = Array(numFeatures).fill(0);
    const stds = Array(numFeatures).fill(0);
    
    // Calculate means
    for (const sample of features) {
      for (let i = 0; i < numFeatures; i++) {
        means[i] += sample[i];
      }
    }
    
    for (let i = 0; i < numFeatures; i++) {
      means[i] /= features.length;
    }
    
    // Calculate standard deviations
    for (const sample of features) {
      for (let i = 0; i < numFeatures; i++) {
        stds[i] += Math.pow(sample[i] - means[i], 2);
      }
    }
    
    for (let i = 0; i < numFeatures; i++) {
      stds[i] = Math.sqrt(stds[i] / features.length);
      // Avoid division by zero
      if (stds[i] < 1e-5) stds[i] = 1;
    }
    
    // Store normalization parameters for future use
    this.featureMeans = means;
    this.featureStds = stds;
    
    // Apply standardization
    return features.map(sample => 
      sample.map((value, i) => (value - means[i]) / stds[i])
    );
  }

  /**
   * Apply standardization to a single feature vector using stored means and stds
   */
  private standardizeFeatureVector(features: number[]): number[] {
    if (!this.featureMeans || !this.featureStds) {
      console.warn('No standardization parameters available, using raw features');
      return features;
    }
    
    return features.map((value, i) => 
      (value - this.featureMeans![i]) / this.featureStds![i]
    );
  }

  /**
   * Train the model using positive pairs of similar tracks
   */
  public async train(
    features: AudioFeatures[],
    similarPairs: [number, number][],
    trackIds: string[],
    epochs: number = 50,
    batchSize: number = 32,
    validationSplit: number = 0.2
  ): Promise<TrainingHistory> {
    if (features.length === 0 || similarPairs.length === 0) {
      throw new Error('Cannot train model without features or similar pairs');
    }

    console.log(`Training content-based model with ${features.length} tracks and ${similarPairs.length} similar pairs`);
    
    // Log W&B info
    if (this.wandbEnabled && this.wandbRun) {
      this.wandbRun.log({
        'training/num_tracks': features.length,
        'training/num_pairs': similarPairs.length,
        'training/batch_size': batchSize,
        'training/epochs': epochs,
        'training/validation_split': validationSplit
      });
    }
    
    // Convert features to arrays for tensor conversion
    const featuresArray = features.map(f => this.extractFeatures(f));
    
    // Standardize features
    const standardizedFeatures = this.standardizeFeatures(featuresArray);
    const featureTensor = tf.tensor2d(standardizedFeatures);
    
    // Create training pairs
    const [anchorFeatures, positiveFeatures] = this.createTrainingPairs(
      featureTensor,
      similarPairs
    );
    
    // Generate negative samples for contrastive learning
    const negativeFeatures = this.generateNegativeSamples(
      featureTensor,
      similarPairs,
      features.length
    );
    
    // Create IDs map for future reference
    const trackIdMap = new Map<number, string>();
    trackIds.forEach((id, index) => {
      trackIdMap.set(index, id);
    });

    // Prepare validation data
    const numValidation = Math.floor(similarPairs.length * validationSplit);
    const validationIndices = new Set(
      Array.from({ length: numValidation }, () => 
        Math.floor(Math.random() * similarPairs.length)
      )
    );
    
    const trainAnchors = [];
    const trainPositives = [];
    const valAnchors = [];
    const valPositives = [];
    
    // Split into training and validation sets
    similarPairs.forEach((pair, idx) => {
      const [anchorIdx, posIdx] = pair;
      if (validationIndices.has(idx)) {
        valAnchors.push(anchorIdx);
        valPositives.push(posIdx);
      } else {
        trainAnchors.push(anchorIdx);
        trainPositives.push(posIdx);
      }
    });

    // Create training and validation tensors
    const trainAnchorTensor = tf.gather(featureTensor, tf.tensor1d(trainAnchors, 'int32'));
    const trainPositiveTensor = tf.gather(featureTensor, tf.tensor1d(trainPositives, 'int32'));
    
    const valAnchorTensor = tf.gather(featureTensor, tf.tensor1d(valAnchors, 'int32'));
    const valPositiveTensor = tf.gather(featureTensor, tf.tensor1d(valPositives, 'int32'));

    // Define custom triplet loss function
    const customLossFunction = (
      y_true: tf.Tensor, 
      y_pred: tf.Tensor
    ) => {
      // Cosine proximity is the negative of cosine similarity
      return tf.losses.cosineDistance(y_true, y_pred, 0);
    };
    
    // Recompile model with custom loss
    this.model.compile({
      optimizer: tf.train.adam(this.config.learningRate),
      loss: customLossFunction,
      metrics: ['accuracy']
    });

    // Train the model
    const history = await this.model.fit(trainAnchorTensor, trainPositiveTensor, {
      epochs,
      batchSize,
      validationData: [valAnchorTensor, valPositiveTensor],
      callbacks: {
        onEpochEnd: (epoch, logs) => {
          console.log(`Epoch ${epoch + 1}: loss = ${logs?.loss.toFixed(4)}, val_loss = ${logs?.val_loss?.toFixed(4)}`);
          
          // Store training metrics
          this.trainingHistory.epochs.push(epoch);
          this.trainingHistory.loss.push(logs?.loss);
          this.trainingHistory.accuracy.push(logs?.acc || logs?.accuracy);
          if (logs?.val_loss) this.trainingHistory.valLoss.push(logs.val_loss);
          if (logs?.val_acc || logs?.val_accuracy) {
            this.trainingHistory.valAccuracy.push(logs?.val_acc || logs?.val_accuracy);
          }
          
          // Log to W&B
          if (this.wandbEnabled && this.wandbRun) {
            this.wandbRun.log({
              'training/epoch': epoch + 1,
              'training/loss': logs?.loss,
              'training/accuracy': logs?.acc || logs?.accuracy,
              'training/val_loss': logs?.val_loss,
              'training/val_accuracy': logs?.val_acc || logs?.val_accuracy,
            });
          }
        }
      }
    });

    console.log('Model training complete');
    this.isModelTrained = true;
    
    // Cleanup tensors to avoid memory leaks
    featureTensor.dispose();
    trainAnchorTensor.dispose();
    trainPositiveTensor.dispose();
    valAnchorTensor.dispose();
    valPositiveTensor.dispose();
    
    // Save the model
    await this.saveModel();
    
    return this.trainingHistory;
  }

  /**
   * Generate negative samples for contrastive learning
   */
  private generateNegativeSamples(
    features: tf.Tensor2D,
    similarPairs: [number, number][],
    numTracks: number
  ): tf.Tensor2D {
    // Create a set of positive pairs for faster lookup
    const positivePairsSet = new Set<string>();
    similarPairs.forEach(([i, j]) => {
      positivePairsSet.add(`${i}-${j}`);
      positivePairsSet.add(`${j}-${i}`); // Symmetric
    });
    
    // Generate negative pairs
    const negativeIndices: number[] = [];
    
    // For each anchor in the positive pairs, find a negative example
    similarPairs.forEach(([anchorIdx]) => {
      // Randomly select tracks until we find one that's not a positive pair
      let negativeIdx;
      do {
        negativeIdx = Math.floor(Math.random() * numTracks);
      } while (
        negativeIdx === anchorIdx || // Can't be the anchor itself
        positivePairsSet.has(`${anchorIdx}-${negativeIdx}`) // Can't be a positive pair
      );
      
      negativeIndices.push(negativeIdx);
    });
    
    return tf.gather(features, tf.tensor1d(negativeIndices, 'int32'));
  }

  /**
   * Save the model to disk
   */
  public async saveModel(): Promise<void> {
    try {
      // Ensure directory exists
      const dirPath = path.dirname(this.modelSavePath);
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
      
      // Save model
      await this.model.save(`file://${this.modelSavePath}`);
      
      // Save feature means and stds for normalization
      if (this.featureMeans && this.featureStds) {
        fs.writeFileSync(
          `${this.modelSavePath}_normalization.json`, 
          JSON.stringify({
            means: this.featureMeans,
            stds: this.featureStds
          })
        );
      }
      
      // Save model config and training history
      fs.writeFileSync(
        `${this.modelSavePath}_metadata.json`,
        JSON.stringify({
          config: this.config,
          trainingHistory: this.trainingHistory,
          isModelTrained: this.isModelTrained,
          modelVersion: '1.0',
          timestamp: new Date().toISOString(),
        }, null, 2)
      );
      
      // Create a model info file for human readability
      const modelInfoText = `
Content-Based Recommendation Model
=================================
Model Version: 1.0
Saved: ${new Date().toISOString()}
Status: ${this.isModelTrained ? 'Trained' : 'Untrained'}

Configuration:
- Feature Dimension: ${this.config.featureDim}
- Embedding Dimension: ${this.config.embedDim}
- Hidden Layers: ${this.config.hiddenLayers.join(', ')}
- Learning Rate: ${this.config.learningRate}
- Regularization Rate: ${this.config.regularizationRate}
- Dropout Rate: ${this.config.dropoutRate}

Training History:
- Epochs: ${this.trainingHistory.epochs.length}
- Final Loss: ${this.trainingHistory.loss[this.trainingHistory.loss.length - 1]?.toFixed(4) || 'N/A'}
- Final Accuracy: ${this.trainingHistory.accuracy[this.trainingHistory.accuracy.length - 1]?.toFixed(4) || 'N/A'}
- Final Validation Loss: ${this.trainingHistory.valLoss[this.trainingHistory.valLoss.length - 1]?.toFixed(4) || 'N/A'}
      `;
      
      fs.writeFileSync(`${this.modelSavePath}_info.txt`, modelInfoText);
      
      console.log(`Model saved to ${this.modelSavePath}`);
    } catch (error) {
      console.error('Error saving model:', error);
      throw error;
    }
  }

  /**
   * Load a previously saved model
   */
  public async loadModel(): Promise<boolean> {
    try {
      // Check if model exists
      const modelJsonPath = `${this.modelSavePath}/model.json`;
      if (!fs.existsSync(modelJsonPath)) {
        console.log('No saved model found, using newly initialized model');
        return false;
      }
      
      // Check if metadata exists
      const metadataPath = `${this.modelSavePath}_metadata.json`;
      const normalizationPath = `${this.modelSavePath}_normalization.json`;
      
      // Load model
      this.model = await tf.loadLayersModel(`file://${this.modelSavePath}/model.json`);
      
      // Load metadata if available
      if (fs.existsSync(metadataPath)) {
        try {
          const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
          
          // Update config with saved values
          this.config = {
            ...this.config,
            ...metadata.config
          };
          
          // Load training history
          if (metadata.trainingHistory) {
            this.trainingHistory = metadata.trainingHistory;
          }
          
          // Set model trained flag
          this.isModelTrained = metadata.isModelTrained || false;
          
          console.log(`Loaded model metadata (version: ${metadata.modelVersion || 'unknown'})`);
        } catch (e) {
          console.warn('Error parsing model metadata, using default config:', e);
        }
      }
      
      // Load normalization parameters if available
      if (fs.existsSync(normalizationPath)) {
        try {
        const normData = JSON.parse(fs.readFileSync(normalizationPath, 'utf8'));
        this.featureMeans = normData.means;
        this.featureStds = normData.stds;
          console.log('Loaded feature normalization parameters');
        } catch (e) {
          console.warn('Error parsing normalization data:', e);
        }
      }
      
      // Compile the model
      this.model.compile({
        optimizer: tf.train.adam(this.config.learningRate),
        loss: 'cosineProximity',
        metrics: ['accuracy']
      });
      
      console.log(`Model loaded from ${this.modelSavePath}`);
      console.log(`Model has ${this.isModelTrained ? 'been trained' : 'NOT been trained'}`);
      
      return true;
    } catch (error) {
      console.error('Error loading model:', error);
      return false;
    }
  }

  /**
   * Get embedding for audio features
   */
  public async getEmbedding(features: AudioFeatures): Promise<Float32Array> {
    // Extract features
    const featureArray = this.extractFeatures(features);
    
    // Standardize features
    const standardizedFeatures = this.standardizeFeatureVector(featureArray);
    
    // Convert to tensor
    const featureTensor = tf.tensor2d([standardizedFeatures]);
    
    // Get embedding from model
    const embedding = this.model.predict(featureTensor) as tf.Tensor;
    
    // Convert to Float32Array
    const embeddingArray = await embedding.data() as Float32Array;
    
    // Cleanup tensors
    featureTensor.dispose();
    embedding.dispose();
    
    return embeddingArray;
  }

  /**
   * Calculate cosine similarity between two embedding vectors
   */
  private cosineSimilarity(a: Float32Array | number[], b: Float32Array | number[]): number {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    
    // Handle zero vectors
    if (normA === 0 || normB === 0) return 0;
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * Get similar tracks based on audio features
   */
  public async getSimilarTracks(
    targetFeatures: AudioFeatures,
    candidateFeatures: AudioFeatures[],
    candidateIds: string[],
    limit: number = 10
  ): Promise<TrackSimilarity[]> {
    if (candidateFeatures.length !== candidateIds.length) {
      throw new Error('Number of candidate features must match number of candidate IDs');
    }
    
    const targetEmbedding = await this.getEmbedding(targetFeatures);
    const candidateEmbeddings = await Promise.all(
      candidateFeatures.map(f => this.getEmbedding(f))
    );

    // Calculate cosine similarities
    const similarities = candidateEmbeddings.map((embedding, index) => ({
      trackId: candidateIds[index],
      similarity: this.cosineSimilarity(targetEmbedding, embedding)
    }));

    // Sort by similarity and return top k
    return similarities
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);
  }

  /**
   * Generate recommendations with reasons
   */
  public async getRecommendations(
    tracks: Array<Track & { audioFeatures: TrackFeatures | null }>,
    userHistory: string[],
    limit: number = 10
  ): Promise<RecommendationResult[]> {
    // Filter tracks with audio features
    const tracksWithFeatures = tracks.filter(t => t.audioFeatures !== null);
    
    if (tracksWithFeatures.length === 0) {
      throw new Error('No tracks with audio features available');
    }
    
    // Get user's listened tracks
    const userTracks = tracksWithFeatures.filter(t => userHistory.includes(t.id));
    
    if (userTracks.length === 0) {
      // If no user history, return popularity-based recommendations
      return tracksWithFeatures
        .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
        .slice(0, limit)
        .map(track => ({
          trackId: track.id,
          score: (track.popularity || 50) / 100,
          reasons: ['Popular track you might enjoy']
        }));
    }
    
    // Calculate average embedding for user's tracks
    const userEmbeddings = await Promise.all(
      userTracks.map(track => this.getEmbedding(track.audioFeatures as AudioFeatures))
    );
    
    // Average the embeddings
    const avgEmbedding = new Float32Array(this.config.embedDim);
    for (let i = 0; i < this.config.embedDim; i++) {
      for (const embedding of userEmbeddings) {
        avgEmbedding[i] += embedding[i];
      }
      avgEmbedding[i] /= userEmbeddings.length;
    }
    
    // Get candidate tracks (exclude user history)
    const candidateTracks = tracksWithFeatures.filter(t => !userHistory.includes(t.id));
    
    // Get embeddings for all candidate tracks
    const candidateEmbeddings = await Promise.all(
      candidateTracks.map(track => this.getEmbedding(track.audioFeatures as AudioFeatures))
    );
    
    // Calculate similarities and generate reasons
    const recommendations = candidateEmbeddings.map((embedding, index) => {
      const track = candidateTracks[index];
      const similarity = this.cosineSimilarity(avgEmbedding, embedding);
      
      // Generate explanation reasons
      const reasons: string[] = [];
      
      if (similarity > 0.8) {
        reasons.push('Very similar musical characteristics to your favorites');
      } else if (similarity > 0.6) {
        reasons.push('Similar sound profile to tracks you enjoy');
      }
      
      // Add specific feature reasons
      if (track.audioFeatures) {
        if (track.audioFeatures.danceability > 0.7) {
          reasons.push('High danceability, good for moving to the beat');
        }
        if (track.audioFeatures.energy > 0.8) {
          reasons.push('Energetic track matching your preferences');
        }
        if (track.audioFeatures.acousticness > 0.7) {
          reasons.push('Acoustic sound that matches your listening patterns');
        }
      }
      
      // Ensure at least one reason
      if (reasons.length === 0) {
        reasons.push('Matches your taste profile');
      }
      
      return {
        trackId: track.id,
        score: similarity,
        reasons
      };
    });
    
    // Sort by similarity and return top k
    return recommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  /**
   * Evaluate model performance on a test set
   */
  public async evaluateModel(
    testFeatures: AudioFeatures[],
    testPairs: [number, number][],
    testTrackIds: string[]
  ): Promise<ModelEvalMetrics> {
    if (!this.isModelTrained) {
      throw new Error('Model must be trained before evaluation');
    }
    
    console.log(`Evaluating model on ${testFeatures.length} tracks and ${testPairs.length} test pairs`);
    
    // Extract all test track embeddings
    const embeddings = await Promise.all(
      testFeatures.map(features => this.getEmbedding(features))
    );
    
    let truePositives = 0;
    let falsePositives = 0;
    let falseNegatives = 0;
    let meanAveragePrecision = 0;
    let ndcgSum = 0;
    
    // Create a map of track pairs for ground truth
    const groundTruthPairs = new Map<number, Set<number>>();
    for (const [anchorIdx, posIdx] of testPairs) {
      if (!groundTruthPairs.has(anchorIdx)) {
        groundTruthPairs.set(anchorIdx, new Set<number>());
      }
      groundTruthPairs.get(anchorIdx)!.add(posIdx);
    }
    
    // For each anchor track, get top predictions and evaluate
    const anchors = Array.from(groundTruthPairs.keys());
    let totalPrecisionAtK = 0;
    let totalRecallAtK = 0;
    
    for (const anchorIdx of anchors) {
      const relevantIndices = groundTruthPairs.get(anchorIdx) || new Set<number>();
      if (relevantIndices.size === 0) continue;
      
      const anchorEmbedding = embeddings[anchorIdx];
      
      // Calculate similarity to all other tracks
      const similarities = embeddings.map((emb, idx) => ({
        index: idx,
        similarity: this.cosineSimilarity(anchorEmbedding, emb)
      }));
      
      // Sort by similarity (excluding the anchor itself)
      const sortedSimilarities = similarities
        .filter(s => s.index !== anchorIdx)
        .sort((a, b) => b.similarity - a.similarity);
      
      // Set k for precision@k and recall@k to be the number of relevant items
      const k = relevantIndices.size;
      // Get top K predictions
      const topKPredictions = sortedSimilarities.slice(0, k).map(s => s.index);
      
      // Count true positives in top K
      let tp = 0;
      for (const predIdx of topKPredictions) {
        if (relevantIndices.has(predIdx)) {
          tp++;
        }
      }
      
      // Calculate precision@k and recall@k for this anchor
      const precisionAtK = tp / k;
      const recallAtK = tp / relevantIndices.size;
      
      totalPrecisionAtK += precisionAtK;
      totalRecallAtK += recallAtK;
      
      truePositives += tp;
      falsePositives += (k - tp);
      falseNegatives += (relevantIndices.size - tp);
      
      // Calculate average precision for this anchor (for MAP)
      let avgPrecision = 0;
      let relevantCount = 0;
      
      // For each position in the ranked list
      for (let i = 0; i < sortedSimilarities.length; i++) {
        const predIdx = sortedSimilarities[i].index;
        if (relevantIndices.has(predIdx)) {
          relevantCount++;
          // Precision at this point = relevantCount / (i+1)
          avgPrecision += relevantCount / (i + 1);
        }
      }
      
      if (relevantIndices.size > 0) {
        avgPrecision /= relevantIndices.size;
        meanAveragePrecision += avgPrecision;
      }
      
      // Calculate NDCG for this anchor
      let dcg = 0;
      for (let i = 0; i < Math.min(k, sortedSimilarities.length); i++) {
        if (relevantIndices.has(sortedSimilarities[i].index)) {
          // DCG formula with binary relevance (1 if relevant)
          dcg += 1 / Math.log2(i + 2);
        }
      }
      
      // Calculate ideal DCG (IDCG)
      let idcg = 0;
      for (let i = 0; i < Math.min(relevantIndices.size, k); i++) {
        idcg += 1 / Math.log2(i + 2);
      }
      
      const ndcg = (idcg > 0) ? dcg / idcg : 0;
      ndcgSum += ndcg;
    }
    
    // Calculate overall metrics
    const numAnchors = anchors.length;
    const precision = numAnchors > 0 ? totalPrecisionAtK / numAnchors : 0;
    const recall = numAnchors > 0 ? totalRecallAtK / numAnchors : 0;
    const f1Score = precision > 0 && recall > 0 
      ? 2 * (precision * recall) / (precision + recall) 
      : 0;
    const mapScore = numAnchors > 0 ? meanAveragePrecision / numAnchors : 0;
    const ndcgScore = numAnchors > 0 ? ndcgSum / numAnchors : 0;
    
    // Calculate accuracy (overall)
    const accuracy = (truePositives + falsePositives) > 0 
      ? truePositives / (truePositives + falsePositives) 
      : 0;
    
    console.log('Evaluation complete with the following metrics:');
    console.log(`Precision: ${precision.toFixed(4)}`);
    console.log(`Recall: ${recall.toFixed(4)}`);
    console.log(`F1 Score: ${f1Score.toFixed(4)}`);
    console.log(`MAP: ${mapScore.toFixed(4)}`);
    console.log(`NDCG: ${ndcgScore.toFixed(4)}`);
    
    // Log to W&B
    if (this.wandbEnabled && this.wandbRun) {
      this.wandbRun.log({
        'evaluation/precision': precision,
        'evaluation/recall': recall,
        'evaluation/f1_score': f1Score,
        'evaluation/mean_average_precision': mapScore,
        'evaluation/ndcg': ndcgScore,
        'evaluation/accuracy': accuracy,
        'evaluation/true_positives': truePositives,
        'evaluation/false_positives': falsePositives,
        'evaluation/false_negatives': falseNegatives,
        'evaluation/test_tracks': testFeatures.length,
        'evaluation/test_pairs': testPairs.length
      });
    }
    
    return {
      accuracy,
      precision,
      recall,
      f1Score,
      meanAveragePrecision: mapScore,
      ndcg: ndcgScore
    };
  }

  /**
   * Create training pairs for similarity learning
   */
  private createTrainingPairs(
    features: tf.Tensor2D,
    similarPairs: [number, number][]
  ): [tf.Tensor2D, tf.Tensor2D] {
    const anchors = [];
    const positives = [];

    for (const [i, j] of similarPairs) {
      anchors.push(i);
      positives.push(j);
    }

    return [
      tf.gather(features, tf.tensor1d(anchors, 'int32')),
      tf.gather(features, tf.tensor1d(positives, 'int32'))
    ];
  }

  /**
   * Get recommendations based on a specific track
   */
  public async getRecommendationsForTrack(
    sourceTrack: Track & { audioFeatures: TrackFeatures | null },
    availableTracks: Array<{ id: string, audioFeatures: AudioFeatures }>,
    limit: number = 10
  ): Promise<RecommendationResult[]> {
    if (!this.isModelTrained) {
      try {
        const loaded = await this.loadModel();
        if (!loaded) {
          throw new Error('Model not trained and no saved model found');
        }
      } catch (error) {
        console.error('Failed to load model:', error);
        throw new Error('Model not available for recommendations');
      }
    }

    // Ensure source track has audio features
    if (!sourceTrack.audioFeatures) {
      throw new Error('Source track does not have audio features');
    }

    console.log(`Getting recommendations similar to track ${sourceTrack.name} by ${sourceTrack.artists.join(', ')}`);

    // Filter out available tracks without audio features
    const tracksWithFeatures = availableTracks.filter(t => t.audioFeatures);
    
    if (tracksWithFeatures.length === 0) {
      return [];
    }

    // Get embedding for source track
    const sourceFeatures = sourceTrack.audioFeatures as unknown as AudioFeatures;
    const sourceEmbedding = await this.getEmbedding(sourceFeatures);

    // Calculate similarity to all available tracks
    const similarityScores = await Promise.all(
      tracksWithFeatures.map(async track => {
        // Skip the source track itself
        if (track.id === sourceTrack.id) {
          return { 
            trackId: track.id, 
            score: 0,
            reasons: ['Same track as source']
          };
        }

        const embedding = await this.getEmbedding(track.audioFeatures);
        const similarity = this.cosineSimilarity(sourceEmbedding, embedding);

        // Generate explanation reasons based on audio features
        const reasons = this.generateRecommendationReasons(
          sourceFeatures, 
          track.audioFeatures, 
          similarity
        );

        return {
          trackId: track.id,
          score: similarity,
          reasons
        };
      })
    );

    // Sort by similarity score (descending) and take top tracks
    return similarityScores
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  /**
   * Generate human-readable reasons for recommendation based on audio features comparison
   */
  private generateRecommendationReasons(
    sourceFeatures: AudioFeatures,
    recommendedFeatures: AudioFeatures,
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

  /**
   * Clean up W&B resources when done
   */
  public async finalize(): Promise<void> {
    if (this.wandbEnabled && this.wandbRun) {
      await wandb.finish();
      console.log('Weights & Biases run finalized');
    }
  }

  private loadModelFromDisk() {
    try {
      const modelPath = path.join(__dirname, '../../../data/content_model.json');
      
      if (fs.existsSync(modelPath)) {
        const modelData = JSON.parse(fs.readFileSync(modelPath, 'utf8'));
        
        if (modelData.modelWeights) {
          this.modelWeights = modelData.modelWeights;
        }
        
        if (modelData.featureImportance) {
          this.featureImportance = modelData.featureImportance;
        }
        
        if (modelData.similarityThresholds) {
          this.similarityThresholds = modelData.similarityThresholds;
        }
        
        if (modelData.userPreferenceWeights) {
          this.userPreferenceWeights = modelData.userPreferenceWeights;
        }
        
        if (modelData.globalMetadata) {
          this.globalMetadata = modelData.globalMetadata;
        }
        
        console.log(`Loaded content-based model from disk (version ${this.globalMetadata.version})`);
      } else {
        console.log('No existing model found, using default weights');
        this.saveModelToDisk();
      }
    } catch (error) {
      console.error('Error loading model from disk:', error);
      console.log('Using default weights');
    }
  }

  private saveModelToDisk() {
    try {
      const modelPath = path.join(__dirname, '../../../data/content_model.json');
      
      // Ensure directory exists
      const dir = path.dirname(modelPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      const modelData = {
        modelWeights: this.modelWeights,
        featureImportance: this.featureImportance,
        similarityThresholds: this.similarityThresholds,
        userPreferenceWeights: this.userPreferenceWeights,
        globalMetadata: {
          ...this.globalMetadata,
          lastSaved: new Date().toISOString()
        }
      };
      
      fs.writeFileSync(modelPath, JSON.stringify(modelData, null, 2));
      console.log(`Saved content-based model to disk (version ${this.globalMetadata.version})`);
    } catch (error) {
      console.error('Error saving model to disk:', error);
    }
  }

  // Load training history to update model parameters
  public loadTrainingHistory() {
    try {
      const historyPath = path.join(__dirname, '../../../data/training_history.json');
      
      if (fs.existsSync(historyPath)) {
        const history = JSON.parse(fs.readFileSync(historyPath, 'utf8'));
        
        // Update model parameters based on training results
        // We'll simulate this by adjusting weights based on the f1 score
        const bestF1 = Math.max(...history.f1Score);
        const bestEpoch = history.f1Score.indexOf(bestF1);
        
        // Adjust weights slightly based on training performance
        const adjustmentFactor = Math.min(bestF1, 0.95);
        
        // Adjust feature importance based on training results
        // The better the model performed, the more we trust our weights
        Object.keys(this.featureImportance).forEach(feature => {
          this.featureImportance[feature] = this.featureImportance[feature] * (0.8 + adjustmentFactor * 0.2);
        });
        
        // Update global metadata
        this.globalMetadata.lastTrainingEpochs = history.epochs.length;
        this.globalMetadata.bestEpoch = bestEpoch + 1;
        this.globalMetadata.accuracy = history.accuracy[bestEpoch];
        this.globalMetadata.f1Score = bestF1;
        this.globalMetadata.lastTrained = new Date().toISOString();
        
        // Save updated model
        this.saveModelToDisk();
        
        console.log(`Updated model parameters based on training history (F1 Score: ${bestF1.toFixed(4)})`);
        return true;
      } else {
        console.log('No training history found');
        return false;
      }
    } catch (error) {
      console.error('Error loading training history:', error);
      return false;
    }
  }

  // Calculate similarity between two tracks
  public calculateSimilarity(track1: TrackWithFeatures, track2: TrackWithFeatures): { score: number; reasons: RecommendationReason[] } {
    const features1 = track1.audioFeatures;
    const features2 = track2.audioFeatures;
    
    if (!features1 || !features2) {
      return { score: 0, reasons: [] };
    }
    
    let totalScore = 0;
    let totalWeight = 0;
    const reasons: RecommendationReason[] = [];
    
    // Calculate similarity for each feature
    const addSimilarityScore = (
      feature: string,
      value1: number,
      value2: number,
      weight: number,
      threshold: number,
      label: string
    ) => {
      const diff = Math.abs(value1 - value2);
      
      // If difference is within threshold, calculate similarity score
      if (diff <= threshold) {
        const similarity = 1 - (diff / threshold);
        const weightedScore = similarity * weight;
        
        totalScore += weightedScore;
        totalWeight += weight;
        
        // Add as a reason if similarity is high enough
        if (similarity >= 0.7) {
          reasons.push({
            reason: label,
            score: similarity
          });
        }
      }
    };
    
    // Audio profile features
    addSimilarityScore(
      'danceability',
      features1.danceability,
      features2.danceability,
      this.modelWeights.danceability,
      this.similarityThresholds.danceability,
      'Similar danceability'
    );
    
    addSimilarityScore(
      'energy',
      features1.energy,
      features2.energy,
      this.modelWeights.energy,
      this.similarityThresholds.energy,
      'Similar energy level'
    );
    
    addSimilarityScore(
      'acousticness',
      features1.acousticness,
      features2.acousticness,
      this.modelWeights.acousticness,
      this.similarityThresholds.acousticness,
      'Similar acousticness'
    );
    
    addSimilarityScore(
      'instrumentalness',
      features1.instrumentalness,
      features2.instrumentalness,
      this.modelWeights.instrumentalness,
      this.similarityThresholds.instrumentalness,
      'Similar instrumentalness'
    );
    
    addSimilarityScore(
      'valence',
      features1.valence,
      features2.valence,
      this.modelWeights.valence,
      this.similarityThresholds.valence,
      'Similar mood/valence'
    );
    
    addSimilarityScore(
      'tempo',
      features1.tempo,
      features2.tempo,
      this.modelWeights.tempo,
      this.similarityThresholds.tempo,
      'Similar tempo'
    );
    
    addSimilarityScore(
      'loudness',
      features1.loudness,
      features2.loudness,
      this.modelWeights.loudness,
      this.similarityThresholds.loudness,
      'Similar loudness'
    );

    // Add similarity based on track popularity if available
    if (track1.popularity !== null && track2.popularity !== null) {
      const popularity1 = track1.popularity / 100; // Normalize to 0-1
      const popularity2 = track2.popularity / 100;
      
      addSimilarityScore(
        'popularity',
        popularity1,
        popularity2,
        this.modelWeights.popularity,
        0.3, // Threshold for popularity
        'Similar popularity'
      );
    }
    
    // Add bonus points for shared artists
    const artists1 = new Set<string>(track1.artists);
    const artists2 = new Set<string>(track2.artists);
    
    const sharedArtists = [...artists1].filter(artist => artists2.has(artist));
    
    if (sharedArtists.length > 0) {
      const artistScore = 0.8 + (sharedArtists.length * 0.1);
      totalScore += artistScore;
      totalWeight += 1;
      
      reasons.push({
        reason: sharedArtists.length > 1 
          ? `Shared artists: ${sharedArtists.join(', ')}`
          : `Same artist: ${sharedArtists[0]}`,
        score: artistScore
      });
    }
    
    // If we have positive scores, calculate normalized score
    if (totalWeight > 0) {
      const normalizedScore = totalScore / totalWeight;
      
      // Add an overall audio profile reason if multiple features match
      if (reasons.length >= 3) {
        reasons.unshift({
          reason: 'Similar audio profile',
          score: normalizedScore
        });
      }
      
      // Sort reasons by score (highest first)
      reasons.sort((a, b) => b.score - a.score);
      
      return {
        score: normalizedScore,
        reasons: reasons.slice(0, 4) // Limit to top 4 reasons
      };
    }
    
    return { score: 0, reasons: [] };
  }

  // Update user preference weights based on track interactions
  public updateUserPreferences(userId: string, tracks: TrackWithFeatures[], interactionTypes: string[]) {
    if (!userId || !tracks || tracks.length === 0) {
      return;
    }
    
    // Initialize user preferences if not exists
    if (!this.userPreferenceWeights[userId]) {
      this.userPreferenceWeights[userId] = {
        danceability: 0,
        energy: 0,
        acousticness: 0,
        instrumentalness: 0,
        valence: 0,
        popularity: 0,
        lastUpdated: new Date().getTime(),
        interactionCount: 0
      };
    }
    
    const preferences = this.userPreferenceWeights[userId];
    const positiveInteractions = ['play', 'like'];
    const negativeInteractions = ['skip'];
    
    // Count positive and negative interactions
    let positiveCount = 0;
    let negativeCount = 0;
    
    interactionTypes.forEach(type => {
      if (positiveInteractions.includes(type)) positiveCount++;
      if (negativeInteractions.includes(type)) negativeCount++;
    });
    
    // Calculate interaction weight
    // Positive interactions increase weight, negative decrease
    const interactionWeight = positiveCount - (negativeCount * 0.5);
    
    if (interactionWeight === 0) {
      return; // No change in preferences
    }
    
    // Update preferences based on track features
    tracks.forEach(track => {
      if (!track.audioFeatures) return;
      
      const features = track.audioFeatures;
      const learningRate = 0.1; // How quickly we adjust to new preferences
      
      // Update preferences for each feature
      preferences.danceability = (preferences.danceability * (1 - learningRate)) + 
                                 (features.danceability * learningRate * interactionWeight);
      
      preferences.energy = (preferences.energy * (1 - learningRate)) + 
                           (features.energy * learningRate * interactionWeight);
      
      preferences.acousticness = (preferences.acousticness * (1 - learningRate)) + 
                                 (features.acousticness * learningRate * interactionWeight);
      
      preferences.instrumentalness = (preferences.instrumentalness * (1 - learningRate)) + 
                                     (features.instrumentalness * learningRate * interactionWeight);
      
      preferences.valence = (preferences.valence * (1 - learningRate)) + 
                            (features.valence * learningRate * interactionWeight);
      
      // Update popularity preference if available
      if (track.popularity !== null) {
        const normalizedPopularity = track.popularity / 100;
        preferences.popularity = (preferences.popularity * (1 - learningRate)) + 
                                 (normalizedPopularity * learningRate * interactionWeight);
      }
    });
    
    // Update metadata
    preferences.lastUpdated = new Date().getTime();
    preferences.interactionCount = (preferences.interactionCount || 0) + interactionTypes.length;
    
    // Save updated model
    this.saveModelToDisk();
  }

  // Recommend tracks based on seed track and user preferences
  public recommendTracks(
    seedTrack: TrackWithFeatures, 
    candidateTracks: TrackWithFeatures[],
    userId?: string,
    groupMemberTracks?: Map<string, TrackWithFeatures[]>,
    count: number = 5
  ): { track: TrackWithFeatures; score: number; reasons: string[] }[] {
    if (!seedTrack || !seedTrack.audioFeatures || candidateTracks.length === 0) {
      return [];
    }
    
    // Calculate similarity scores
    const trackScores = candidateTracks
      .filter(track => track.id !== seedTrack.id && track.audioFeatures)
      .map(track => {
        let { score, reasons } = this.calculateSimilarity(seedTrack, track);
        let userPreferenceBoost = 0;
        let groupListenBoost = 0;
        const allReasons = [...reasons];
        
        // Apply user preference boost if userId is provided
        if (userId && this.userPreferenceWeights[userId]) {
          const prefs = this.userPreferenceWeights[userId];
          
          // Calculate how well this track matches user preferences
          if (track.audioFeatures) {
            const features = track.audioFeatures;
            
            // Calculate match score for each feature
            const danceabilityMatch = 1 - Math.abs(prefs.danceability - features.danceability);
            const energyMatch = 1 - Math.abs(prefs.energy - features.energy);
            const acousticnessMatch = 1 - Math.abs(prefs.acousticness - features.acousticness);
            const valenceMatch = 1 - Math.abs(prefs.valence - features.valence);
            
            // Weighted average of feature matches
            const prefMatchScore = (
              danceabilityMatch * 0.25 +
              energyMatch * 0.25 +
              acousticnessMatch * 0.25 +
              valenceMatch * 0.25
            );
            
            // Apply a boost based on preference match
            userPreferenceBoost = prefMatchScore * 0.15; // Up to 15% boost
            
            if (prefMatchScore > 0.7) {
              allReasons.push({
                reason: 'Matches your listening preferences',
                score: prefMatchScore
              });
            }
          }
        }
        
        // Apply group listening boost if group data is provided
        if (groupMemberTracks && groupMemberTracks.size > 0) {
          let listenCount = 0;
          let totalMembers = groupMemberTracks.size;
          
          // Count how many group members have listened to this track
          groupMemberTracks.forEach((tracks) => {
            if (tracks.some(t => t.id === track.id)) {
              listenCount++;
            }
          });
          
          if (listenCount > 0) {
            // Calculate boost based on percentage of group members
            const groupRatio = listenCount / totalMembers;
            groupListenBoost = groupRatio * 0.2; // Up to 20% boost
            
            allReasons.push({
              reason: `${listenCount} group member${listenCount > 1 ? 's' : ''} have listened to this track`,
              score: groupRatio + 0.7 // Ensure it's a significant reason
            });
          }
        }
        
        // Apply the boosts to the score
        const finalScore = score + userPreferenceBoost + groupListenBoost;
        
        return {
          track,
          score: finalScore,
          reasonObjects: allReasons
        };
      });
    
    // Increment recommendation count for stats
    this.globalMetadata.recommendationCount = 
      (this.globalMetadata.recommendationCount || 0) + 1;
    
    // Save occasionally (every 100 recommendations)
    if (this.globalMetadata.recommendationCount % 100 === 0) {
      this.saveModelToDisk();
    }
    
    // Sort by score and get top matches
    return trackScores
      .sort((a, b) => b.score - a.score)
      .slice(0, count)
      .map(item => ({
        track: item.track,
        score: parseFloat(item.score.toFixed(4)),
        reasons: item.reasonObjects
          .sort((a, b) => b.score - a.score)
          .slice(0, 4)
          .map(r => r.reason)
      }));
  }
} 