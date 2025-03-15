import { useState, useEffect, useRef, useCallback } from 'react';
import { useSpotifyAuth } from '@/lib/spotify-auth/context';

// Define message types
export interface WebSocketMessage {
  type: string;
  payload: any;
}

export interface SessionUpdateMessage extends WebSocketMessage {
  type: 'SESSION_UPDATE';
  payload: {
    sessionId: string;
    participants: {
      id: string;
      name: string;
      avatar?: string;
      isActive: boolean;
    }[];
  };
}

export interface PlaylistUpdateMessage extends WebSocketMessage {
  type: 'PLAYLIST_UPDATE';
  payload: {
    sessionId: string;
    tracks: {
      id: string;
      title: string;
      artist: string;
      album: string;
      duration: string;
      imageUrl: string;
    }[];
  };
}

export interface UserJoinLeaveMessage extends WebSocketMessage {
  type: 'USER_JOIN' | 'USER_LEAVE';
  payload: {
    sessionId: string;
    userId: string;
    userName: string;
  };
}

export interface User {
  id: string;
  name: string;
  avatar?: string;
}

export interface Track {
  id: string;
  title: string;
  artist: string;
  albumArt?: string;
  duration: number;
  addedBy: User;
}

// WebSocket Hook
export function useWebSocket() {
  const { auth } = useSpotifyAuth();
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const maxRetries = 3;

  // Initialize WebSocket connection
  const connect = useCallback(() => {
    // Only connect if user is authenticated
    if (!auth.user) {
      setError('User not authenticated');
      return;
    }

    try {
      const token = localStorage.getItem('auth_token');
      const wsUrl = `ws://example.com/socket?token=${token}`;
      
      console.log('[WebSocket] Connecting to:', wsUrl);
      const ws = new WebSocket(wsUrl);
      
      ws.onopen = () => {
        console.log('[WebSocket] Connection established');
        setIsConnected(true);
        setError(null);
      };
      
      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as WebSocketMessage;
          console.log('[WebSocket] Message received:', message);
        } catch (err) {
          console.error('[WebSocket] Message parsing error:', err);
        }
      };
      
      ws.onerror = (event) => {
        console.error('[WebSocket] Error:', event);
        setError('WebSocket error occurred');
      };
      
      ws.onclose = (event) => {
        console.log('[WebSocket] Connection closed:', event.code, event.reason);
        setIsConnected(false);
        
        // Attempt to reconnect unless this was a clean shutdown
        if (event.code !== 1000) {
          if (retryTimeoutRef.current) {
            clearTimeout(retryTimeoutRef.current);
          }
          
          retryTimeoutRef.current = setTimeout(() => {
            console.log('[WebSocket] Attempting to reconnect...');
            connect();
          }, 3000);
        }
      };
      
      setSocket(ws);
    } catch (err) {
      console.error('[WebSocket] Setup error:', err);
      setError('Failed to establish WebSocket connection');
    }
  }, [auth.user]);
  
  // Send message through WebSocket
  const sendMessage = useCallback((type: string, payload: any) => {
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      setError('WebSocket is not connected');
      return false;
    }
    
    try {
      const message: WebSocketMessage = { type, payload };
      socket.send(JSON.stringify(message));
      return true;
    } catch (err) {
      console.error('[WebSocket] Send error:', err);
      setError('Failed to send message');
      return false;
    }
  }, [socket]);
  
  // Join a session
  const joinSession = useCallback((sessionId: string) => {
    return sendMessage('JOIN_SESSION', { sessionId });
  }, [sendMessage]);
  
  // Leave a session
  const leaveSession = useCallback((sessionId: string) => {
    return sendMessage('LEAVE_SESSION', { sessionId });
  }, [sendMessage]);
  
  // Update playlist
  const updatePlaylist = useCallback((sessionId: string, action: 'add' | 'remove', track: Track) => {
    return sendMessage('UPDATE_PLAYLIST', { sessionId, action, track });
  }, [sendMessage]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      
      if (socket) {
        socket.close(1000, 'Component unmounted');
      }
    };
  }, [socket]);
  
  // Reconnect when user changes
  useEffect(() => {
    if (socket) {
      socket.close(1000, 'User changed');
    }
    
    if (auth.user) {
      connect();
    }
  }, [auth.user, connect, socket]);
  
  return {
    isConnected,
    error,
    sendMessage,
    joinSession,
    leaveSession,
    updatePlaylist
  };
}

export default useWebSocket; 