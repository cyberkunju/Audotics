#!/usr/bin/env node
/**
 * Script to update the content-based recommendation model with training results
 * This version doesn't require TensorFlow, directly updating the model file
 */

import * as fs from 'fs';
import * as path from 'path';

async function updateModel() {
  console.log('Updating content-based recommendation model with training results...');
  
  // Check if training history exists
  const historyPath = path.join(__dirname, '../../../data/training_history.json');
  
  if (!fs.existsSync(historyPath)) {
    console.error('Training history not found. Please run the training script first.');
    process.exit(1);
  }
  
  // Check if model file exists
  const modelPath = path.join(__dirname, '../../../data/content_model.json');
  let modelData: any = {
    modelWeights: {
      danceability: 0.8,
      energy: 0.9,
      acousticness: 0.7,
      instrumentalness: 0.6,
      valence: 0.85,
      tempo: 0.3,
      loudness: 0.4,
      popularity: 0.5
    },
    featureImportance: {
      danceability: 0.85,
      energy: 0.92,
      acousticness: 0.75,
      instrumentalness: 0.65,
      valence: 0.88,
      tempo: 0.35,
      loudness: 0.45,
      popularity: 0.55
    },
    similarityThresholds: {
      danceability: 0.2,
      energy: 0.25,
      acousticness: 0.3,
      instrumentalness: 0.35,
      valence: 0.25,
      tempo: 30,
      loudness: 5
    },
    userPreferenceWeights: {},
    globalMetadata: {
      version: '2.0.0',
      lastTrained: new Date().toISOString()
    }
  };
  
  if (fs.existsSync(modelPath)) {
    try {
      const existingModel = JSON.parse(fs.readFileSync(modelPath, 'utf8'));
      
      if (existingModel.userPreferenceWeights) {
        modelData.userPreferenceWeights = existingModel.userPreferenceWeights;
      }
      
      if (existingModel.globalMetadata && existingModel.globalMetadata.recommendationCount) {
        modelData.globalMetadata.recommendationCount = existingModel.globalMetadata.recommendationCount;
      }
      
      console.log('Loaded existing model file.');
    } catch (error) {
      console.warn('Error reading existing model file, using default weights:', error);
    }
  }
  
  try {
    // Load training history
    const history = JSON.parse(fs.readFileSync(historyPath, 'utf8'));
    console.log(`Found training history with ${history.epochs.length} epochs.`);
    
    // Calculate best metrics
    const bestF1 = Math.max(...history.f1Score);
    const bestEpoch = history.f1Score.indexOf(bestF1);
    
    console.log('Best model metrics:');
    console.log(`- Epoch: ${bestEpoch + 1}/${history.epochs.length}`);
    console.log(`- Accuracy: ${history.accuracy[bestEpoch].toFixed(4)}`);
    console.log(`- Precision: ${history.precision[bestEpoch].toFixed(4)}`);
    console.log(`- Recall: ${history.recall[bestEpoch].toFixed(4)}`);
    console.log(`- F1 Score: ${bestF1.toFixed(4)}`);
    
    // Adjust weights based on training results
    const adjustmentFactor = Math.min(bestF1, 0.95);
    
    // Adjust feature importance based on training performance
    Object.keys(modelData.featureImportance).forEach(feature => {
      modelData.featureImportance[feature] = 
        modelData.featureImportance[feature] * (0.8 + adjustmentFactor * 0.2);
    });
    
    // Update global metadata
    modelData.globalMetadata.lastTrainingEpochs = history.epochs.length;
    modelData.globalMetadata.bestEpoch = bestEpoch + 1;
    modelData.globalMetadata.accuracy = history.accuracy[bestEpoch];
    modelData.globalMetadata.precision = history.precision[bestEpoch];
    modelData.globalMetadata.recall = history.recall[bestEpoch];
    modelData.globalMetadata.f1Score = bestF1;
    modelData.globalMetadata.lastTrained = new Date().toISOString();
    
    // Ensure directory exists
    const dir = path.dirname(modelPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    // Save updated model
    fs.writeFileSync(modelPath, JSON.stringify(modelData, null, 2));
    console.log('Model parameters updated successfully!');
    console.log(`Model saved to: ${modelPath}`);
    
  } catch (error) {
    console.error('Error updating model:', error);
    process.exit(1);
  }
  
  console.log('Model update complete!');
}

// Run the update
updateModel().catch(err => {
  console.error('Error:', err);
  process.exit(1);
}); 