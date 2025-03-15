# Content-Based Model Training

This document describes the training process for the content-based recommendation model in Audotics.

## Overview

The content-based model analyzes audio features of tracks to recommend similar music based on acoustic properties. It uses a neural network to learn track embeddings and cosine similarity to find acoustically similar tracks.

## Training Process

The training process involves the following steps:

1. **Data Collection**: Fetch tracks with audio features from the database
2. **User Interaction Analysis**: Collect user interactions to identify similar tracks
3. **Feature Engineering**: Extract and normalize audio features
4. **Model Training**: Train a neural network to learn track embeddings
5. **Model Evaluation**: Evaluate the model's performance
6. **Model Saving**: Save the trained model for inference

## Training Script

The training script (`train_content_model.py`) is responsible for training the content-based model. It can be run with various parameters to customize the training process.

### Usage

```bash
python train_content_model.py --epochs 50 --batch-size 64 --validation-split 0.2 --learning-rate 0.001 --embedding-size 64
```

### Command-Line Arguments

- `--epochs`: Number of training epochs (default: 50)
- `--batch-size`: Batch size for training (default: 64)
- `--validation-split`: Fraction of data to use for validation (default: 0.2)
- `--learning-rate`: Learning rate for the optimizer (default: 0.001)
- `--embedding-size`: Size of the embedding vectors (default: 64)
- `--hidden-layers`: Comma-separated list of hidden layer sizes (default: "128,64")
- `--dropout-rate`: Dropout rate for regularization (default: 0.2)

## Data Processing

### Feature Extraction

The model uses the following audio features from Spotify:

- Acousticness
- Danceability
- Energy
- Instrumentalness
- Key
- Liveness
- Loudness
- Mode
- Speechiness
- Tempo
- Valence

### Feature Standardization

Features are standardized to have zero mean and unit variance to improve training stability:

```python
def standardize_features(features):
    """Standardize features to zero mean and unit variance"""
    means = np.mean(features, axis=0)
    stds = np.std(features, axis=0)
    stds[stds == 0] = 1  # Avoid division by zero
    return (features - means) / stds, means, stds
```

### Training Pairs Creation

The model is trained using pairs of tracks that are considered similar based on user interactions:

1. Tracks that the same user has interacted with are considered similar
2. For each user, all possible pairs of tracks they've interacted with are created
3. These pairs are used to train the model to produce similar embeddings for similar tracks

## Model Architecture

The model consists of:

1. **Input Layer**: Takes the audio features as input
2. **Hidden Layers**: Multiple dense layers with ReLU activation
3. **Embedding Layer**: Final layer that produces the track embeddings
4. **Normalization**: L2 normalization to ensure embeddings have unit length

```python
def build_model(feature_dim, embed_dim, hidden_layers, learning_rate, dropout_rate):
    """Build the neural network model for learning track embeddings"""
    inputs = tf.keras.layers.Input(shape=(feature_dim,))
    x = inputs
    
    # Add hidden layers
    for units in hidden_layers:
        x = tf.keras.layers.Dense(units, activation='relu')(x)
        x = tf.keras.layers.Dropout(dropout_rate)(x)
    
    # Embedding layer
    embeddings = tf.keras.layers.Dense(embed_dim)(x)
    
    # L2 normalization
    embeddings = tf.keras.layers.Lambda(
        lambda x: tf.nn.l2_normalize(x, axis=1)
    )(embeddings)
    
    # Create model
    model = tf.keras.Model(inputs=inputs, outputs=embeddings)
    
    # Compile model
    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=learning_rate),
        loss=cosine_distance
    )
    
    return model
```

## Training

The model is trained to minimize the cosine distance between embeddings of similar tracks:

```python
def cosine_distance(y_true, y_pred):
    """Custom loss function based on cosine distance"""
    # y_true is a dummy variable since we're using a siamese network
    # y_pred contains the embeddings of both tracks in a pair
    
    # Split the batch into anchor and positive embeddings
    anchor, positive = tf.split(y_pred, 2, axis=0)
    
    # Calculate cosine similarity (dot product of normalized vectors)
    similarity = tf.reduce_sum(anchor * positive, axis=1)
    
    # Convert to distance (1 - similarity)
    distance = 1.0 - similarity
    
    # Return mean distance as loss
    return tf.reduce_mean(distance)
```

## Model Saving

After training, the model is saved to disk for later use in recommendations:

```python
# Save model
model_dir = Path('../../data/models')
model_dir.mkdir(parents=True, exist_ok=True)
model_path = model_dir / 'content-based-model.keras'
print(f"Saving model to {model_path}")
model.save(model_path)
```

## Fallback Mechanism

If no user interactions are found in the database, the script generates synthetic interactions for training:

```python
def generate_synthetic_interactions(tracks):
    """Generate synthetic user interactions for training"""
    # Create synthetic users
    num_users = min(50, len(tracks) // 5)  # 1 user per 5 tracks, max 50 users
    num_users = max(10, num_users)  # At least 10 users
    
    # Generate interactions
    interactions = []
    
    # Each user interacts with 5-20 tracks
    for user_id in range(1, num_users + 1):
        # Determine how many tracks this user interacts with
        num_interactions = np.random.randint(5, min(20, len(tracks)))
        
        # Select random tracks for this user
        track_indices = np.random.choice(len(tracks), num_interactions, replace=False)
        
        for idx in track_indices:
            interactions.append({
                'userId': f"synthetic_user_{user_id}",
                'trackId': tracks[idx]['track_id']
            })
    
    return interactions
```

## Weights & Biases Integration

The training process is integrated with Weights & Biases (wandb) for experiment tracking:

```python
# Initialize wandb
wandb.init(
    project="audotics-content-model",
    config={
        "epochs": args.epochs,
        "batch_size": args.batch_size,
        "validation_split": args.validation_split,
        "learning_rate": args.learning_rate,
        "embedding_size": args.embedding_size,
        "hidden_layers": args.hidden_layers,
        "dropout_rate": args.dropout_rate,
        "feature_dim": features.shape[1],
        "num_tracks": features.shape[0],
        "num_similar_pairs": len(similar_pairs)
    }
)
```

## Using the Trained Model

After training, the model can be used to:

1. Generate embeddings for all tracks in the database
2. Find similar tracks by calculating cosine similarity between embeddings
3. Recommend tracks based on similarity scores

The model is used in the recommendation service to provide content-based recommendations to users. 