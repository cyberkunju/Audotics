#!/usr/bin/env python3
"""
Content-Based Model Training Script

This script trains the content-based recommendation model using TensorFlow and GPU acceleration
if available. It connects to the database to fetch training data and saves the model to disk.

Usage:
python train_content_model.py --epochs 50 --batch-size 64 --validation-split 0.2 --learning-rate 0.001 --embedding-size 64
"""

import os
import sys
import json
import argparse
import numpy as np
from pathlib import Path
from datetime import datetime
import psycopg2
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv

# Try importing TensorFlow, handle gracefully if not available
try:
    import tensorflow as tf
except ImportError:
    print("TensorFlow not found, some functionality will be limited")
    tf = None

def load_env_variables():
    """Load environment variables from .env file"""
    env_vars = {}
    
    # Try multiple possible locations for the .env file
    possible_paths = [
        '.env',                # Current directory
        '../.env',             # Parent directory
        '../../.env',          # Two levels up
        'src/scripts/.env',    # Copied by batch file
    ]
    
    for env_path in possible_paths:
        try:
            print(f"Trying to load .env from: {env_path}")
            with open(env_path, 'r') as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith('#'):
                        key, value = line.split('=', 1)
                        env_vars[key] = value
            print(f"Successfully loaded .env from: {env_path}")
            return env_vars
        except Exception as e:
            print(f"Could not load .env from {env_path}: {e}")
    
    print("Warning: Could not find .env file in any location")
    return env_vars

def connect_to_database(env_vars):
    """Connect to PostgreSQL database using environment variables"""
    try:
        # Parse DATABASE_URL if available
        db_url = env_vars.get('DATABASE_URL', '')
        if db_url and 'postgresql://' in db_url:
            # Format: postgresql://username:password@host:port/database?schema=public
            # Remove schema part
            db_url = db_url.split('?')[0]
            # Extract components
            auth_host, db_name = db_url.replace('postgresql://', '').split('/')
            user_pass, host_port = auth_host.split('@')
            
            if ':' in user_pass:
                user, password = user_pass.split(':')
            else:
                user, password = user_pass, ''
                
            if ':' in host_port:
                host, port = host_port.split(':')
            else:
                host, port = host_port, '5432'
                
            print(f"Connecting to database: {host}:{port}/{db_name} as {user}")
            
            conn = psycopg2.connect(
                dbname=db_name,
                user=user,
                password=password,
                host=host,
                port=port
            )
            return conn
        else:
            # Fallback to individual parameters
            conn = psycopg2.connect(
                dbname=env_vars.get('DATABASE_NAME', 'audotics'),
                user=env_vars.get('DATABASE_USER', 'postgres'),
                password=env_vars.get('DATABASE_PASSWORD', ''),
                host=env_vars.get('DATABASE_HOST', 'localhost'),
                port=env_vars.get('DATABASE_PORT', '5432')
            )
            return conn
    except Exception as e:
        print(f"Error connecting to database: {e}")
        return None

def fetch_training_data(conn):
    """Fetch training data from the database"""
    print("Fetching training data from database...")
    
    try:
        # Get tracks with audio features
        with conn.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute("""
                SELECT t.id AS track_id, t.name, t.artists, t.popularity, 
                       f.acousticness, f.danceability, f.energy, f.instrumentalness, 
                       f.key, f.liveness, f.loudness, f.mode, f.speechiness, 
                       f.tempo, f.valence
                FROM "Track" t
                JOIN "TrackFeatures" f ON t.id = f."trackId"
            """)
            tracks = cursor.fetchall()
            
            if not tracks:
                print("No tracks with audio features found in the database.")
                return None, None, None
                
            print(f"Found {len(tracks)} tracks with audio features")
            
            # Try to get user interactions
            try:
                cursor.execute("""
                    SELECT "userId", "trackId" FROM "UserInteraction"
                    WHERE "action" IN ('play', 'like', 'addToPlaylist')
                """)
                interactions = cursor.fetchall()
                
                if not interactions:
                    print("No user interactions found in the database. Generating synthetic interactions.")
                    interactions = generate_synthetic_interactions(tracks)
                    
                print(f"Using {len(interactions)} user interactions")
            except Exception as e:
                print(f"Error fetching user interactions: {e}")
                print("Generating synthetic interactions for training.")
                interactions = generate_synthetic_interactions(tracks)
            
            # Create track indices
            track_indices = {track['track_id']: i for i, track in enumerate(tracks)}
            
            # Group interactions by user
            user_tracks = {}
            for interaction in interactions:
                user_id = interaction['userId']
                track_id = interaction['trackId']
                
                if track_id not in track_indices:
                    continue  # Skip interactions for tracks without features
                    
                if user_id not in user_tracks:
                    user_tracks[user_id] = []
                user_tracks[user_id].append(track_id)
            
            # Create similar pairs
            similar_pairs = []
            for user_id, track_ids in user_tracks.items():
                # Remove duplicates
                unique_track_ids = list(set(track_ids))
                
                # Only process users with at least 2 tracks
                if len(unique_track_ids) >= 2:
                    # Create all possible pairs
                    for i in range(len(unique_track_ids)):
                        for j in range(i + 1, len(unique_track_ids)):
                            track1_id = unique_track_ids[i]
                            track2_id = unique_track_ids[j]
                            
                            if track1_id in track_indices and track2_id in track_indices:
                                similar_pairs.append([
                                    track_indices[track1_id],
                                    track_indices[track2_id]
                                ])
            
            print(f"Created {len(similar_pairs)} similar pairs from user interactions")
            
            # Extract features
            features = []
            track_ids = []
            
            for track in tracks:
                feature_vector = [
                    float(track['acousticness']),
                    float(track['danceability']),
                    float(track['energy']),
                    float(track['instrumentalness']),
                    float(track['key']),
                    float(track['liveness']),
                    float(track['loudness']),
                    float(track['mode']),
                    float(track['speechiness']),
                    float(track['tempo']),
                    float(track['valence'])
                ]
                features.append(feature_vector)
                track_ids.append(track['track_id'])
            
            return np.array(features), np.array(similar_pairs), track_ids
    except Exception as e:
        print(f"Error fetching training data: {e}")
        return None, None, None

