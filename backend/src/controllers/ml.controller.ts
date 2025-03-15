import { Request, Response } from 'express';
import { MLDataService } from '../aiml/services/ml-data.service';
import { SpotifyService } from '../services/spotify.service';
import { DatabaseService } from '../services/database.service';
import { RecommendationService } from '../services/recommendation.service';
import path from 'path';
import fs from 'fs';
import { Controller, Post, Body, Get } from '@nestjs/common';
import { Logger } from '@nestjs/common';

@Controller('ml')
export class MLController {
  private mlService: MLDataService;
  private spotifyService: SpotifyService;
  private logger = new Logger(MLController.name);

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly recommendationService: RecommendationService,
  ) {
    this.spotifyService = new SpotifyService(this.databaseService);
    this.mlService = new MLDataService(this.databaseService, this.spotifyService);
  }

  public collectUserData = async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const { access_token } = req.body;

      if (!userId || !access_token) {
        return res.status(400).json({ error: 'Missing required parameters' });
      }

      // Update audio features for user's recently played tracks
      const processedTracks = await this.mlService.batchUpdateAudioFeatures(50);
      
      return res.json({
        message: 'User data collected successfully',
        processedTracks
      });
    } catch (error: any) {
      console.error('Error in collectUserData:', {
        message: error.message,
        stack: error.stack,
        cause: error.cause
      });
      return res.status(500).json({ error: error.message || 'Internal server error' });
    }
  };

  public getRecommendations = async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const limit = parseInt(req.query.limit as string) || 20;

      if (!userId) {
        return res.status(400).json({ error: 'Missing required parameters' });
      }

      // Use the recommendation service instead of MLDataService directly
      const recommendations = await this.recommendationService.getPersonalizedRecommendations(
        userId,
        limit
      );

      return res.json(recommendations);
    } catch (error: any) {
      console.error('Error in getRecommendations:', {
        message: error.message,
        stack: error.stack,
        cause: error.cause
      });
      return res.status(500).json({ error: error.message || 'Internal server error' });
    }
  };

  public trainContentModel = async (req: Request, res: Response) => {
    try {
      const { epochs, validationSplit, batchSize } = req.body;
      
      // Use default values if not provided
      const trainingEpochs = epochs ? parseInt(epochs) : 50;
      const trainingValidationSplit = validationSplit ? parseFloat(validationSplit) : 0.2;
      const trainingBatchSize = batchSize ? parseInt(batchSize) : 32;
      
      // Start training
      console.log(`Starting Content-Based Model training with ${trainingEpochs} epochs`);
      
      const result = await this.mlService.trainModel(
        trainingEpochs,
        trainingValidationSplit,
        trainingBatchSize
      );
      
      // Finalize W&B run
      await this.mlService.finalizeWandbRun();
      
      return res.json({
        message: 'Model training completed successfully',
        metrics: result.metrics,
        history: {
          epochs: result.history.epochs.length,
          finalLoss: result.history.loss[result.history.loss.length - 1],
          finalAccuracy: result.history.accuracy[result.history.accuracy.length - 1]
        }
      });
    } catch (error: any) {
      console.error('Error in trainContentModel:', {
        message: error.message,
        stack: error.stack,
        cause: error.cause
      });
      
      // Try to finalize W&B run even on error
      try {
        await this.mlService.finalizeWandbRun();
      } catch (e) {
        // Ignore errors during finalization
      }
      
      return res.status(500).json({ 
        error: error.message || 'Internal server error',
        message: 'Failed to train content-based model'
      });
    }
  };

  public evaluateModel = async (req: Request, res: Response) => {
    try {
      const metrics = await this.mlService.evaluateModel();
      
      return res.json({
        message: 'Model evaluation completed',
        metrics
      });
    } catch (error: any) {
      console.error('Error in evaluateModel:', {
        message: error.message,
        stack: error.stack,
        cause: error.cause
      });
      return res.status(500).json({ 
        error: error.message || 'Internal server error',
        message: 'Failed to evaluate model'
      });
    }
  };

  public getSimilarTracks = async (req: Request, res: Response) => {
    try {
      const { trackId } = req.params;
      const limit = parseInt(req.query.limit as string) || 10;

      if (!trackId) {
        return res.status(400).json({ error: 'Missing track ID parameter' });
      }

      const similarTracks = await this.mlService.getSimilarTracks(trackId, limit);
      
      // Get full track information for the recommendations
      const trackIds = similarTracks.map(rec => rec.trackId);
      const tracks = await this.databaseService.track.findMany({
        where: { id: { in: trackIds } }
      });

      // Match recommendations with track information
      const enrichedRecommendations = similarTracks.map(rec => {
        const track = tracks.find(t => t.id === rec.trackId);
        return {
          ...rec,
          track: track || null
        };
      });

      return res.json(enrichedRecommendations);
    } catch (error: any) {
      console.error('Error in getSimilarTracks:', {
        message: error.message,
        stack: error.stack,
        cause: error.cause
      });
      return res.status(500).json({ 
        error: error.message || 'Internal server error',
        message: 'Failed to get similar tracks'
      });
    }
  };

  @Get('model-status')
  async getModelStatus(): Promise<any> {
    try {
      // Check if model file exists - look in the root data directory
      const modelPath = path.resolve(__dirname, '../../../data/content_model.json');
      
      if (!fs.existsSync(modelPath)) {
        return {
          status: 'not_found',
          message: 'Model file not found'
        };
      }
      
      // Read model metadata
      const modelData = JSON.parse(fs.readFileSync(modelPath, 'utf8'));
      
      return {
        status: 'ready',
        model: 'content-based',
        version: modelData.globalMetadata?.version || 'unknown',
        lastTrained: modelData.globalMetadata?.lastTrained || 'unknown',
        accuracy: modelData.globalMetadata?.accuracy || 0,
        f1Score: modelData.globalMetadata?.f1Score || 0,
        recommendationCount: modelData.globalMetadata?.recommendationCount || 0
      };
    } catch (error) {
      this.logger.error('Error getting model status:', error);
      return {
        status: 'error',
        message: 'Failed to retrieve model status'
      };
    }
  }

  @Post('update-model')
  async updateModel(@Body() body: any): Promise<any> {
    try {
      const { force } = body;
      
      // Run the update model script
      console.log('Updating content-based model...');
      
      // Execute the update script
      const scriptPath = path.resolve(__dirname, '../../scripts/update-model.ts');
      const result = await new Promise<string>((resolve, reject) => {
        const childProcess = require('child_process').spawn('npx', ['ts-node', scriptPath], {
          env: { ...process.env, FORCE_UPDATE: force ? 'true' : 'false' }
        });
        
        let output = '';
        childProcess.stdout.on('data', (data: Buffer) => {
          output += data.toString();
        });
        
        childProcess.stderr.on('data', (data: Buffer) => {
          output += data.toString();
        });
        
        childProcess.on('close', (code: number) => {
          if (code === 0) {
            resolve(output);
          } else {
            reject(new Error(`Update script exited with code ${code}: ${output}`));
          }
        });
      });
      
      // Check if model file exists after update
      const modelPath = path.resolve(__dirname, '../../../data/content_model.json');
      if (!fs.existsSync(modelPath)) {
        return {
          status: 'error',
          message: 'Model file not found after update'
        };
      }
      
      // Read updated model metadata
      const modelData = JSON.parse(fs.readFileSync(modelPath, 'utf8'));
      
      return {
        status: 'success',
        message: 'Model updated successfully',
        model: {
          version: modelData.globalMetadata?.version || 'unknown',
          lastTrained: modelData.globalMetadata?.lastTrained || 'unknown',
          accuracy: modelData.globalMetadata?.accuracy || 0,
          f1Score: modelData.globalMetadata?.f1Score || 0
        },
        output: result
      };
    } catch (error) {
      this.logger.error('Error updating model:', error);
      return {
        status: 'error',
        message: 'Failed to update model',
        error: error.message
      };
    }
  }
} 