import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient, Prisma, User, GroupSession, UserPreference, Playlist, Track } from '@prisma/client';
import { config } from '../config';

// Enhanced error types
enum DatabaseErrorCode {
  UNIQUE_CONSTRAINT = 'P2002',
  FOREIGN_KEY = 'P2003',
  NOT_FOUND = 'P2025',
  CONNECTION_FAILED = 'P2024',
  TIMEOUT = 'P2024',
  VALIDATION_ERROR = 'VALIDATION_ERROR'
}

function toError(maybeError: unknown): Error {
  if (maybeError instanceof Error) return maybeError;

  try {
    return new Error(
      typeof maybeError === 'string' ? maybeError : JSON.stringify(maybeError)
    );
  } catch {
    // fallback in case there's an error stringifying the maybeError
    return new Error(String(maybeError));
  }
}

function isPrismaErrorCode(code: string): code is DatabaseErrorCode {
  return Object.values(DatabaseErrorCode).includes(code as DatabaseErrorCode);
}

function getErrorCode(error: unknown): DatabaseErrorCode | undefined {
  if (error instanceof Prisma.PrismaClientKnownRequestError && typeof error.code === 'string') {
    const code = error.code;
    return isPrismaErrorCode(code) ? code : undefined;
  }
  if (error instanceof Prisma.PrismaClientValidationError) {
    return DatabaseErrorCode.VALIDATION_ERROR;
  }
  if (error instanceof Error && error.name === 'PrismaClientInitializationError') {
    return DatabaseErrorCode.CONNECTION_FAILED;
  }
  return undefined;
}

function getErrorMessage(code: DatabaseErrorCode | undefined, defaultMessage: string): string {
  if (!code) return defaultMessage;

  switch (code) {
    case DatabaseErrorCode.UNIQUE_CONSTRAINT:
      return 'A record with this value already exists';
    case DatabaseErrorCode.FOREIGN_KEY:
      return 'Referenced record does not exist';
    case DatabaseErrorCode.NOT_FOUND:
      return 'Record not found';
    case DatabaseErrorCode.TIMEOUT:
      return 'Database operation timed out';
    case DatabaseErrorCode.VALIDATION_ERROR:
      return 'Validation error occurred';
    case DatabaseErrorCode.CONNECTION_FAILED:
      return 'Failed to connect to database';
    default:
      const _exhaustiveCheck: never = code;
      return defaultMessage;
  }
}

type SessionParticipantRole = 'CREATOR' | 'MEMBER';

interface CreateUserInput {
  name: string;
  email: string;
  spotifyId: string;
  spotifyAccessToken?: string;
  spotifyRefreshToken?: string;
}

interface UpdateUserPreferencesInput {
  genres?: string[];
  artists?: string[];
  tracks?: string[];
  audioFeatures?: Record<string, number>;
}

interface CreateGroupSessionInput {
  name: string;
  creatorId: string;
  genre?: string;
  isPublic?: boolean;
}

interface QueryEvent {
  timestamp: Date;
  query: string;
  params: string;
  duration: number;
  target: string;
}

export interface PlaylistWithTracks extends Playlist {
  tracks: Track[];
}

class DatabaseError extends Error {
  constructor(
    message: string, 
    public readonly code?: DatabaseErrorCode,
    public readonly cause?: Error,
    public readonly metadata?: Record<string, any>
  ) {
    super(message);
    this.name = 'DatabaseError';
  }

  static fromUnknown(error: unknown, defaultMessage: string): DatabaseError {
    const errorCode = getErrorCode(error);
    const cause = toError(error);
    const metadata = error instanceof Prisma.PrismaClientKnownRequestError 
      ? { target: error.meta?.target }
      : undefined;

    const message = getErrorMessage(errorCode, defaultMessage);

    return new DatabaseError(
      message,
      errorCode,
      cause,
      metadata
    );
  }
}