def generate_synthetic_interactions(tracks):
    """Generate synthetic user interactions for training"""
    print("Generating synthetic user interactions for training...")
    
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
    
    print(f"Generated {len(interactions)} synthetic interactions for {num_users} users")
    return interactions

def standardize_features(features):
    """Standardize features to zero mean and unit variance"""
    means = np.mean(features, axis=0)
    stds = np.std(features, axis=0)
    stds[stds == 0] = 1  # Avoid division by zero
    return (features - means) / stds, means, stds

def create_training_pairs(features, similar_pairs):
    """Create training pairs for contrastive learning"""
    anchor_features = []
    positive_features = []
    
    for pair in similar_pairs:
        anchor_idx, positive_idx = pair
        anchor_features.append(features[anchor_idx])
        positive_features.append(features[positive_idx])
    
    return np.array(anchor_features), np.array(positive_features)

def build_model(feature_dim, embed_dim, hidden_layers, learning_rate, dropout_rate):
    """Build the content-based recommendation model"""
    # Input layer
    inputs = tf.keras.Input(shape=(feature_dim,))
    
    # Normalization layer
    x = tf.keras.layers.BatchNormalization()(inputs)
    
    # Feature processing
    x = tf.keras.layers.Dense(
        embed_dim, 
        activation='relu',
        kernel_initializer='glorot_normal',
        kernel_regularizer=tf.keras.regularizers.l2(0.01)
    )(x)
    
    # Hidden layers
    for units in hidden_layers:
        x = tf.keras.layers.Dense(
            units,
            activation='relu',
            kernel_initializer='glorot_normal',
            kernel_regularizer=tf.keras.regularizers.l2(0.01)
        )(x)
        x = tf.keras.layers.Dropout(dropout_rate)(x)
    
    # Output layer (embedding space)
    outputs = tf.keras.layers.Dense(
        embed_dim,
        activation='tanh',
        kernel_initializer='glorot_normal'
    )(x)
    
    # Create model
    model = tf.keras.Model(inputs=inputs, outputs=outputs)
    
    # Compile model with MSE loss instead of cosine similarity
    # This works better for training embedding models
    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=learning_rate),
        loss='mse',  # Changed from cosine_similarity to mse
        metrics=['mae']  # Changed from accuracy to mean absolute error
    )
    
    return model

