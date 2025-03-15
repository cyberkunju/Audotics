import { PrismaClient } from '@prisma/client';
import { config } from '../config';

// Ensure we're using test environment
process.env.NODE_ENV = 'test';

// Global test setup
beforeAll(async () => {
  // Add any global setup here
});

// Global test teardown
afterAll(async () => {
  // Add any global teardown here
});

// Create a test database client
export const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/audotics_test',
    },
  },
});