@Injectable()
export class DatabaseService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DatabaseService.name);
  private isConnected = false;
  
  // Singleton instance for backward compatibility
  private static instance: DatabaseService;

  /**
   * Get or create singleton instance for backward compatibility
   * @deprecated Use dependency injection instead
   */
  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  constructor() {
    super({
      log: [
        { emit: 'event', level: 'query' },
        { emit: 'event', level: 'error' },
        { emit: 'stdout', level: 'info' },
        { emit: 'stdout', level: 'warn' },
      ],
    });

    // Set up event handlers in constructor
    if (process.env.NODE_ENV !== 'production') {
      (this as any).$on('query', (event: Prisma.QueryEvent) => {
        this.logger.debug(`Query: ${event.query}`);
        this.logger.debug(`Duration: ${event.duration}ms`);
      });

      (this as any).$on('error', (event: Prisma.LogEvent) => {
        this.logger.error('Database error:', event);
      });
    }
  }

  async onModuleInit() {
    try {
      await this.$connect();
      this.isConnected = true;
      this.logger.log('Database connection established');
    } catch (error) {
      this.logger.error('Failed to connect to database:', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    try {
      await this.$disconnect();
      this.isConnected = false;
      this.logger.log('Database connection closed');
    } catch (error) {
      this.logger.error('Error closing database connection:', error);
      throw error;
    }
  }

  // User Operations with enhanced error handling
  async findUserById(userId: string): Promise<User | null> {
    try {
      const user = await this.user.findUnique({
        where: { id: userId },
        include: {
          preferences: true
        }
      });

      if (!user) {
        this.logger.debug(`User not found with ID: ${userId}`);
        return null;
      }

      return user;
    } catch (error) {
      this.logger.error(`Error finding user by ID: ${userId}`, error);
      throw this.handlePrismaError(error, 'Failed to find user by ID');
    }
  }

  async findUserBySpotifyId(spotifyId: string): Promise<User | null> {
    try {
      const user = await this.user.findFirst({
        where: { spotifyId },
        include: {
          preferences: true
        }
      });

      if (!user) {
        this.logger.debug(`User not found with Spotify ID: ${spotifyId}`);
        return null;
      }

      return user;
    } catch (error) {
      this.logger.error(`Error finding user by Spotify ID: ${spotifyId}`, error);
      throw this.handlePrismaError(error, 'Failed to find user by Spotify ID');
    }
  }

  async createUser(userData: CreateUserInput): Promise<User> {
    try {
      return await this.$transaction(async (prisma) => {
        // Check for existing user
        const existingUser = await prisma.user.findFirst({
          where: {
            OR: [
              { email: userData.email },
              { spotifyId: userData.spotifyId }
            ]
          }
        });

        if (existingUser) {
          throw new DatabaseError(
            'User already exists',
            DatabaseErrorCode.UNIQUE_CONSTRAINT,
            new Error('Duplicate user'),
            { field: existingUser.email === userData.email ? 'email' : 'spotifyId' }
          );
        }

        const user = await prisma.user.create({
          data: {
            name: userData.name,
            email: userData.email,
            spotifyId: userData.spotifyId,
            spotifyAccessToken: userData.spotifyAccessToken,
            spotifyRefreshToken: userData.spotifyRefreshToken,
            preferences: {
              create: {
                genres: [],
                topArtists: [],
                topTracks: [],
                features: {},
                lastUpdated: new Date()
              }
            }
          },
          include: {
            preferences: true
          }
        });

        return user;
      });
    } catch (error) {
      this.logger.error('Error creating user:', error);
      throw this.handlePrismaError(error, 'Failed to create user');
    }
  }

  async updateUserTokens(userId: string, accessToken: string, refreshToken: string): Promise<User> {
    try {
      return await this.user.update({
        where: { id: userId },
        data: {
          spotifyAccessToken: accessToken,
          spotifyRefreshToken: refreshToken,
          updatedAt: new Date()
        }
      });
    } catch (error) {
      this.logger.error(`Error updating user tokens for user: ${userId}`, error);
      throw DatabaseError.fromUnknown(error, 'Failed to update user tokens');
    }
  }

  // User Preferences Operations
  async updateUserPreferences(userId: string, preferences: UpdateUserPreferencesInput): Promise<UserPreference> {
    try {
      const data = {
        genres: preferences.genres || [],
        topArtists: preferences.artists || [],
        topTracks: preferences.tracks || [],
        features: preferences.audioFeatures as Prisma.InputJsonValue,
        lastUpdated: new Date()
      };

      return await this.userPreference.upsert({
        where: { userId },
        update: data,
        create: {
          ...data,
          userId
        }
      });
    } catch (error) {
      this.logger.error(`Error updating preferences for user: ${userId}`, error);
      throw DatabaseError.fromUnknown(error, 'Failed to update user preferences');
    }
  }

  // Group Session Operations
  async createGroupSession(sessionData: CreateGroupSessionInput): Promise<GroupSession> {
    try {
      return await this.$transaction(async (prisma) => {
        // First check if user exists
        const user = await prisma.user.findUnique({
          where: { id: sessionData.creatorId }
        });

        if (!user) {
          throw new DatabaseError('Creator user not found', DatabaseErrorCode.NOT_FOUND);
        }

        const data: Prisma.GroupSessionCreateInput = {
          name: sessionData.name,
          users: {
            connect: [{ id: sessionData.creatorId }]
          },
          playlist: {
            create: {
              name: `${sessionData.name} Playlist`,
              creator: { connect: { id: sessionData.creatorId } }
            }
          }
        };

        return await prisma.groupSession.create({
          data,
          include: {
            users: true,
            playlist: {
              include: {
                tracks: true
              }
            }
          }
        });
      });
    } catch (error) {
      this.logger.error('Error creating group session:', error);
      throw DatabaseError.fromUnknown(error, 'Failed to create group session');
    }
  }

  async findGroupSession(sessionId: string): Promise<GroupSession | null> {
    try {
      return await this.groupSession.findUnique({
        where: { id: sessionId },
        include: {
          users: {
            include: {
              preferences: true
            }
          },
          playlist: {
            include: {
              tracks: true
            }
          }
        }
      });
    } catch (error) {
      this.logger.error(`Error finding group session: ${sessionId}`, error);
      throw DatabaseError.fromUnknown(error, 'Failed to find group session');
    }
  }

  async findPublicSessions(limit = 10): Promise<GroupSession[]> {
    try {
      return await this.groupSession.findMany({
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          users: true,
          playlist: {
            include: {
              tracks: true
            }
          }
        }
      });
    } catch (error) {
      this.logger.error('Error finding public sessions', error);
      throw DatabaseError.fromUnknown(error, 'Failed to find public sessions');
    }
  }

  async deleteGroupSession(sessionId: string): Promise<GroupSession> {
    try {
      return await this.$transaction(async (prisma) => {
        const session = await prisma.groupSession.findUnique({
          where: { id: sessionId },
          include: { playlist: true }
        });

        if (!session) {
          throw new DatabaseError('Session not found', DatabaseErrorCode.NOT_FOUND);
        }

        // Delete the session (cascade will handle related records)
        return await prisma.groupSession.delete({
          where: { id: sessionId },
          include: {
            playlist: true,
            users: true
          }
        });
      });
    } catch (error) {
      this.logger.error(`Error deleting group session: ${sessionId}`, error);
      throw DatabaseError.fromUnknown(error, 'Failed to delete group session');
    }
  }

  // Playlist Operations
  async updateSessionPlaylist(sessionId: string, trackIds: string[]): Promise<PlaylistWithTracks> {
    try {
      return await this.$transaction(async (prisma) => {
        const session = await prisma.groupSession.findUnique({
          where: { id: sessionId },
          include: { 
            playlist: {
              include: {
                tracks: true
              }
            },
            users: true
          }
        });

        if (!session) {
          throw new DatabaseError('Session not found', DatabaseErrorCode.NOT_FOUND);
        }

        if (!session.users || session.users.length === 0) {
          throw new DatabaseError('No users in session', DatabaseErrorCode.VALIDATION_ERROR);
        }

        if (!session.playlist) {
          // Create new playlist if it doesn't exist
          return await prisma.playlist.create({
            data: {
              name: `${session.name} Playlist`,
              creator: { connect: { id: session.users[0].id } },
              groupSession: { connect: { id: sessionId } },
              tracks: {
                connect: trackIds.map(id => ({ id }))
              }
            },
            include: {
              tracks: true
            }
          });
        }

        // Update existing playlist
        return await prisma.playlist.update({
          where: { id: session.playlist.id },
          data: {
            tracks: {
              set: trackIds.map(id => ({ id }))
            }
          },
          include: {
            tracks: true
          }
        });
      });
    } catch (error) {
      this.logger.error(`Error updating session playlist: ${sessionId}`, error);
      throw DatabaseError.fromUnknown(error, 'Failed to update session playlist');
    }
  }

  /**
   * Add a user as a participant to a group session
   */
  async addParticipantToSession(sessionId: string, userId: string): Promise<GroupSession> {
    try {
      return await this.groupSession.update({
        where: { id: sessionId },
        data: {
          users: {
            connect: { id: userId }
          }
        },
        include: {
          users: true,
          playlist: {
            include: {
              tracks: true
            }
          }
        }
      });
    } catch (error) {
      this.logger.error(`Error adding participant to session: ${sessionId}, user: ${userId}`, error);
      throw DatabaseError.fromUnknown(error, 'Failed to add participant to session');
    }
  }

  /**
   * Remove a user from a group session
   */
  async removeParticipantFromSession(sessionId: string, userId: string): Promise<GroupSession> {
    try {
      return await this.groupSession.update({
        where: { id: sessionId },
        data: {
          users: {
            disconnect: { id: userId }
          }
        },
        include: {
          users: true,
          playlist: {
            include: {
              tracks: true
            }
          }
        }
      });
    } catch (error) {
      this.logger.error(`Error removing participant from session: ${sessionId}, user: ${userId}`, error);
      throw DatabaseError.fromUnknown(error, 'Failed to remove participant from session');
    }
  }

  // Helper method to handle Prisma errors
  private handlePrismaError(error: unknown, defaultMessage: string): DatabaseError {
    return DatabaseError.fromUnknown(error, defaultMessage);
  }
}












