import { Injectable } from '@nestjs/common';
import { Track, TrackFeatures, User, UserPreference, GroupSession, Playlist } from '@prisma/client';
import { DatabaseService, PlaylistWithTracks as DbPlaylistWithTracks } from './database.service';
import { MLDataService } from '../aiml/services/ml-data.service';
import { WebSocketService } from './websocket.service';
import { CacheService } from './cache.service';

interface TrackWithFeatures extends Track {
  audioFeatures: TrackFeatures | null;
}

interface GroupSessionWithDetails extends GroupSession {
  users: User[];
  playlist: {
    id: string;
    tracks: Track[];
  } | null;
}

interface PlaylistUpdateEvent {
  type: 'add' | 'remove' | 'reorder';
  trackId: string;
  userId: string;
  timestamp: Date;
}

interface PlaylistWithDetails {
  id: string;
  name: string;
  tracks: TrackWithFeatures[];
  creatorId: string;
  sessionId: string | null;
}

interface PlaylistUpdate {
  id: string;
  playlistId: string;
  type: 'add' | 'remove' | 'reorder';
  trackId: string;
  userId: string;
  timestamp: Date;
}

interface GroupPlaylistWithTracks extends Playlist {
  tracks: Track[];
}

@Injectable()
export class GroupService {
  private readonly SESSION_CACHE_PREFIX = 'group_session:';
  private readonly USER_SESSIONS_PREFIX = 'user_sessions:';
  private readonly RECOMMENDATIONS_PREFIX = 'group_recommendations:';
  private readonly PLAYLIST_PREFIX = 'group_playlist:';
  private readonly CACHE_TTL = 300; // 5 minutes

  private static instance: GroupService;

  constructor(
    private readonly db: DatabaseService,
    private readonly mlDataService: MLDataService,
    private readonly wsService: WebSocketService,
    private readonly cacheService: CacheService
  ) {
    if (GroupService.instance) {
      return GroupService.instance;
    }
    GroupService.instance = this;
  }

  public static getInstance(): GroupService {
    if (!GroupService.instance) {
      throw new Error('GroupService not initialized');
    }
    return GroupService.instance;
  }