def train_model(features, similar_pairs, args):
    """Train the content-based model using a custom training approach"""
    feature_dim = features.shape[1]
    
    # Standardize features
    std_features, means, stds = standardize_features(features)
    
    # Create training pairs
    anchor_features = []
    positive_features = []
    
    for pair in similar_pairs:
        anchor_idx, positive_idx = pair
        anchor_features.append(std_features[anchor_idx])
        positive_features.append(std_features[positive_idx])
    
    anchor_features = np.array(anchor_features)
    positive_features = np.array(positive_features)
    
    print(f"Training with {len(anchor_features)} pairs")
    print(f"Feature dimension: {feature_dim}")
    print(f"Embedding dimension: {args.embedding_size}")
    
    # Create a simpler model for embedding
    print("Building model...")
    model = tf.keras.Sequential([
        tf.keras.layers.InputLayer(input_shape=(feature_dim,)),
        tf.keras.layers.BatchNormalization(),
        tf.keras.layers.Dense(args.embedding_size * 2, activation='relu',
                             kernel_regularizer=tf.keras.regularizers.l2(0.01)),
        tf.keras.layers.Dropout(0.2),
        tf.keras.layers.Dense(args.embedding_size, activation='relu',
                             kernel_regularizer=tf.keras.regularizers.l2(0.01)),
        tf.keras.layers.Dropout(0.2),
        tf.keras.layers.Dense(args.embedding_size, activation='tanh')
    ])
    
    # Compile model
    optimizer = tf.keras.optimizers.Adam(learning_rate=args.learning_rate)
    
    # Print model summary
    model.summary()
    
    # Create checkpoint directory
    checkpoint_dir = Path('../data/models/checkpoints')
    checkpoint_dir.mkdir(parents=True, exist_ok=True)
    
    # Create dataset
    train_size = int(len(anchor_features) * (1 - args.validation_split))
    train_anchor = anchor_features[:train_size]
    train_positive = positive_features[:train_size]
    val_anchor = anchor_features[train_size:]
    val_positive = positive_features[train_size:]
    
    # Create TensorFlow datasets
    train_dataset = tf.data.Dataset.from_tensor_slices((train_anchor, train_positive))
    train_dataset = train_dataset.shuffle(buffer_size=1000).batch(args.batch_size)
    
    val_dataset = tf.data.Dataset.from_tensor_slices((val_anchor, val_positive))
    val_dataset = val_dataset.batch(args.batch_size)
    
    # Custom training loop
    print("\nStarting model training...")
    
    # Training history
    history = {
        'loss': [],
        'val_loss': []
    }
    
    # Cosine similarity loss function
    def cosine_distance(y_true, y_pred):
        y_true = tf.nn.l2_normalize(y_true, axis=-1)
        y_pred = tf.nn.l2_normalize(y_pred, axis=-1)
        return -tf.reduce_sum(y_true * y_pred, axis=-1)
    
    # Training loop
    best_val_loss = float('inf')
    for epoch in range(args.epochs):
        print(f"Epoch {epoch+1}/{args.epochs}")
        
        # Training
        epoch_loss = 0
        num_batches = 0
        
        for anchor_batch, positive_batch in train_dataset:
            with tf.GradientTape() as tape:
                # Get embeddings
                anchor_embedding = model(anchor_batch, training=True)
                positive_embedding = model(positive_batch, training=True)
                
                # Calculate loss
                loss = tf.reduce_mean(cosine_distance(anchor_embedding, positive_embedding))
                
            # Apply gradients
            gradients = tape.gradient(loss, model.trainable_variables)
            optimizer.apply_gradients(zip(gradients, model.trainable_variables))
            
            epoch_loss += loss.numpy()
            num_batches += 1
        
        avg_train_loss = epoch_loss / num_batches if num_batches > 0 else 0
        
        # Validation
        val_loss = 0
        num_val_batches = 0
        
        for anchor_batch, positive_batch in val_dataset:
            # Get embeddings
            anchor_embedding = model(anchor_batch, training=False)
            positive_embedding = model(positive_batch, training=False)
            
            # Calculate loss
            batch_val_loss = tf.reduce_mean(cosine_distance(anchor_embedding, positive_embedding))
            val_loss += batch_val_loss.numpy()
            num_val_batches += 1
        
        avg_val_loss = val_loss / num_val_batches if num_val_batches > 0 else 0
        
        # Save history
        history['loss'].append(float(avg_train_loss))
        history['val_loss'].append(float(avg_val_loss))
        
        print(f"  loss: {avg_train_loss:.4f} - val_loss: {avg_val_loss:.4f}")
        
        # Save checkpoint if validation loss improved
        if avg_val_loss < best_val_loss:
            best_val_loss = avg_val_loss
            checkpoint_path = checkpoint_dir / f'content_model_{epoch+1:02d}_{avg_val_loss:.4f}.keras'
            model.save(str(checkpoint_path))
            print(f"  Saved checkpoint to {checkpoint_path}")
    
    # Save model
    model_dir = Path('../data/models')
    model_dir.mkdir(parents=True, exist_ok=True)
    
    model_path = model_dir / 'content-based-model.keras'
    print(f"\nSaving model to {model_path}")
    model.save(str(model_path))
    
    # Save normalization parameters
    norm_path = model_dir / 'content-based-model_normalization.json'
    with open(norm_path, 'w') as f:
        json.dump({
            'means': means.tolist(),
            'stds': stds.tolist()
        }, f)
    
    # Save training history
    history_path = model_dir / 'content-based-model_history.json'
    with open(history_path, 'w') as f:
        json.dump(history, f)
    
    print("\nTraining completed!")
    print(f"Final loss: {history['loss'][-1]:.4f}")
    print(f"Final validation loss: {history['val_loss'][-1]:.4f}")
    
    return model, history

