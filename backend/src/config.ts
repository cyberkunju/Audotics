import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config();

interface Config {
  port: number;
  corsOrigins: string | string[];
  jwt: {
    secret: string;
    expiresIn: string;
  };
  spotify: {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
  };
}

export const config: Config = {
  port: process.env.PORT ? parseInt(process.env.PORT, 10) : 3002,
  corsOrigins: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : '*',
  jwt: {
    secret: process.env.JWT_SECRET || 'default_secret_change_in_production',
    expiresIn: '7d'
  },
  spotify: {
    clientId: process.env.SPOTIFY_CLIENT_ID || '',
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET || '',
    redirectUri: process.env.SPOTIFY_REDIRECT_URI || 'http://localhost:3002/auth/spotify/callback'
  }
};

// Validate required environment variables
const requiredEnvVars = [
  'DATABASE_URL',
  'SPOTIFY_CLIENT_ID',
  'SPOTIFY_CLIENT_SECRET',
  'SPOTIFY_REDIRECT_URI',
  'JWT_SECRET',
];

requiredEnvVars.forEach((envVar) => {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
});
