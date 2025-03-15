/**
 * WebSocket Integration Test
 * 
 * This test file verifies that the WebSocket service correctly integrates
 * with the backend WebSocket server. It tests real connections, authentication,
 * and message handling.
 * 
 * NOTE: This test requires the backend server to be running.
 * Run with: npm run test:integration
 */

import websocketService, { WebSocketEventType } from '../../websocket.service';

// Define event interfaces for TypeScript type checking
interface WebSocketEvent {
  type: WebSocketEventType;
  [key: string]: any;
}

// Run integration tests
describe('WebSocket Integration Tests', () => {
  // Set a longer timeout since we're testing real connections
  jest.setTimeout(30000);
  
  // Mock user token
  beforeEach(() => {
    // Set a valid token in localStorage
    localStorage.setItem('auth_token', 'test-token');
  });
  
  afterEach(async () => {
    // Clean up after each test
    await new Promise<void>((resolve) => {
      const cleanup = () => {
        websocketService.disconnect();
        localStorage.removeItem('auth_token');
        resolve();
      };

      // If connected, wait for disconnect, otherwise cleanup immediately
      if (websocketService.isConnected()) {
        websocketService.addEventListener(WebSocketEventType.USER_LEAVE, cleanup, { once: true });
        websocketService.disconnect();
      } else {
        cleanup();
      }
    });
  });
  
  it('should connect to the backend WebSocket server', (done) => {
    const cleanup = new Set<() => void>();
    
    // Set up connection handler
    const handleConnect = (event: WebSocketEvent) => {
      try {
        expect(websocketService.isConnected()).toBe(true);
        expect(event.sessionId).toBe('test-session-id');
        cleanup.forEach(fn => fn());
        done();
      } catch (error) {
        cleanup.forEach(fn => fn());
        done(error);
      }
    };
    
    // Listen for connection success
    cleanup.add(() => websocketService.removeEventListener(WebSocketEventType.USER_JOIN, handleConnect));
    websocketService.addEventListener(WebSocketEventType.USER_JOIN, handleConnect);
    
    // Listen for potential errors
    const handleError = (event: WebSocketEvent) => {
      cleanup.forEach(fn => fn());
      done(new Error(`WebSocket connection failed: ${event.message || 'Unknown error'}`));
    };
    cleanup.add(() => websocketService.removeEventListener(WebSocketEventType.ERROR, handleError));
    websocketService.addEventListener(WebSocketEventType.ERROR, handleError);
    
    // Attempt to connect
    websocketService.connect('test-session-id');
  }, 30000);
  
  it('should receive session updates from the server', (done) => {
    const cleanup = new Set<() => void>();
    let receivedUpdate = false;
    
    // Listen for session updates
    const handleSessionUpdate = (event: WebSocketEvent) => {
      try {
        receivedUpdate = true;
        expect(event.session).toBeDefined();
        expect(event.sessionId).toBe('test-session-id');
        cleanup.forEach(fn => fn());
        done();
      } catch (error) {
        cleanup.forEach(fn => fn());
        done(error);
      }
    };
    cleanup.add(() => websocketService.removeEventListener(WebSocketEventType.SESSION_UPDATE, handleSessionUpdate));
    websocketService.addEventListener(WebSocketEventType.SESSION_UPDATE, handleSessionUpdate);
    
    // Listen for connection success
    const handleConnect = (event: WebSocketEvent) => {
      try {
        expect(event.sessionId).toBe('test-session-id');
        // Once connected, if we don't receive an update within 5 seconds, fail the test
        const timeout = setTimeout(() => {
          if (!receivedUpdate) {
            cleanup.forEach(fn => fn());
            done(new Error('Did not receive session update within timeout period'));
          }
        }, 5000);
        cleanup.add(() => clearTimeout(timeout));
      } catch (error) {
        cleanup.forEach(fn => fn());
        done(error);
      }
    };
    cleanup.add(() => websocketService.removeEventListener(WebSocketEventType.USER_JOIN, handleConnect));
    websocketService.addEventListener(WebSocketEventType.USER_JOIN, handleConnect);
    
    // Listen for potential errors
    const handleError = (event: WebSocketEvent) => {
      cleanup.forEach(fn => fn());
      done(new Error(`WebSocket error: ${event.message || 'Unknown error'}`));
    };
    cleanup.add(() => websocketService.removeEventListener(WebSocketEventType.ERROR, handleError));
    websocketService.addEventListener(WebSocketEventType.ERROR, handleError);
    
    // Attempt to connect
    websocketService.connect('test-session-id');
  }, 30000);
  
  it('should handle reconnection after disconnection', (done) => {
    const cleanup = new Set<() => void>();
    let disconnected = false;
    let reconnected = false;
    
    // Listen for connection events
    const handleConnect = (event: WebSocketEvent) => {
      try {
        expect(event.sessionId).toBe('test-session-id');
        if (!disconnected) {
          // First connection successful, now simulate disconnect
          disconnected = true;
          websocketService.disconnect();
          
          // Attempt to reconnect after a brief delay
          setTimeout(() => {
            websocketService.connect('test-session-id');
          }, 1000);
        } else {
          // Reconnection successful
          reconnected = true;
          expect(reconnected).toBe(true);
          cleanup.forEach(fn => fn());
          done();
        }
      } catch (error) {
        cleanup.forEach(fn => fn());
        done(error);
      }
    };
    cleanup.add(() => websocketService.removeEventListener(WebSocketEventType.USER_JOIN, handleConnect));
    websocketService.addEventListener(WebSocketEventType.USER_JOIN, handleConnect);
    
    // Listen for potential errors
    const handleError = (event: WebSocketEvent) => {
      if (!reconnected) {
        cleanup.forEach(fn => fn());
        done(new Error(`WebSocket error: ${event.message || 'Unknown error'}`));
      }
    };
    cleanup.add(() => websocketService.removeEventListener(WebSocketEventType.ERROR, handleError));
    websocketService.addEventListener(WebSocketEventType.ERROR, handleError);
    
    // Attempt initial connection
    websocketService.connect('test-session-id');
  }, 30000);
  
  it('should emit events to the server', (done) => {
    const cleanup = new Set<() => void>();
    
    // Listen for connection success
    const handleConnect = (event: WebSocketEvent) => {
      try {
        expect(event.sessionId).toBe('test-session-id');
        // Attempt to send a test message
        const success = websocketService.sendMessage('test_event', { test: 'data' });
        expect(success).toBe(true);
        
        // If we can send without errors, consider the test successful after a short delay
        const timeout = setTimeout(() => {
          cleanup.forEach(fn => fn());
          done();
        }, 1000);
        cleanup.add(() => clearTimeout(timeout));
      } catch (error) {
        cleanup.forEach(fn => fn());
        done(error instanceof Error ? error : new Error(String(error)));
      }
    };
    cleanup.add(() => websocketService.removeEventListener(WebSocketEventType.USER_JOIN, handleConnect));
    websocketService.addEventListener(WebSocketEventType.USER_JOIN, handleConnect);
    
    // Listen for potential errors
    const handleError = (event: WebSocketEvent) => {
      cleanup.forEach(fn => fn());
      done(new Error(`WebSocket error: ${event.message || 'Unknown error'}`));
    };
    cleanup.add(() => websocketService.removeEventListener(WebSocketEventType.ERROR, handleError));
    websocketService.addEventListener(WebSocketEventType.ERROR, handleError);
    
    // Attempt to connect
    websocketService.connect('test-session-id');
  }, 30000);
}); 