def create_model(input_dim, embedding_size, learning_rate=0.001):
    """
    Create a neural network model for content-based recommendations
    
    Args:
        input_dim: Dimension of input features
        embedding_size: Size of the embedding layer
        learning_rate: Learning rate for the optimizer
        
    Returns:
        Compiled TensorFlow model
    """
    if tf is None:
        raise ImportError("TensorFlow is required to create the model")
    
    model = tf.keras.Sequential([
        tf.keras.layers.InputLayer(input_shape=(input_dim,)),
        tf.keras.layers.Dense(128, activation='relu'),
        tf.keras.layers.Dropout(0.2),
        tf.keras.layers.Dense(64, activation='relu'),
        tf.keras.layers.Dropout(0.1),
        tf.keras.layers.Dense(embedding_size, activation='tanh')
    ])
    
    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=learning_rate),
        loss='mse'
    )
    
    return model

def save_model_and_metadata(model, history, track_ids, means, stds):
    """
    Save the trained model and associated metadata
    
    Args:
        model: Trained TensorFlow model
        history: Training history object
        track_ids: List of track IDs corresponding to the training data
        means: Mean values used for feature standardization
        stds: Standard deviation values used for feature standardization
    """
    if tf is None:
        raise ImportError("TensorFlow is required to save the model")
    
    # Create directories if they don't exist
    model_dir = os.path.join(os.path.dirname(__file__), "../src/aiml/models/saved")
    os.makedirs(model_dir, exist_ok=True)
    
    # Save the model
    model_path = os.path.join(model_dir, "content_model")
    model.save(model_path)
    print(f"Model saved to {model_path}")
    
    # Save metadata
    metadata = {
        "track_ids": track_ids,
        "means": means.tolist() if hasattr(means, "tolist") else means,
        "stds": stds.tolist() if hasattr(stds, "tolist") else stds,
        "training_loss": history.history["loss"][-1] if history.history["loss"] else None,
        "val_loss": history.history["val_loss"][-1] if "val_loss" in history.history and history.history["val_loss"] else None,
        "embedding_size": model.layers[-1].output_shape[-1],
        "date_trained": datetime.datetime.now().isoformat()
    }
    
    metadata_path = os.path.join(model_dir, "metadata.json")
    with open(metadata_path, "w") as f:
        json.dump(metadata, f, indent=2)
    
    print(f"Metadata saved to {metadata_path}")

def main():
    """Main function to train the content-based model"""
    # Check if TensorFlow is available before proceeding with training
    if not tf:
        print("Cannot proceed with model training because TensorFlow is not available.")
        sys.exit(1)
        
    # Parse command line arguments
    parser = argparse.ArgumentParser(description='Train content-based recommendation model')
    parser.add_argument('--epochs', type=int, default=50, help='Number of training epochs')
    parser.add_argument('--batch-size', type=int, default=64, help='Training batch size')
    parser.add_argument('--validation-split', type=float, default=0.2, help='Validation data split ratio')
    parser.add_argument('--learning-rate', type=float, default=0.001, help='Learning rate')
    parser.add_argument('--embedding-size', type=int, default=64, help='Size of track embeddings')
    args = parser.parse_args()
    
    print(f"Training with parameters: epochs={args.epochs}, batch_size={args.batch_size}, "
          f"validation_split={args.validation_split}, learning_rate={args.learning_rate}, "
          f"embedding_size={args.embedding_size}")
    
    # Load environment variables
    env_vars = load_env_variables()
    
    # Connect to database
    conn = connect_to_database(env_vars)
    if not conn:
        print("Failed to connect to database. Exiting.")
        sys.exit(1)
    
    # Fetch training data
    features, similar_pairs, track_ids = fetch_training_data(conn)
    conn.close()
    
    if features is None or similar_pairs is None or track_ids is None:
        print("Failed to fetch training data. Exiting.")
        sys.exit(1)
    
    # Standardize features
    standardized_features, means, stds = standardize_features(features)
    
    # Create and train the model
    model = create_model(standardized_features.shape[1], args.embedding_size, args.learning_rate)
    
    # Train the model
    history = train_model(
        model, 
        standardized_features, 
        similar_pairs, 
        args.epochs, 
        args.batch_size, 
        args.validation_split
    )
    
    # Save the model and metadata
    save_model_and_metadata(model, history, track_ids, means, stds)
    
    print("Training completed successfully!")

if __name__ == "__main__":
    main() 