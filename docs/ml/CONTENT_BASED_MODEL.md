# Content-Based Recommendation Model

## Overview

The Content-Based Recommendation Model is our primary recommendation system that uses audio features from Spotify to suggest similar tracks based on their acoustic properties. This model uses TensorFlow.js to learn a representation of tracks in an embedding space, where similar-sounding tracks are positioned closer together.

## Features

- Analyzes track audio features (tempo, energy, danceability, etc.)
- Learns from user listening patterns
- Provides human-readable explanations for recommendations
- Incorporates genre information when available
- Supports detailed evaluation metrics

## Training the Model

### Prerequisites

Before training the model, ensure:
1. Your database has sufficient user listening history data
2. Audio features have been collected for the tracks
3. You have sufficient memory for the training process

### Option 1: Using the Training Script

The easiest way to train the model is using the dedicated training script:

```bash
# Basic training with default parameters
npx ts-node src/scripts/train-content-model.ts

# Custom training parameters
npx ts-node src/scripts/train-content-model.ts --epochs=100 --batch-size=64 --validation-split=0.15
```

### Option 2: Using the API Endpoint

You can also trigger training through the API:

```bash
curl -X POST http://localhost:3000/api/ml/models/content-based/train \
  -H "Content-Type: application/json" \
  -d '{"epochs": 50, "batchSize": 32, "validationSplit": 0.2}'
```

### Option 3: Programmatic Training

```typescript
import { MLDataService } from '../aiml/services/ml-data.service';

// Initialize the service
const mlDataService = new MLDataService(databaseService, spotifyService);

// Train the model
const result = await mlDataService.trainModel(50, 0.2, 32);
console.log(`F1 Score: ${result.metrics.f1Score.toFixed(4)}`);
```

## Evaluating the Model

After training, you can evaluate the model's performance:

```bash
# Using the API
curl -X GET http://localhost:3000/api/ml/models/content-based/evaluate
```

The evaluation produces the following metrics:
- **Precision**: Percentage of recommended tracks that are relevant
- **Recall**: Percentage of relevant tracks that were recommended
- **F1 Score**: Harmonic mean of precision and recall
- **MAP (Mean Average Precision)**: Quality of ranking
- **NDCG (Normalized Discounted Cumulative Gain)**: Ranking quality with position weighting

## Using the Model for Recommendations

### Get Recommendations for a User

```typescript
// Get 10 recommendations for a user
const recommendations = await mlDataService.getRecommendationsForUser(userId, 10);
```

### Get Similar Tracks

```typescript
// Get 5 tracks similar to a specific track
const similarTracks = await mlDataService.getSimilarTracks(trackId, 5);
```

## Model Structure

The Content-Based Model consists of:
- Input layer (11 audio features)
- Normalization layer
- Dense layers with dropout for regularization
- Embedding output layer (32-dimensional)

## Best Practices

1. **Regular Retraining**: Retrain every few weeks to incorporate new listening patterns
2. **Data Diversity**: Ensure a diverse set of tracks and genres in training data
3. **Hyperparameter Tuning**: Experiment with different values for:
   - Embedding dimensions
   - Learning rate
   - Number of hidden layers
   - Regularization rate
4. **Evaluation**: Always validate against real user feedback

## Troubleshooting

- **Low F1 Score**: Usually indicates insufficient training data or poor feature diversity
- **Training Crashes**: Check available memory and reduce batch size
- **Slow Recommendations**: Consider adding caching or precomputing embeddings

## Further Development

- Implement genre and artist diversity controls
- Add visualization tools for model insights
- Create ensemble with collaborative filtering model 