import { PrismaClient, Track, TrackFeatures } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

// Genre pool for more diversity
const GENRE_POOL = [
  'Rock', 'Pop', 'Hip Hop', 'Jazz', 'Electronic', 
  'Classical', 'R&B', 'Country', 'Metal', 'Indie',
  'Alternative', 'Folk', 'Blues', 'Reggae', 'Punk',
  'Funk', 'Soul', 'Disco', 'House', 'Techno',
  'Ambient', 'Trap', 'Dubstep', 'Latin', 'World'
];

/**
 * Generate random audio features for testing
 */
function generateRandomAudioFeatures(): Omit<TrackFeatures, 'id' | 'trackId' | 'updatedAt'> {
  // Generate more realistic audio features with deliberate clusters
  const profileType = Math.floor(Math.random() * 5); // 5 different profile types
  
  let acousticness, danceability, energy, instrumentalness, valence;
  
  switch(profileType) {
    case 0: // Calm, acoustic music
      acousticness = 0.7 + Math.random() * 0.3;
      danceability = Math.random() * 0.4;
      energy = Math.random() * 0.4;
      instrumentalness = 0.4 + Math.random() * 0.6;
      valence = 0.3 + Math.random() * 0.4;
      break;
    case 1: // Energetic dance music
      acousticness = Math.random() * 0.3;
      danceability = 0.7 + Math.random() * 0.3;
      energy = 0.7 + Math.random() * 0.3;
      instrumentalness = Math.random() * 0.3;
      valence = 0.6 + Math.random() * 0.4;
      break;
    case 2: // Sad, low energy
      acousticness = 0.4 + Math.random() * 0.4;
      danceability = Math.random() * 0.5;
      energy = Math.random() * 0.4;
      instrumentalness = Math.random() * 0.5;
      valence = Math.random() * 0.3;
      break;
    case 3: // Electronic, high energy
      acousticness = Math.random() * 0.2;
      danceability = 0.5 + Math.random() * 0.5;
      energy = 0.7 + Math.random() * 0.3;
      instrumentalness = 0.6 + Math.random() * 0.4;
      valence = 0.4 + Math.random() * 0.6;
      break;
    default: // Mixed features
      acousticness = Math.random();
      danceability = Math.random();
      energy = Math.random();
      instrumentalness = Math.random();
      valence = Math.random();
  }

  return {
    acousticness,
    danceability,
    energy,
    instrumentalness,
    key: Math.floor(Math.random() * 12),
    liveness: Math.random(),
    loudness: -20 + Math.random() * 20,
    mode: Math.random() > 0.5 ? 1 : 0,
    speechiness: Math.random() * 0.5,
    tempo: 60 + Math.random() * 140,
    valence
  };
}

/**
 * Generate sample track
 */
function generateSampleTrack(index: number): Omit<Track, 'id' | 'createdAt' | 'updatedAt'> {
  // Create more realistic track data with proper artist distribution
  // Some tracks should have the same artists to create clusters
  
  // Assign artists with some probability of reusing popular artists
  let artists;
  const artistCount = Math.random() > 0.7 ? 2 : 1; // 30% chance of having 2 artists
  
  if (Math.random() > 0.7) {
    // Use one of the "popular" artists (0-9)
    const popularArtist = `Artist ${Math.floor(Math.random() * 10)}`;
    if (artistCount === 1) {
      artists = [popularArtist];
    } else {
      const secondArtist = `Artist ${Math.floor(Math.random() * 30)}`;
      artists = [popularArtist, secondArtist];
    }
  } else {
    // Use random artists
    artists = Array(artistCount).fill(0).map(() => 
      `Artist ${Math.floor(Math.random() * 30)}`
    );
  }
  
  // Generate album with higher chance of tracks being from the same album
  const albumIndex = Math.floor(index / 5); // Every 5 tracks share an album
  const album = `Album ${albumIndex % 50}`; // 50 different albums
  
  // Generate realistic popularity (normal distribution around 50)
  let popularity = Math.floor(50 + (Math.random() + Math.random() + Math.random() - 1.5) * 33);
  popularity = Math.max(1, Math.min(100, popularity)); // Clamp between 1-100
  
  return {
    name: `Sample Track ${index}`,
    artists,
    album,
    popularity,
    spotifyId: `spotify-id-${index}`,
  };
}

/**
 * Seed database with sample data for testing
 */
