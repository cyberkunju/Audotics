import { Injectable } from '@nestjs/common';
import { DatabaseService } from './database.service';
import { WebSocketService } from './websocket.service';
import { GroupSession, User, Playlist } from '@prisma/client';
import { SpotifyService } from './spotify.service';

@Injectable()
export class GroupSessionService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly webSocketService: WebSocketService,
    private readonly spotifyService: SpotifyService,
  ) {}

  async createSession(userId: string, sessionData: {
    name: string;
    genre?: string;
    isPublic?: boolean;
  }) {
    try {
      const session = await this.databaseService.createGroupSession({
        name: sessionData.name,
        creatorId: userId,
        genre: sessionData.genre,
        isPublic: sessionData.isPublic ?? true,
      });

      // Add creator as participant
      await this.databaseService.addParticipantToSession(session.id, userId);

      // Notify the websocket about the new session
      this.webSocketService.broadcastSessionCreated(session);

      return session;
    } catch (error) {
      console.error('Error creating group session:', error);
      throw new Error('Failed to create group session');
    }
  }

  async joinSession(sessionId: string, userId: string) {
    try {
      // Check if session exists
      const session = await this.databaseService.findGroupSession(sessionId);
      if (!session) {
        throw new Error('Session not found');
      }

      // Add user to session
      await this.databaseService.addParticipantToSession(sessionId, userId);

      // Get updated session data
      const updatedSession = await this.databaseService.findGroupSession(sessionId);

      // Notify all participants about the join
      this.webSocketService.notifySessionJoined(sessionId, userId);

      return updatedSession;
    } catch (error) {
      console.error('Error joining session:', error);
      throw new Error('Failed to join session');
    }
  }

  async leaveSession(sessionId: string, userId: string) {
    try {
      const sessionWithUsers = await this.databaseService.findGroupSession(sessionId);

      if (!sessionWithUsers) {
        throw new Error('Session not found');
      }

      // User leaves the session
      const updatedSession = await this.databaseService.removeParticipantFromSession(sessionId, userId);

      // Type the updatedSession to include users
      const typedSession = updatedSession as unknown as {
        id: string;
        name: string;
        creatorId: string;
        active: boolean;
        createdAt: Date;
        updatedAt: Date;
        users: Array<{ id: string }>;
      };
      
      // Type the sessionWithUsers properly as well
      const typedSessionWithUsers = sessionWithUsers as unknown as {
        id: string;
        name: string;
        creatorId: string;
        active: boolean;
        createdAt: Date;
        updatedAt: Date;
        users: Array<{ id: string }>;
      };
      
      if (userId === typedSessionWithUsers.creatorId && typedSession.users && typedSession.users.length > 0) {
        // Transfer ownership to another participant
        // This would require additional database logic in a real implementation
      }

      // If no participants left, delete the session
      if (!typedSession.users || typedSession.users.length === 0) {
        await this.databaseService.deleteGroupSession(sessionId);
        this.webSocketService.broadcastToSession(sessionId, { type: 'session_closed', sessionId });
        return { message: 'Session deleted as no participants remain' };
      }

      // Notify the websocket about the user leaving
      this.webSocketService.broadcastToSession(sessionId, { type: 'user_left', sessionId, userId });

      return updatedSession;
    } catch (error) {
      console.error('Error leaving session:', error);
      throw new Error('Failed to leave session');
    }
  }

  async updatePlaylist(sessionId: string, userId: string, trackIds: string[]) {
    try {
      const session = await this.databaseService.findGroupSession(sessionId);

      if (!session) {
        throw new Error('Session not found');
      }

      // Check if user is a participant
      const typedSession = session as unknown as {
        id: string;
        name: string;
        creatorId: string;
        active: boolean;
        createdAt: Date;
        updatedAt: Date;
        users: Array<{ id: string }>;
      };
      
      const isParticipant = typedSession.users && typedSession.users.some((user: { id: string }) => user.id === userId);
      if (!isParticipant) {
        throw new Error('User is not a participant of this session');
      }

      // Update the playlist
      const updatedPlaylist = await this.databaseService.updateSessionPlaylist(sessionId, trackIds);

      // Notify the websocket about the playlist update
      this.webSocketService.broadcastToSession(sessionId, { 
        type: 'playlist_updated', 
        sessionId, 
        playlist: updatedPlaylist 
      });

      return updatedPlaylist;
    } catch (error) {
      console.error('Error updating playlist:', error);
      throw new Error('Failed to update playlist');
    }
  }

  async getRecommendations(sessionId: string, userId: string) {
    try {
      const session = await this.databaseService.findGroupSession(sessionId);

      if (!session) {
        throw new Error('Session not found');
      }

      // Check if user is a participant
      const typedSession = session as unknown as {
        id: string;
        name: string;
        creatorId: string;
        active: boolean;
        createdAt: Date;
        updatedAt: Date;
        users: Array<{ id: string }>;
        genre?: string;
      };
      
      const isParticipant = typedSession.users && typedSession.users.some((user: { id: string }) => user.id === userId);
      if (!isParticipant) {
        throw new Error('User is not a participant of this session');
      }

      // Get all participants' preferences to generate recommendations
      const participants = typedSession.users || [];
      
      // Collect preferences from each participant
      const preferences = await Promise.all(
        participants.map(async (participant: { id: string }) => {
          try {
            // Get user preferences from the database
            const userPreferences = await this.databaseService.userPreference.findUnique({
              where: { userId: participant.id }
            });
            return userPreferences || {};
          } catch (error) {
            console.error(`Error getting preferences for user ${participant.id}:`, error);
            return {};
          }
        })
      );

      // Combine preferences (simplified for demo)
      const combinedPreferences: any = {
        seed_artists: '2CIMQHirSU0MQqyYHq0eOx',
        seed_tracks: '57JVGBtBLCfHw2muk5416J',
        seed_genres: ['pop', 'rock']
      };

      // Use combined preferences to get recommendations from Spotify
      if (typedSession.genre) {
        combinedPreferences.seed_genres = [typedSession.genre];
      }

      // For demo, we'll return some placeholder data
      // In a real implementation, you would call Spotify's recommendation API
      return {
        tracks: [],
        seeds: combinedPreferences
      };
    } catch (error) {
      console.error('Error getting recommendations:', error);
      throw new Error('Failed to get recommendations');
    }
  }

  private combinePreferences(preferences: any[]) {
    // This is a simplified version - in a real app you would implement
    // a more sophisticated algorithm to combine preferences
    const seedArtists = new Set<string>();
    const seedTracks = new Set<string>();
    let genre = '';

    preferences.forEach(pref => {
      // Add top artists (limit to 1 per user to avoid exceeding Spotify's limit)
      if (pref.topArtists && pref.topArtists.length > 0) {
        seedArtists.add(pref.topArtists[0].id);
      }
      
      // Add top tracks (limit to 1 per user)
      if (pref.topTracks && pref.topTracks.length > 0) {
        seedTracks.add(pref.topTracks[0].id);
      }
      
      // Use the session genre if available
      if (pref.genre) {
        genre = pref.genre;
      }
    });

    // Spotify allows max 5 seed entities in total
    const seedArtistsArray = Array.from(seedArtists).slice(0, 2);
    const seedTracksArray = Array.from(seedTracks).slice(0, 3);

    return {
      seed_artists: seedArtistsArray.join(','),
      seed_tracks: seedTracksArray.join(','),
      seed_genres: genre ? [genre] : [],
      limit: 20
    };
  }
}

