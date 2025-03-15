import { Socket } from 'socket.io-client';
import io from 'socket.io-client';
import { EventEmitter } from 'events';
import authService from './auth.service';

// Event Types
export enum WebSocketEventType {
  SESSION_UPDATE = 'SESSION_UPDATE',
  PLAYLIST_UPDATE = 'PLAYLIST_UPDATE',
  USER_JOIN = 'USER_JOIN',
  USER_LEAVE = 'USER_LEAVE',
  RECOMMENDATION_ADDED = 'RECOMMENDATION_ADDED',
  ERROR = 'ERROR'
}

// Message Interfaces
export interface WebSocketMessage {
  type: string;
  payload: any;
}

export interface WebSocketEvent {
  sessionId: string;
  [key: string]: any;
}

export interface Track {
  id: string;
  title: string;
  artist: string;
  albumArt?: string;
  duration: number;
  addedBy: {
    id: string;
    name: string;
  };
}

export interface SessionData {
  id: string;
  name: string;
  participants: Array<{
    id: string;
    name: string;
    avatar?: string;
  }>;
  playlist: Track[];
  recommendations: Track[];
}

export class WebSocketService {
  private socket: ReturnType<typeof io> | null = null;
  private eventEmitter: EventEmitter;
  private reconnectAttempts: number = 0;
  private readonly MAX_RECONNECT_ATTEMPTS = 5;
  private readonly RECONNECT_INTERVAL = 2000;
  private sessionId: string | null = null;

  constructor() {
    this.eventEmitter = new EventEmitter();
  }

  public connect(sessionId: string): void {
    console.log('Attempting to connect to WebSocket server...');
    this.sessionId = sessionId;

    if (this.socket?.connected) {
      this.socket.disconnect();
    }

    if (!authService.isAuthenticated()) {
      console.error('Not authenticated');
      this.dispatchEvent(WebSocketEventType.ERROR, {
        message: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
      return;
    }

    const socket = io('http://localhost:3001', {
      reconnection: true,
      auth: {
        token: authService.getAuthState()?.accessToken
      },
      transports: ['websocket']
    } as const);

    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Connected to WebSocket server');
      this.reconnectAttempts = 0;
      
      if (!authService.isAuthenticated()) {
        console.error('Not authenticated during connection');
        this.dispatchEvent(WebSocketEventType.ERROR, {
          message: 'Authentication required',
          code: 'AUTH_REQUIRED'
        });
        this.socket?.disconnect();
        return;
      }

      const userId = authService.getUserId();
      if (!userId) {
        console.error('No user ID available');
        this.dispatchEvent(WebSocketEventType.ERROR, {
          message: 'Authentication required',
          code: 'AUTH_REQUIRED'
        });
        this.socket?.disconnect();
        return;
      }

      this.socket?.emit('identify', { 
        sessionId: this.sessionId,
        userId: userId
      });
    });

    this.socket.on('connect_error', (error: Error) => {
      console.error('Connection error:', error);
      if (error.message.includes('Authentication failed')) {
        this.dispatchEvent(WebSocketEventType.ERROR, {
          message: 'Authentication required',
          error,
          code: 'AUTH_REQUIRED'
        });
        return;
      }
      
      if (this.reconnectAttempts >= this.MAX_RECONNECT_ATTEMPTS) {
        this.dispatchEvent(WebSocketEventType.ERROR, {
          message: 'Failed to connect to server',
          error,
          code: 'CONNECTION_FAILED'
        });
      }
    });

    this.socket.on('identified', () => {
      console.log('Successfully identified');
      const userId = authService.getUserId();
      
      if (!userId) {
        console.error('No user ID available');
        this.dispatchEvent(WebSocketEventType.ERROR, {
          message: 'Authentication required',
          sessionId: this.sessionId,
          code: 'AUTH_REQUIRED'
        });
        return;
      }

      console.log('Joining session with user ID:', userId);
      this.socket?.emit('join_session', {
        sessionId: this.sessionId,
        userId: userId
      });
    });

    this.socket.on('session_joined', (data: WebSocketEvent) => {
      console.log('Successfully joined session:', data);
      this.dispatchEvent(WebSocketEventType.USER_JOIN, {
        ...data,
        sessionId: this.sessionId
      });
    });

    this.socket.on('session_left', (data: WebSocketEvent) => {
      console.log('Successfully left session:', data);
      this.dispatchEvent(WebSocketEventType.USER_LEAVE, {
        ...data,
        sessionId: this.sessionId
      });
    });

    this.socket.on('session_update', (data: WebSocketEvent) => {
      console.log('Received session update:', data);
      this.dispatchEvent(WebSocketEventType.SESSION_UPDATE, {
        session: data,
        sessionId: this.sessionId
      });
    });

    this.socket.on('disconnect', (reason: string) => {
      console.log('Disconnected from WebSocket server:', reason);
      this.dispatchEvent(WebSocketEventType.USER_LEAVE, {
        sessionId: this.sessionId,
        reason
      });
    });

    this.socket.on('error', (error: Error) => {
      console.error('WebSocket error:', error);
      this.dispatchEvent(WebSocketEventType.ERROR, {
        message: error.message || 'Unknown error',
        sessionId: this.sessionId,
        error
      });
    });
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.sessionId = null;
    }
  }

  public isConnected(): boolean {
    return this.socket?.connected || false;
  }

  public sendMessage(type: string, payload: any): boolean {
    if (!this.socket?.connected) {
      console.error('Cannot send message, socket not connected');
      return false;
    }

    try {
      this.socket.emit(type, payload);
      return true;
    } catch (error) {
      console.error('Send error:', error);
      return false;
    }
  }

  public addEventListener(type: WebSocketEventType, callback: (...args: any[]) => void, options?: { once?: boolean }): void {
    if (options?.once) {
      this.eventEmitter.once(type, callback);
    } else {
      this.eventEmitter.on(type, callback);
    }
  }

  public removeEventListener(type: WebSocketEventType, callback: (...args: any[]) => void): void {
    this.eventEmitter.off(type, callback);
  }

  private dispatchEvent(type: WebSocketEventType, data: any): void {
    this.eventEmitter.emit(type, data);
  }

  public addTrack(track: Track): boolean {
    return this.sendMessage('add_track', {
      sessionId: this.sessionId,
      track
    });
  }

  public removeTrack(trackId: string): boolean {
    return this.sendMessage('remove_track', {
      sessionId: this.sessionId,
      trackId
    });
  }

  public leaveSession(): boolean {
    if (!this.sessionId) {
      console.error('No active session to leave');
      return false;
    }

    const userId = authService.getUserId();
    if (!userId) {
      console.error('No user ID available');
      return false;
    }

    return this.sendMessage('leave_session', {
      sessionId: this.sessionId,
      userId
    });
  }
}

export default new WebSocketService();