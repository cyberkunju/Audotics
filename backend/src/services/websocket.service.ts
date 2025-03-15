import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { Server } from 'socket.io';
import { GroupSession, Playlist, User, Track, TrackFeatures } from '@prisma/client';
import { WebSocketError, WebSocketErrorCode } from '../filters/websocket-exception.filter';

interface PlaylistUpdate {
  id: string;
  playlistId: string;
  type: string;
  trackId: string;
  userId: string;
  timestamp: Date;
}

interface SessionUpdatePayload {
  type: 'user_joined' | 'user_left' | 'session_ended' | 'playlist_updated';
  sessionId: string;
  data: any;
}

interface PlaylistUpdatePayload {
  type: 'add' | 'remove' | 'reorder';
  playlistId: string;
  trackIds: string[];
  userId: string;
}

interface PlaylistWithDetails {
  id: string;
  name: string;
  tracks: TrackWithFeatures[];
  creatorId: string;
  sessionId: string | null;
}

interface TrackWithFeatures extends Track {
  audioFeatures: TrackFeatures | null;
}

@Injectable()
export class WebSocketService implements OnModuleInit {
  private readonly logger = new Logger(WebSocketService.name);
  private connectedSockets = new Map<string, any>();
  private userSessions: Map<string, Set<string>> = new Map(); // userId -> Set of sessionIds
  private readonly MAX_RECONNECT_ATTEMPTS = 5;
  private readonly RECONNECT_INTERVAL = 2000; // 2 seconds
  
  private static instance: WebSocketService;
  
  constructor(private readonly server: Server) {
    if (WebSocketService.instance) {
      return WebSocketService.instance;
    }
    WebSocketService.instance = this;
  }
  
  public static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      throw new Error('WebSocketService not initialized');
    }
    return WebSocketService.instance;
  }

  onModuleInit() {
    this.logger.log('WebSocket service initialized');
    
    this.server.on('connection', (socket) => {
      this.logger.log(`Client connected: ${socket.id}`);
      
      socket.on('disconnect', () => {
        this.logger.log(`Client disconnected: ${socket.id}`);
        // Remove socket from connected sockets
        for (const [userId, connectedSocket] of this.connectedSockets.entries()) {
          if (connectedSocket.id === socket.id) {
            this.connectedSockets.delete(userId);
            break;
          }
        }
      });
    });
  }

  broadcastToSession(sessionId: string, event: any) {
    try {
      this.server.to(`session:${sessionId}`).emit('session_event', event);
      this.logger.debug(`Broadcast to session ${sessionId}: ${event.type}`);
    } catch (error) {
      this.logger.error(`Error broadcasting to session ${sessionId}:`, error);
    }
  }

  notifyUserJoined(session: GroupSession, user: User) {
    this.broadcastToSession(session.id, {
      type: 'user_joined',
      data: { sessionId: session.id, user }
    });
  }

  notifyUserLeft(session: GroupSession, user: User) {
    this.broadcastToSession(session.id, {
      type: 'user_left',
      data: { sessionId: session.id, user }
    });
  }

  notifySessionEnded(session: GroupSession) {
    this.broadcastToSession(session.id, {
      type: 'session_ended',
      data: { sessionId: session.id }
    });
  }

  notifyPlaylistUpdated(session: GroupSession, playlist: PlaylistWithDetails) {
    const payload: SessionUpdatePayload = {
      type: 'playlist_updated',
      sessionId: session.id,
      data: playlist,
    };
    this.broadcastToSession(session.id, payload);
  }

  broadcastSessionCreated(session: GroupSession) {
    this.server.emit('session_created', { session });
  }

  notifySessionJoined(sessionId: string, userId: string) {
    this.broadcastToSession(sessionId, {
      type: 'user_joined',
      data: { sessionId, userId }
    });
  }

  notifySessionLeft(sessionId: string, userId: string) {
    this.broadcastToSession(sessionId, {
      type: 'user_left',
      data: { sessionId, userId }
    });
  }

  notifySessionDeleted(sessionId: string) {
    this.broadcastToSession(sessionId, {
      type: 'session_deleted',
      data: { sessionId }
    });
  }
}