  /**
   * Create a new group session
   */
  public async createSession(
    name: string,
    creatorId: string,
    initialUsers: string[] = []
  ): Promise<GroupSessionWithDetails> {
    try {
      const creator = await this.db.user.findUnique({
        where: { id: creatorId }
      });

      if (!creator) {
        throw new Error('Creator not found');
      }

      const session = await this.db.groupSession.create({
        data: {
          name,
          active: true,
          users: {
            connect: [
              { id: creatorId },
              ...initialUsers.map(id => ({ id }))
            ]
          },
          playlist: {
            create: {
              name: `${name}'s Playlist`,
              creatorId
            }
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

      // Create initial playlist
      const playlist = await this.db.playlist.create({
        data: {
          name: `${name}'s Playlist`,
          creatorId,
          sessionId: session.id,
          tracks: {
            connect: []
          }
        }
      });

      // Notify about session creation
      this.wsService.notifyUserJoined(session, creator);

      // Invalidate user sessions cache for all users
      await Promise.all(
        [creatorId, ...initialUsers].map(userId =>
          this.cacheService.del(`${this.USER_SESSIONS_PREFIX}${userId}`)
        )
      );

      return session;
    } catch (error) {
      console.error('Error creating group session:', error);
      throw new Error('Failed to create group session');
    }
  }

  /**
   * Add a user to an existing session
   */
  public async addUserToSession(
    sessionId: string,
    userId: string
  ): Promise<GroupSessionWithDetails> {
    try {
      const [session, user] = await Promise.all([
        this.db.groupSession.findUnique({
          where: { id: sessionId }
        }),
        this.db.user.findUnique({
          where: { id: userId }
        })
      ]);

      if (!session) {
        throw new Error('Session not found');
      }

      if (!session.active) {
        throw new Error('Session is no longer active');
      }

      if (!user) {
        throw new Error('User not found');
      }

      const updatedSession = await this.db.groupSession.update({
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

      // Notify about user joining
      this.wsService.notifyUserJoined(updatedSession, user);

      return updatedSession;
    } catch (error) {
      console.error('Error adding user to session:', error);
      throw new Error('Failed to add user to session');
    }
  }

  /**
   * Remove a user from a session
   */
  public async removeUserFromSession(
    sessionId: string,
    userId: string
  ): Promise<GroupSessionWithDetails> {
    try {
      const [session, user] = await Promise.all([
        this.db.groupSession.findUnique({
          where: { id: sessionId },
          include: { users: true }
        }),
        this.db.user.findUnique({
          where: { id: userId }
        })
      ]);

      if (!session) {
        throw new Error('Session not found');
      }

      if (!session.active) {
        throw new Error('Session is no longer active');
      }

      if (!user) {
        throw new Error('User not found');
      }

      if (!session.users.some(u => u.id === userId)) {
        throw new Error('User is not in this session');
      }

      const updatedSession = await this.db.groupSession.update({
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

      // Notify about user leaving
      this.wsService.notifyUserLeft(session, user);

      return updatedSession;
    } catch (error) {
      console.error('Error removing user from session:', error);
      throw new Error('Failed to remove user from session');
    }
  }

  /**
   * Get session details
   */
  public async getSessionDetails(sessionId: string): Promise<GroupSessionWithDetails> {
    const cacheKey = `${this.SESSION_CACHE_PREFIX}${sessionId}`;
    
    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const session = await this.db.groupSession.findUnique({
          where: { id: sessionId },
          include: {
            users: true,
            playlist: {
              include: {
                tracks: {
                  include: {
                    audioFeatures: true
                  }
                }
              }
            }
          }
        });

        if (!session) {
          throw new Error('Session not found');
        }

        return session;
      },
      this.CACHE_TTL
    ) as Promise<GroupSessionWithDetails>;
  }

  /**
   * Update session status
   */
  public async updateSessionStatus(
    sessionId: string,
    active: boolean
  ): Promise<GroupSessionWithDetails> {
    try {
      const session = await this.db.groupSession.update({
        where: { id: sessionId },
        data: { active },
        include: {
          users: true,
          playlist: {
            include: {
              tracks: true
            }
          }
        }
      });

      if (!active) {
        // Notify about session ending
        this.wsService.notifySessionEnded(session);
      }

      return session;
    } catch (error) {
      console.error('Error updating session status:', error);
      throw new Error('Failed to update session status');
    }
  }

  /**
   * List all active sessions for a user
   */
  public async getUserSessions(userId: string): Promise<GroupSessionWithDetails[]> {
    const cacheKey = `${this.USER_SESSIONS_PREFIX}${userId}`;
    
    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const sessions = await this.db.groupSession.findMany({
          where: {
            users: {
              some: {
                id: userId
              }
            },
            active: true
          },
          include: {
            users: true,
            playlist: {
              include: {
                tracks: {
                  include: {
                    audioFeatures: true
                  }
                }
              }
            }
          },
          orderBy: {
            updatedAt: 'desc'
          }
        });

        return sessions;
      },
      this.CACHE_TTL
    ) as Promise<GroupSessionWithDetails[]>;
  }

  public async getSessionRecommendations(
    sessionId: string,
    limit: number = 20
  ): Promise<TrackWithFeatures[]> {
    const cacheKey = `${this.RECOMMENDATIONS_PREFIX}${sessionId}:${limit}`;
    
    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const session = await this.getSessionDetails(sessionId);
        if (!session.active) {
          throw new Error('Session is not active');
        }

        // Get preferences for all users in the session
        const userPreferences = await Promise.all(
          session.users.map(user =>
            this.db.userPreference.findUnique({
              where: { userId: user.id }
            })
          )
        );

        // Filter out null preferences
        const validPreferences = userPreferences.filter(pref => pref !== null) as any[];
        
        if (validPreferences.length === 0) {
          throw new Error('No valid user preferences found');
        }

        // Aggregate preferences
        const groupPreferences = this.aggregatePreferences(validPreferences);

        // Get tracks with features
        const tracks = await this.db.track.findMany({
          where: {
            audioFeatures: {
              isNot: null
            }
          },
          include: {
            audioFeatures: true
          },
          take: limit * 2 // Get more tracks for better filtering
        });

        // Score and sort tracks
        const scoredTracks = tracks
          .map(track => {
            let score = 0;
            
            // Calculate feature similarity if both track and group have features
            if (track.audioFeatures && groupPreferences.features) {
              score += this.calculateFeatureSimilarity(
                track.audioFeatures,
                groupPreferences.features
              ) * 0.7; // Feature similarity weight
            }

            // Calculate artist match
            const artistMatch = track.artists.some(artist =>
              groupPreferences.artists.includes(artist)
            );
            score += (artistMatch ? 1 : 0) * 0.3; // Artist match weight

            return {
              track,
              score
            };
          })
          .sort((a, b) => b.score - a.score)
          .slice(0, limit)
          .map(({ track }) => track);

        return scoredTracks;
      },
      60 // Cache for 1 minute only since recommendations should be fresh
    ) as Promise<TrackWithFeatures[]>;
  }

  private calculateFeatureSimilarity(
    trackFeatures: TrackFeatures,
    userFeatures: TrackFeatures
  ): number {
    // Calculate cosine similarity between track features and user preferences
    const features = [
      'danceability',
      'energy',
      'key',
      'loudness',
      'mode',
      'speechiness',
      'acousticness',
      'instrumentalness',
      'liveness',
      'valence',
      'tempo'
    ] as const;

    const trackVector = features.map(f => trackFeatures[f]);
    const userVector = features.map(f => userFeatures[f]);

    return this.cosineSimilarity(trackVector, userVector);
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
    const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
    return dotProduct / (magnitudeA * magnitudeB);
  }

  private aggregatePreferences(preferences: Pick<UserPreference, 'genres' | 'topArtists' | 'features'>[]): {
    genres: string[];
    artists: string[];
    features: TrackFeatures | null;
  } {
    // Combine all user preferences
    const combined = preferences.reduce(
      (acc, pref) => {
        // Combine genres
        acc.genres.push(...(pref.genres || []));

        // Combine artists
        acc.artists.push(...(pref.topArtists || []));

        // Combine features
        if (pref.features && typeof pref.features === 'object') {
          Object.entries(pref.features as Record<string, number>).forEach(([key, value]) => {
            if (!acc.features[key]) {
              acc.features[key] = 0;
            }
            acc.features[key] += value;
          });
        }

        return acc;
      },
      { genres: [] as string[], artists: [] as string[], features: {} as Record<string, number> }
    );

    // Average out the features
    Object.keys(combined.features).forEach(key => {
      combined.features[key] /= preferences.length;
    });

    // Get unique genres and artists
    return {
      genres: [...new Set(combined.genres)],
      artists: [...new Set(combined.artists)],
      features: combined.features as unknown as TrackFeatures
    };
  }

  /**
   * Add tracks to session playlist
   */
  public async addTracksToPlaylist(
    sessionId: string,
    trackIds: string[],
    userId: string
  ): Promise<PlaylistWithDetails> {
    try {
      const session = await this.db.groupSession.findUnique({
        where: { id: sessionId },
        include: {
          playlist: true,
          users: true
        }
      });

      if (!session) {
        throw new Error('Session not found');
      }

      if (!session.active) {
        throw new Error('Session is no longer active');
      }

      if (!session.users.some(u => u.id === userId)) {
        throw new Error('User is not in this session');
      }

      if (!session.playlist) {
        throw new Error('Session playlist not found');
      }

      // Add tracks to playlist
      const updatedPlaylist = await this.db.playlist.update({
        where: { id: session.playlist.id },
        data: {
          tracks: {
            connect: trackIds.map(id => ({ id }))
          }
        },
        include: {
          tracks: {
            include: {
              audioFeatures: true
            }
          }
        }
      });

      // Notify about playlist update
      this.wsService.notifyPlaylistUpdated(session, updatedPlaylist);

      return updatedPlaylist;
    } catch (error) {
      console.error('Error adding tracks to playlist:', error);
      throw new Error('Failed to add tracks to playlist');
    }
  }

  /**
   * Remove tracks from session playlist
   */
  public async removeTracksFromPlaylist(
    sessionId: string,
    trackIds: string[],
    userId: string
  ): Promise<PlaylistWithDetails> {
    try {
      const session = await this.db.groupSession.findUnique({
        where: { id: sessionId },
        include: {
          playlist: true,
          users: true
        }
      });

      if (!session) {
        throw new Error('Session not found');
      }

      if (!session.active) {
        throw new Error('Session is no longer active');
      }

      if (!session.users.some(u => u.id === userId)) {
        throw new Error('User is not in this session');
      }

      if (!session.playlist) {
        throw new Error('Session playlist not found');
      }

      // Remove tracks from playlist
      const updatedPlaylist = await this.db.playlist.update({
        where: { id: session.playlist.id },
        data: {
          tracks: {
            disconnect: trackIds.map(id => ({ id }))
          }
        },
        include: {
          tracks: {
            include: {
              audioFeatures: true
            }
          }
        }
      });

      // Notify about playlist update
      this.wsService.notifyPlaylistUpdated(session, updatedPlaylist);

      return updatedPlaylist;
    } catch (error) {
      console.error('Error removing tracks from playlist:', error);
      throw new Error('Failed to remove tracks from playlist');
    }
  }

  /**
   * Reorder tracks in session playlist
   */
  public async reorderPlaylistTracks(
    sessionId: string,
    trackIds: string[],
    userId: string
  ): Promise<PlaylistWithDetails> {
    try {
      const session = await this.db.groupSession.findUnique({
        where: { id: sessionId },
        include: {
          playlist: true,
          users: true
        }
      });

      if (!session) {
        throw new Error('Session not found');
      }

      if (!session.active) {
        throw new Error('Session is no longer active');
      }

      if (!session.users.some(u => u.id === userId)) {
        throw new Error('User is not in this session');
      }

      if (!session.playlist) {
        throw new Error('Session playlist not found');
      }

      // Update playlist with new track order
      const updatedPlaylist = await this.db.playlist.update({
        where: { id: session.playlist.id },
        data: {
          tracks: {
            set: trackIds.map(id => ({ id }))
          }
        },
        include: {
          tracks: {
            include: {
              audioFeatures: true
            }
          }
        }
      });

      // Notify about playlist update
      this.wsService.notifyPlaylistUpdated(session, updatedPlaylist);

      return updatedPlaylist;
    } catch (error) {
      console.error('Error reordering playlist tracks:', error);
      throw new Error('Failed to reorder playlist tracks');
    }
  }

  /**
   * Get playlist update history
   */
  public async getPlaylistHistory(
    sessionId: string,
    limit: number = 50
  ): Promise<PlaylistUpdateEvent[]> {
    try {
      const session = await this.db.groupSession.findUnique({
        where: { id: sessionId },
        include: { playlist: true }
      });

      if (!session?.playlist) {
        throw new Error('Session or playlist not found');
      }

      return await this.db.$queryRaw<PlaylistUpdateEvent[]>`
        SELECT type, "trackId", "userId", timestamp
        FROM "PlaylistUpdate"
        WHERE "playlistId" = ${session.playlist.id}
        ORDER BY timestamp DESC
        LIMIT ${limit}
      `;
    } catch (error) {
      console.error('Error getting playlist history:', error);
      throw new Error('Failed to get playlist history');
    }
  }

  /**
   * Log playlist update event
   */
  private async logPlaylistUpdate(
    playlistId: string,
    event: PlaylistUpdateEvent
  ): Promise<PlaylistUpdate> {
    try {
      await this.db.$executeRaw`
        INSERT INTO "PlaylistUpdate" ("playlistId", "type", "trackId", "userId", "timestamp")
        VALUES (${playlistId}, ${event.type}, ${event.trackId}, ${event.userId}, ${event.timestamp})
      `;
      
      // Create and return a PlaylistUpdate object that matches the structure expected by other methods
      const update: PlaylistUpdate = {
        id: Math.random().toString(36).substring(2, 15), // generate a random ID since we can't get the actual one from the raw query
        playlistId: playlistId,
        type: event.type,
        trackId: event.trackId,
        userId: event.userId,
        timestamp: event.timestamp
      };
      
      return update;
    } catch (error) {
      console.error('Error logging playlist update:', error);
      // Return a default PlaylistUpdate object since we don't want to throw an error
      return {
        id: Math.random().toString(36).substring(2, 15),
        playlistId: playlistId,
        type: event.type,
        trackId: event.trackId,
        userId: event.userId,
        timestamp: event.timestamp
      };
    }
  }

  /**
   * Merge playlists from multiple sessions
   */
  public async mergePlaylists(
    targetSessionId: string,
    sourceSessionIds: string[],
    userId: string
  ): Promise<PlaylistWithDetails> {
    try {
      // Get target session
      const targetSession = await this.db.groupSession.findUnique({
        where: { id: targetSessionId },
        include: {
          playlist: {
            include: {
              tracks: true
            }
          },
          users: true
        }
      });

      if (!targetSession) {
        throw new Error('Target session not found');
      }

      if (!targetSession.active) {
        throw new Error('Target session is no longer active');
      }

      if (!targetSession.users.some(u => u.id === userId)) {
        throw new Error('User is not in target session');
      }

      // Get source playlists
      const sourcePlaylists = await this.db.playlist.findMany({
        where: {
          sessionId: {
            in: sourceSessionIds
          }
        },
        include: {
          tracks: true
        }
      });

      // Collect all unique tracks
      const allTracks = new Set<string>();
      targetSession.playlist?.tracks.forEach(track => allTracks.add(track.id));
      sourcePlaylists.forEach(playlist => {
        playlist.tracks.forEach(track => allTracks.add(track.id));
      });

      // Update target playlist with merged tracks
      const updatedPlaylist = await this.db.playlist.update({
        where: { id: targetSession.playlist!.id },
        data: {
          tracks: {
            set: Array.from(allTracks).map(id => ({ id }))
          }
        },
        include: {
          tracks: {
            include: {
              audioFeatures: true
            }
          }
        }
      });

      // Log the merge event
      await this.logPlaylistUpdate(targetSession.playlist!.id, {
        type: 'add',
        trackId: 'MERGE:' + sourceSessionIds.join(','),
        userId,
        timestamp: new Date()
      });

      return updatedPlaylist;
    } catch (error) {
      console.error('Error merging playlists:', error);
      throw new Error('Failed to merge playlists');
    }
  }

  private async invalidateSessionCache(sessionId: string): Promise<void> {
    await Promise.all([
      this.cacheService.del(`${this.SESSION_CACHE_PREFIX}${sessionId}`),
      this.cacheService.del(`${this.RECOMMENDATIONS_PREFIX}${sessionId}:*`),
      this.cacheService.del(`${this.PLAYLIST_PREFIX}${sessionId}`)
    ]);

    // Invalidate user sessions cache for all users in the session
    const session = await this.db.groupSession.findUnique({
      where: { id: sessionId },
      include: { users: true }
    });

    if (session) {
      await Promise.all(
        session.users.map(user =>
          this.cacheService.del(`${this.USER_SESSIONS_PREFIX}${user.id}`)
        )
      );
    }
  }

  async updatePlaylist(session: GroupSession, playlist: GroupPlaylistWithTracks, trackIds: string[]) {
    try {
      const updatedPlaylist = await this.db.updateSessionPlaylist(session.id, trackIds);
      this.wsService.notifyPlaylistUpdated(session, { 
        id: playlist.id, 
        name: playlist.name || 'Group Playlist',
        tracks: updatedPlaylist.tracks.map(t => ({ ...t, audioFeatures: null })),
        creatorId: playlist.creatorId,
        sessionId: session.id
      });
      return updatedPlaylist;
    } catch (error) {
      throw error;
    }
  }

  async addTrackToPlaylist(session: GroupSession, playlist: GroupPlaylistWithTracks, trackId: string) {
    try {
      const updatedPlaylist = await this.db.updateSessionPlaylist(
        session.id,
        [...playlist.tracks.map(t => t.id), trackId]
      );
      this.wsService.notifyPlaylistUpdated(session, {
        id: playlist.id,
        name: playlist.name || 'Group Playlist',
        tracks: updatedPlaylist.tracks.map(t => ({ ...t, audioFeatures: null })),
        creatorId: playlist.creatorId,
        sessionId: session.id
      });
      return updatedPlaylist;
    } catch (error) {
      throw error;
    }
  }

  async removeTrackFromPlaylist(session: GroupSession, playlist: GroupPlaylistWithTracks, trackId: string) {
    try {
      const updatedPlaylist = await this.db.updateSessionPlaylist(
        session.id,
        playlist.tracks.map(t => t.id).filter(id => id !== trackId)
      );
      this.wsService.notifyPlaylistUpdated(session, {
        id: playlist.id,
        name: playlist.name || 'Group Playlist',
        tracks: updatedPlaylist.tracks.map(t => ({ ...t, audioFeatures: null })),
        creatorId: playlist.creatorId,
        sessionId: session.id
      });
      return updatedPlaylist;
    } catch (error) {
      throw error;
    }
  }
}