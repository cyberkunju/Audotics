# AIML (Artificial Intelligence & Machine Learning) Module

This directory contains all AI and ML related code for the Audotics music recommendation system.

## Directory Structure

- **models/** - Contains ML model implementations
  - `content-based.model.ts` - Content-based recommendation model using audio features

- **services/** - Contains services for ML data processing and model management
  - `ml-data.service.ts` - Service for managing ML data, training, and generating recommendations

- **utils/** - Contains utility functions and helper classes for ML
  - `model-evaluator.ts` - Utilities for evaluating model performance (precision, recall, F1 score, etc.)

- **docs/** - Contains documentation for ML models and systems
  - `ML_MODELS_OVERVIEW.md` - Overview of all ML models in the system
  - `ML_MODELS_TODO.md` - Implementation roadmap for ML models
  - `TENSORFLOW_JS_SETUP.md` - Guide for TensorFlow.js setup and configuration

- **data/** - Directory for storing model data, training datasets, etc.

## Usage

The AIML module is integrated into the main application through the `AimlModule` class, which provides access to ML services like `MLDataService`.

### Key Features

1. **Content-Based Recommendation** - Recommends music based on audio features
2. **Model Training & Evaluation** - Supports training models on user data with evaluation metrics
3. **Spotify Integration** - Fetches and processes audio features from Spotify API
4. **Natural Language Processing** - Processes text-based requests for music recommendations

## Training Scripts

The system includes scripts for training and updating the recommendation models:

### Enhanced Training Script

Located at `src/scripts/enhanced-train-model.ts`, this script trains the content-based recommendation model with advanced metrics tracking.

```bash
# Basic usage
npx ts-node src/scripts/enhanced-train-model.ts

# With custom parameters
npx ts-node src/scripts/enhanced-train-model.ts --epochs=30 --batch-size=32

# Test run with fewer epochs
npx ts-node src/scripts/enhanced-train-model.ts --epochs=5 --batch-size=16 --test-run

# Using simulated W&B mode (avoids authentication issues)
npx ts-node src/scripts/enhanced-train-model.ts --simulated-wandb
```

#### Command Line Options

- `--epochs=<number>` - Number of training epochs (default: 30)
- `--batch-size=<number>` - Batch size for training (default: 32)
- `--test-run` - Run a shorter training process for testing
- `--simulated-wandb` - Use simulated Weights & Biases tracking (recommended if you don't have a W&B account)
- `--no-wandb` - Disable W&B tracking completely

### Weights & Biases Integration

The training script includes integration with Weights & Biases (W&B) for experiment tracking. Due to potential authentication issues on some systems, you can use the `--simulated-wandb` flag to run in simulated mode, which provides the same functionality without requiring W&B authentication.

## Development

When developing new ML models or features:

1. Place model implementations in the `models/` directory
2. Add services for data processing in the `services/` directory
3. Add utility functions in the `utils/` directory
4. Update documentation in the `docs/` directory
5. Store model data and datasets in the `data/` directory

## Future Enhancements

See `docs/ML_MODELS_TODO.md` for the complete roadmap of planned ML features and enhancements. 