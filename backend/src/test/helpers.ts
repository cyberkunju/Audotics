import { PrismaClient, User } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { CacheService } from '../services/cache.service';

export const prisma = new PrismaClient();

export const createTestUser = async (): Promise<User> => {
  return await prisma.user.create({
    data: {
      email: `test-${Date.now()}@example.com`,
      spotifyId: `spotify-${Date.now()}`,
      name: 'Test User',
    },
  });
};

export const generateTestToken = (userOrId: User | string): string => {
  const secret: string = config.jwt.secret as string;
  
  const userId = typeof userOrId === 'string' ? userOrId : userOrId.id;
  
  return jwt.sign(
    { id: userId },
    secret,
    { expiresIn: '1h' }
  );
};

export const clearDatabase = async (): Promise<void> => {
  try {
    // Use a transaction to ensure atomic operations and prevent deadlocks
    await prisma.$transaction(async (tx) => {
      // Disable foreign key checks first (PostgreSQL specific)
      await tx.$executeRaw`SET CONSTRAINTS ALL DEFERRED`;
      
      // Clear tables in a specific order that respects dependencies
      await tx.$executeRaw`TRUNCATE TABLE "TrackInteraction" CASCADE`;
      await tx.$executeRaw`TRUNCATE TABLE "TrackFeatures" CASCADE`;
      await tx.$executeRaw`TRUNCATE TABLE "Track" CASCADE`;
      await tx.$executeRaw`TRUNCATE TABLE "PlaylistUpdate" CASCADE`;
      await tx.$executeRaw`TRUNCATE TABLE "Playlist" CASCADE`;
      await tx.$executeRaw`TRUNCATE TABLE "GroupSession" CASCADE`;
      await tx.$executeRaw`TRUNCATE TABLE "UserPreference" CASCADE`;
      await tx.$executeRaw`TRUNCATE TABLE "User" CASCADE`;
      
      // Re-enable constraints
      await tx.$executeRaw`SET CONSTRAINTS ALL IMMEDIATE`;
    });
    
    // Clear any caches to ensure clean test state
    const cacheService = CacheService.getInstance();
    await cacheService.clear();
  } catch (error) {
    console.error('Error clearing database:', error);
    throw error;
  }
};

export const closeConnections = async (): Promise<void> => {
  await prisma.$disconnect();
};
