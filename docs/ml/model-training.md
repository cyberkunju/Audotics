# Model Training Documentation

This document provides information about training the recommendation models used in the Audotics platform.

## Content-Based Model Training

The content-based recommendation model analyzes audio features of tracks to recommend similar music. The training process involves:

1. Fetching track audio features from the database
2. Creating similar track pairs based on user interactions
3. Training a neural network to learn track embeddings
4. Saving the model and metadata for inference

### Training Requirements

- Python 3.9-3.11 (TensorFlow is not compatible with Python 3.12+)
- TensorFlow 2.x
- NumPy
- psycopg2 (for database connectivity)

### Training Script

The main training script is located at `backend/src/scripts/train_content_model.py`. It can be run with the following parameters:

```bash
python train_content_model.py --epochs 50 --batch-size 64 --validation-split 0.2 --learning-rate 0.001 --embedding-size 64
```

Parameters:
- `--epochs`: Number of training epochs (default: 50)
- `--batch-size`: Batch size for training (default: 64)
- `--validation-split`: Validation data split ratio (default: 0.2)
- `--learning-rate`: Learning rate for the optimizer (default: 0.001)
- `--embedding-size`: Size of the track embeddings (default: 64)

### Mock Training

For environments where TensorFlow is not available or for testing purposes, a mock training script is provided at `backend/src/scripts/mock_content_model.py`. This script simulates the training process without requiring TensorFlow.

```bash
python mock_content_model.py --epochs 5 --batch-size 64 --validation-split 0.2 --learning-rate 0.001 --embedding-size 64
```

The mock training script:
- Uses the same data pipeline as the real training script
- Generates synthetic data if database connection fails
- Simulates the training process with realistic loss values
- Saves mock model files and metadata for testing

### Training Process

1. **Environment Setup**:
   - The script first checks for GPU availability
   - Loads environment variables for database connection

2. **Data Preparation**:
   - Connects to the PostgreSQL database
   - Fetches tracks with audio features
   - Fetches user interactions or generates synthetic ones
   - Creates similar track pairs based on user listening history
   - Standardizes audio features

3. **Model Creation**:
   - Creates a neural network with the specified embedding size
   - Uses cosine similarity as the training objective
   - Configures the Adam optimizer with the specified learning rate

4. **Training Loop**:
   - Trains for the specified number of epochs
   - Saves checkpoints after each epoch
   - Monitors training and validation loss

5. **Model Saving**:
   - Saves the final model in the Keras format
   - Saves metadata including feature means and standard deviations
   - Saves track IDs for inference

### Output Files

The training process produces the following files:

- `src/aiml/models/content-based-model.keras`: The trained model
- `src/aiml/models/content-based-model-metadata.json`: Model metadata
- `src/aiml/models/checkpoints/content_model_XX_YYYY.keras`: Checkpoint files

### Troubleshooting

#### TensorFlow Not Available

If you encounter an error about TensorFlow not being available, ensure you're using a compatible Python version (3.9-3.11) and install TensorFlow:

```bash
pip install tensorflow
```

For environments where TensorFlow cannot be installed, use the mock training script instead.

#### Database Connection Issues

If the script cannot connect to the database:
1. Check that the database is running
2. Verify the connection parameters in the `.env` file
3. Ensure the required tables exist in the database

The mock training script can generate synthetic data if database connection fails.

## Collaborative Filtering Model

Documentation for the collaborative filtering model training will be added in a future update.

## Hybrid Recommendation Model

Documentation for the hybrid recommendation model training will be added in a future update. 