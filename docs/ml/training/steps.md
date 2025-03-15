# Content-Based Model Training and Evaluation Guide

## Overview

This guide provides step-by-step instructions for training and evaluating the Content-Based Recommendation Model. The model uses audio features from Spotify to recommend tracks with similar acoustic properties.

## Prerequisites

Before proceeding, ensure:

1. Your database contains sufficient user data:
   - User listening history (track interactions)
   - Tracks with audio features

2. Your application environment is properly configured:
   - Database connection
   - Spotify API credentials (for fetching missing audio features)
   - Weights & Biases account (for tracking model training)

## Step 1: Initialize Your Environment

```bash
# Start your application in development mode
npm run start:dev

# In a separate terminal, ensure your database is up to date
npx prisma db push

# Log in to your Weights & Biases account
npx wandb login
```

When prompted, enter your W&B API key, which you can find at https://wandb.ai/settings.

## Step 2: Gather Audio Features

Before training, you need to ensure your tracks have audio features:

```bash
# Use the API endpoint to batch update audio features
curl -X POST http://localhost:3000/api/ml/users/any-user-id/collect \
  -H "Content-Type: application/json" \
  -d '{}'
```

Alternatively, use the MLDataService programmatically:

```typescript
await mlDataService.batchUpdateAudioFeatures(100); // Process 100 tracks
```

## Step 3: Train the Model

You have three options for training:

### Option 1: Using the Command Line Script

Train the model directly from the command line with optional parameters:

```bash
# Basic training with default parameters
npx ts-node src/scripts/train-content-model.ts

# Custom training with specific parameters
npx ts-node src/scripts/train-content-model.ts --epochs=100 --batch-size=64 --validation-split=0.3
```

### Option 2: Using the API Endpoint

Send a POST request to the training endpoint:

```bash
curl -X POST http://localhost:3000/api/ml/train/content-model \
  -H "Content-Type: application/json" \
  -d '{"epochs": 50, "batchSize": 32, "validationSplit": 0.2}'
```

### Option 3: Programmatic Training

Import and use the MLDataService in your code:

```typescript
import { MLDataService } from '../aiml/services/ml-data.service';
import { DatabaseService } from '../services/database.service';
import { SpotifyService } from '../services/spotify.service';

async function trainModel() {
  const dbService = new DatabaseService();
  await dbService.onModuleInit();
  
  const spotifyService = new SpotifyService(dbService);
  const mlDataService = new MLDataService(dbService, spotifyService);
  
  const result = await mlDataService.trainModel(50, 0.2, 32);
  console.log('Training complete:', result);
  
  // Finalize W&B run
  await mlDataService.finalizeWandbRun();
  
  await dbService.onModuleDestroy();
}

trainModel().catch(console.error);
```

## Step 4: Monitor Training with Weights & Biases

Our model training is now integrated with Weights & Biases for advanced monitoring and tracking:

1. **Live Training Dashboard**: During training, visit [https://wandb.ai](https://wandb.ai) and navigate to your project "audotics-recommendation" to view real-time metrics:
   - Training/validation loss and accuracy
   - Learning rate and other hyperparameters
   - System resource usage

2. **Compare Different Training Runs**: W&B allows you to compare multiple training runs with different hyperparameters:
   ```bash
   # Run multiple training sessions with different parameters
   npx ts-node src/scripts/train-content-model.ts --epochs=50
   npx ts-node src/scripts/train-content-model.ts --epochs=100 --batch-size=64
   ```

3. **Model Reports**: After training, create reports in W&B to document your findings:
   - Performance metrics (F1 score, precision, recall)
   - Training configurations
   - Recommendations for improvement

4. **Sharing Results**: Share your W&B dashboard with team members by creating a team in W&B and inviting collaborators.

5. **Analyzing Model Performance Over Time**: Use the W&B interface to:
   - Compare multiple runs side-by-side
   - Track metric improvements across versions
   - Identify optimal hyperparameters
   - Generate custom visualizations like confusion matrices, ROC curves, etc.

6. **Viewing Dashboard URLs**: After each training run, the console will display a direct link to the W&B dashboard. Example:
   ```
   View run at: https://wandb.ai/username/audotics-recommendation/runs/run-id
   ```
   Click this link to view detailed run information.

## Step 5: Evaluate the Model

After training, evaluate the model's performance:

```bash
# Using the API
curl -X GET http://localhost:3000/api/ml/models/content-based/evaluate
```

Evaluate the following metrics:
- **F1 Score**: Should be above 0.6 for a good model
- **Precision**: Percentage of recommended tracks that are relevant
- **Recall**: Percentage of relevant tracks that were recommended
- **MAP**: Mean Average Precision for ranking quality
- **NDCG**: Normalized Discounted Cumulative Gain for position-weighted ranking

## Step 6: Test Recommendations

Test the model by getting recommendations:

```bash
# Get recommendations for a user
curl -X POST http://localhost:3000/api/ml/users/{userId}/recommendations?limit=10

# Get similar tracks
curl -X GET http://localhost:3000/api/ml/tracks/{trackId}/similar?limit=10
```

## Step 7: Fine-Tuning (If Necessary)

If the model performance is below expectations (F1 score < 0.6), consider:

1. Gathering more training data
2. Adjusting hyperparameters:
   ```bash
   npx ts-node src/scripts/train-content-model.ts --epochs=200 --batch-size=32 --validation-split=0.15
   ```
3. Modifying the model architecture in `content-based.model.ts`:
   - Adjust embedding dimension (default: 32)
   - Change hidden layer sizes (default: [64, 32])
   - Modify learning rate (default: 0.001)
   - Adjust regularization rate (default: 0.01)

## Troubleshooting

- **"No training pairs available"**: Add more user listening history or reduce uniqueness constraints
- **Out of memory errors**: Reduce batch size or simplify model architecture
- **Low similarity scores**: Check audio feature normalization and embedding dimension

## Next Steps

After successfully training the Content-Based Model, you can:

1. Train the Collaborative Filtering Model
2. Create a hybrid recommender system
3. Implement A/B testing to compare model versions 