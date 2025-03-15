# Audotics AI/ML Models Overview

## Introduction

Audotics employs a sophisticated AI/ML architecture to deliver personalized and group-based music recommendations. Our system combines multiple specialized models to address different aspects of music recommendation, user preference modeling, and group dynamics.

## Core ML Models

### 1. Speech-to-Text & Intent Recognition Model (LLM-Based NLP)

**Purpose:** Understand natural language queries and extract music-related intent to enable conversational music discovery.

**Main Features:**
- Understands natural language queries (e.g., "I feel sad, play something soothing")
- Context-aware music search (e.g., "Give me a 100-song Malayalam 90s evergreen playlist")
- Can interpret mood, location, weather, and past preferences
- Extracts music-related intent from text

**Technical Implementation:**
- Fine-tuned LLM-based intent classification model (GPT, BERT, or Llama)
- Named Entity Recognition (NER) for artist, genre, era, mood
- Sentence embeddings for semantic understanding
- Multi-turn conversations for refining recommendations

### 2. Next-Song Prediction Model (LSTM/GRU-Based Sequence Model)

**Purpose:** Predict the most suitable next song based on the current listening context and history.

**Main Features:**
- Predicts the next song based on current listening behavior
- Adapts in real-time using short-term user interactions
- Adjusts playlist sequencing dynamically

**Technical Implementation:**
- RNN-based Sequence Model (LSTM/GRU) for pattern recognition
- Attention mechanism to give weight to recent listening history
- Feature extraction from track embeddings and user behavior

### 3. AI-Generated Playlists (Reinforcement Learning-Based Personalization)

**Purpose:** Generate cohesive, thematic playlists tailored to user preferences and contexts.

**Main Features:**
- Dynamic playlist generation based on user's evolving preferences
- Creates custom mood-based playlists (e.g., "Workout Pumped Mix")
- Adapts recommendations based on feedback (like, skip, replay)

**Technical Implementation:**
- Reinforcement Learning (RL) - Deep Q-Learning (DQN) or Policy Gradient
- User reward system based on song plays, skips, and repeats
- Hybrid feature selection combining audio features, collaborative filtering, and text-based features

### 4. Content-Based Model (Audio Feature Analysis)

**Purpose:** Analyze audio features and metadata of tracks to recommend similar music based on acoustic properties.

**Main Features:**
- Suggests similar-sounding songs based on audio features
- Filters by genre, mood, BPM, and instrumentals

**Technical Implementation:**
- Neural Network (Autoencoder) to learn track embeddings
- Cosine Similarity for finding acoustically similar tracks
- Feature engineering using tempo, energy, valence, danceability, and spectral features

### 5. Collaborative Filtering Model (User-Item Relationship)

**Purpose:** Identify patterns in user listening behavior to recommend tracks enjoyed by similar users.

**Main Features:**
- Personalizes recommendations based on user-item interaction matrix
- Works for cold-start users using item-based similarity
- Balances popularity & novelty

**Technical Implementation:**
- Matrix Factorization (SVD, ALS, NMF)
- Implicit feedback handling (skips, favorites, repeats)
- Regularization to prevent overfitting
- Temporal dynamics for session-based recommendations

### 6. Group Recommendation Model

**Purpose:** Understand and model the interaction patterns and preference dynamics within groups.

**Main Features:**
- Aggregates multiple users' preferences for group sessions
- Uses fairness & diversity metrics to balance song selection
- Real-time feedback adjustment

**Technical Implementation:**
- Multiple aggregation strategies (Least Misery, Borda Count, Average Ranking)
- Dynamic adjustments based on role detection and satisfaction balancing
- Multi-session learning for improved group recommendations

### 7. User Preference Model

**Purpose:** Create a comprehensive representation of each user's musical taste profile.

**Main Features:**
- Tracks long-term & short-term preferences
- Preference tracking, contextual awareness
- Genre/artist affinity calculation
- Adjusts based on mood, time of day, and social context

**Technical Implementation:**
- Multi-faceted preference vectors
- Temporal modeling for evolving tastes
- Weighted preference mechanism
- Contextual signals processing

### 8. Hybrid Orchestrator (AI Model Selection & Fusion)

**Purpose:** Intelligently combine multiple recommendation models for optimal results.

**Main Features:**
- Dynamic model combining
- Context-aware selection
- Diversity injection
- Confidence-based selection

**Technical Implementation:**
- Weighted model combination
- Stacking ensemble techniques
- Performance monitoring

## Supporting AI Systems

### 1. Audio Feature Enrichment

**Purpose:** Expand and enhance audio feature representations beyond basic Spotify metrics.

**Main Features:**
- Extended feature extraction (MFCCs, Chroma Features, Spectral Centroid)
- Genre/mood classification
- Lyrical content analysis

**Technical Implementation:**
- Derived feature pipelines from raw Spotify audio features
- Feature normalization and standardization
- Genre & Mood Classification using CNN/RNN
- Lyrical Sentiment Analysis using Transformers

### 2. Real-time Feedback System

**Purpose:** Capture and process user feedback to continuously improve recommendations.

**Main Features:**
- Tracks explicit and implicit user feedback
- Adjusts recommendations in real-time
- Provides data for model retraining

**Technical Implementation:**
- Event-based feedback collection
- Real-time preference updates
- A/B testing framework

## TensorFlow.js Setup

Audotics uses TensorFlow.js with Node.js bindings for machine learning model training and inference.

### Configuration

The following configuration is added to the root `package.json`:

```json
"binary": {
  "module_name": "tensorflow-binding",
  "module_path": "./node_modules/@tensorflow/tfjs-node/lib/binding/{platform}-{arch}-{node_abi}"
}
```

### Dependencies

Required dependencies:

```json
"dependencies": {
  "@tensorflow/tfjs": "^4.17.0",
  "@tensorflow/tfjs-node": "^4.17.0"
}
```

### Usage Tips

1. **Import TensorFlow.js:**

   ```typescript
   import * as tf from '@tensorflow/tfjs-node';
   ```

2. **Check if GPU is available:**

   ```typescript
   console.log('Using GPU:', tf.getBackend() === 'webgl');
   ```

3. **Memory management:**

   ```typescript
   // Use tf.tidy for automatic cleanup
   const result = tf.tidy(() => {
     const x = tf.tensor([1, 2, 3]);
     const y = tf.tensor([4, 5, 6]);
     return x.add(y);
   });
   ``` 