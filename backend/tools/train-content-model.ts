#!/usr/bin/env node
/**
 * Script to train the Content-Based Recommendation Model
 * 
 * Usage:
 * npx ts-node src/scripts/train-content-model.ts [options]
 * 
 * Options:
 *   --epochs=50            Number of training epochs (default: 50)
 *   --batch-size=32        Batch size for training (default: 32)
 *   --validation-split=0.2 Validation data split (default: 0.2)
 *   --help                 Show this help message
 */

import { MLDataService } from '../src/aiml/services/ml-data.service';
import { DatabaseService } from '../src/services/database.service';
import { SpotifyService } from '../src/services/spotify.service';

// Parse command line arguments
const args = process.argv.slice(2);
if (args.includes('--help')) {
  console.log(`
Train Content-Based Recommendation Model
========================================

This script trains the content-based recommendation model using available
user listening history data from the database.

Usage:
  npx ts-node src/scripts/train-content-model.ts [options]

Options:
  --epochs=50            Number of training epochs (default: 50)
  --batch-size=32        Batch size for training (default: 32)
  --validation-split=0.2 Validation data split (default: 0.2)
  --help                 Show this help message
  `);
  process.exit(0);
}

// Parse arguments
const parseArg = (name: string, defaultValue: number): number => {
  const arg = args.find(a => a.startsWith(`--${name}=`));
  if (!arg) return defaultValue;
  
  const value = arg.split('=')[1];
  return Number(value);
};

const epochs = parseArg('epochs', 50);
const batchSize = parseArg('batch-size', 32);
const validationSplit = parseArg('validation-split', 0.2);

// Main training function
async function trainModel() {
  console.log('======================================================');
  console.log('Content-Based Recommendation Model Training');
  console.log('======================================================');
  console.log(`Training configuration:`);
  console.log(`- Epochs: ${epochs}`);
  console.log(`- Batch size: ${batchSize}`);
  console.log(`- Validation split: ${validationSplit}`);
  console.log('------------------------------------------------------');
  
  let mlDataService: MLDataService | null = null;
  let databaseService: DatabaseService | null = null;
  
  try {
    console.log('Initializing services...');
    
    // Initialize services
    databaseService = new DatabaseService();
    await databaseService.onModuleInit();
    
    const spotifyService = new SpotifyService(databaseService);
    mlDataService = new MLDataService(databaseService, spotifyService);
    
    console.log('Starting training process...');
    
    // Train the model
    const result = await mlDataService.trainModel(epochs, validationSplit, batchSize);
    
    console.log('======================================================');
    console.log('Training Complete!');
    console.log('======================================================');
    console.log('Model Evaluation Metrics:');
    console.log(`- Precision: ${result.metrics.precision.toFixed(4)}`);
    console.log(`- Recall: ${result.metrics.recall.toFixed(4)}`);
    console.log(`- F1 Score: ${result.metrics.f1Score.toFixed(4)}`);
    console.log(`- MAP: ${result.metrics.meanAveragePrecision.toFixed(4)}`);
    console.log(`- NDCG: ${result.metrics.ndcg.toFixed(4)}`);
    console.log('------------------------------------------------------');
    console.log(`Training completed with ${result.history.epochs.length} epochs`);
    console.log(`Final training loss: ${result.history.loss[result.history.loss.length - 1]?.toFixed(6) || 'N/A'}`);
    
    console.log('Model saved and ready for recommendations!');
    
    // Finalize W&B run
    await mlDataService.finalizeWandbRun();
    
    // Clean up
    if (databaseService) {
      await databaseService.onModuleDestroy();
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error training model:', error);
    
    // Attempt to finalize W&B run even on error
    if (mlDataService) {
      await mlDataService.finalizeWandbRun();
    }
    
    // Clean up database connection
    if (databaseService) {
      await databaseService.onModuleDestroy();
    }
    
    process.exit(1);
  }
}

// Run the training
trainModel().catch(err => {
  console.error('Fatal error during training:', err);
  process.exit(1);
}); 