async function seedDatabase() {
  console.log('Seeding database with sample data...');
  
  // Check current data
  const tracksCount = await prisma.track.count();
  const featuresCount = await prisma.trackFeatures.count();
  const usersCount = await prisma.user.count();
  const interactionsCount = await prisma.trackInteraction.count();
  
  console.log('Current database stats:');
  console.log(`- Tracks: ${tracksCount}`);
  console.log(`- Track Features: ${featuresCount}`);
  console.log(`- Users: ${usersCount}`);
  console.log(`- Track Interactions: ${interactionsCount}`);
  
  // Only seed if the database is relatively empty
  if (tracksCount > 100 && featuresCount > 100 && usersCount > 5 && interactionsCount > 200) {
    console.log('Database already has sufficient data, skipping seeding');
    return;
  }
  
  console.log('Generating sample data...');
  
  // Create users if needed
  if (usersCount < 20) {
    const usersToCreate = 30 - usersCount;
    console.log(`Creating ${usersToCreate} sample users...`);
    
    for (let i = 0; i < usersToCreate; i++) {
      await prisma.user.create({
        data: {
          name: `Test User ${i + 1}`,
          email: `test${i + 1}@example.com`,
          avatar: `https://example.com/avatar${i + 1}.jpg`,
        }
      });
    }
  }
  
  // Create tracks and features if needed
  if (tracksCount < 500) {
    const tracksToCreate = 1000 - tracksCount;
    console.log(`Creating ${tracksToCreate} sample tracks with audio features...`);
    
    // Create tracks in batches to avoid memory issues
    const BATCH_SIZE = 50;
    for (let batchStart = 0; batchStart < tracksToCreate; batchStart += BATCH_SIZE) {
      const batchEnd = Math.min(batchStart + BATCH_SIZE, tracksToCreate);
      const batchPromises: Promise<any>[] = [];
      
      for (let i = batchStart; i < batchEnd; i++) {
        // Create track
        const trackPromise = prisma.track.create({
          data: generateSampleTrack(i + 1 + tracksCount)
        }).then(track => {
          // Create audio features for the track
          return prisma.trackFeatures.create({
            data: {
              trackId: track.id,
              ...generateRandomAudioFeatures()
            }
          });
        });
        
        batchPromises.push(trackPromise);
      }
      
      await Promise.all(batchPromises);
      console.log(`Created tracks ${batchStart + 1 + tracksCount} to ${batchEnd + tracksCount}`);
    }
  }
  
  // Create track interactions if needed
  if (interactionsCount < 2000) {
    const interactionsToCreate = 5000 - interactionsCount;
    console.log(`Creating ${interactionsToCreate} sample track interactions...`);
    
    // Get all users and tracks
    const users = await prisma.user.findMany({ select: { id: true } });
    const tracks = await prisma.track.findMany({ select: { id: true } });
    
    if (users.length === 0 || tracks.length === 0) {
      console.error('No users or tracks found to create interactions');
      return;
    }
    
    // Create interactions in batches
    const BATCH_SIZE = 100;
    const interactionTypes = ['play', 'skip', 'like'];
    
    for (let batchStart = 0; batchStart < interactionsToCreate; batchStart += BATCH_SIZE) {
      const batchEnd = Math.min(batchStart + BATCH_SIZE, interactionsToCreate);
      const batchPromises: Promise<any>[] = [];
      
      for (let i = batchStart; i < batchEnd; i++) {
        // Create more realistic interaction patterns:
        // - Some users are more active than others
        // - Some tracks are more popular than others
        // - There are clusters of user preferences
        
        // Select user with bias toward active users
        const userIndex = Math.floor(Math.pow(Math.random(), 2) * users.length);
        const user = users[userIndex];
        
        // Select track with bias toward popular tracks
        const trackIndex = Math.floor(Math.pow(Math.random(), 1.5) * tracks.length);
        const track = tracks[trackIndex];
        
        const type = interactionTypes[Math.floor(Math.random() * interactionTypes.length)];
        
        // Create interaction with timestamp in last 90 days
        const timestamp = new Date(Date.now() - Math.floor(Math.random() * 90 * 24 * 60 * 60 * 1000));
        
        const interactionPromise = prisma.trackInteraction.create({
          data: {
            userId: user.id,
            trackId: track.id,
            type,
            timestamp
          }
        }).catch(error => {
          // Skip if interaction already exists or other error
          if (!error.message.includes('Unique constraint')) {
            console.error(`Error creating interaction: ${error.message}`);
          }
          return null; // Return null instead of void for consistent typing
        });
        
        batchPromises.push(interactionPromise);
      }
      
      await Promise.all(batchPromises);
      console.log(`Created interactions ${batchStart + 1} to ${batchEnd}`);
    }
  }
  
  console.log('Database seeding complete!');
  await checkDbStats();
}

/**
 * Check database statistics
 */
export async function checkDbStats() {
  const tracksCount = await prisma.track.count();
  const featuresCount = await prisma.trackFeatures.count();
  const usersCount = await prisma.user.count();
  const interactionsCount = await prisma.trackInteraction.count();
  
  console.log('Database stats:');
  console.log(`- Tracks: ${tracksCount}`);
  console.log(`- Track Features: ${featuresCount}`);
  console.log(`- Users: ${usersCount}`);
  console.log(`- Track Interactions: ${interactionsCount}`);
  
  // Check if we have enough data for training
  const hasEnoughData = 
    tracksCount >= 500 && 
    featuresCount >= 500 && 
    usersCount >= 20 && 
    interactionsCount >= 2000;
  
  console.log(`Database has ${hasEnoughData ? 'sufficient' : 'insufficient'} data for model training`);
  
  return hasEnoughData;
}

// Execute seed function if script is run directly
if (require.main === module) {
  seedDatabase()
    .then(async () => {
      await prisma.$disconnect();
    })
    .catch(async (e) => {
      console.error(e);
      await prisma.$disconnect();
      process.exit(1);
    });
} 