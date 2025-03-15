import '@types/jest';

// Mock socket.io-client
jest.mock('socket.io-client', () => {
  const mockSocketOn = jest.fn();
  const mockSocketEmit = jest.fn();
  const mockSocketConnect = jest.fn();
  const mockSocketDisconnect = jest.fn();
  
  return {
    __esModule: true,
    default: jest.fn(() => ({
      on: mockSocketOn,
      emit: mockSocketEmit,
      connect: mockSocketConnect,
      disconnect: mockSocketDisconnect,
      id: 'mock-socket-id'
    })),
    mockSocketOn,
    mockSocketEmit,
    mockSocketConnect,
    mockSocketDisconnect
  };
});

// Mock localStorage
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: jest.fn(() => 'mock-token'),
    setItem: jest.fn(),
    removeItem: jest.fn()
  },
  writable: true
});

// Import WebSocket service
import websocketService, { WebSocketEventType } from '../websocket.service';

// Define types for the mock calls
type MockCall = [string, Function];

describe('WebSocketService', () => {
  let socketIoMock: any;
  let socketMock: any;
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Get reference to the socket.io instance
    socketIoMock = require('socket.io-client');
    socketMock = socketIoMock.default();
  });
  
  describe('connect', () => {
    it('should connect to WebSocket server with the session ID', () => {
      // Act
      websocketService.connect('test-session-id');
      
      // Assert
      expect(socketIoMock.default).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({
        reconnection: true,
        reconnectionAttempts: expect.any(Number),
        reconnectionDelay: expect.any(Number)
      }));
    });
    
    it('should add event listeners after connecting', () => {
      // Act
      websocketService.connect('test-session-id');
      
      // Assert
      expect(socketMock.on).toHaveBeenCalledWith('connect', expect.any(Function));
      expect(socketMock.on).toHaveBeenCalledWith('disconnect', expect.any(Function));
      expect(socketMock.on).toHaveBeenCalledWith('error', expect.any(Function));
      expect(socketMock.on).toHaveBeenCalledWith('session_update', expect.any(Function));
      expect(socketMock.on).toHaveBeenCalledWith('playlist_update', expect.any(Function));
    });
  });
  
  describe('disconnect', () => {
    it('should disconnect from WebSocket server', () => {
      // Arrange
      websocketService.connect('test-session-id');
      
      // Act
      websocketService.disconnect();
      
      // Assert
      expect(socketMock.disconnect).toHaveBeenCalled();
    });
  });
  
  describe('error handling', () => {
    it('should dispatch error events when an error occurs', () => {
      // Arrange
      const errorCallback = jest.fn();
      websocketService.addEventListener(WebSocketEventType.ERROR, errorCallback);
      websocketService.connect('test-session-id');
      
      // Get the error handler that was registered
      const errorHandler = socketMock.on.mock.calls.find((call: MockCall) => call[0] === 'error')[1];
      
      // Simulate an error event
      errorHandler({ message: 'Test error' });
      
      // Assert
      expect(errorCallback).toHaveBeenCalledWith(expect.objectContaining({
        type: WebSocketEventType.ERROR,
        error: expect.objectContaining({
          message: expect.any(String)
        })
      }));
    });
    
    it('should handle connection failures', () => {
      // Arrange
      const errorCallback = jest.fn();
      websocketService.addEventListener(WebSocketEventType.ERROR, errorCallback);
      websocketService.connect('test-session-id');
      
      // Get the disconnect handler that was registered
      const disconnectHandler = socketMock.on.mock.calls.find((call: MockCall) => call[0] === 'disconnect')[1];
      
      // Simulate a disconnection event
      disconnectHandler('transport error');
      
      // Assert
      expect(errorCallback).toHaveBeenCalledWith(expect.objectContaining({
        type: WebSocketEventType.ERROR,
        error: expect.objectContaining({
          message: expect.stringContaining('connection')
        })
      }));
    });
    
    it('should retry connection on failure', () => {
      // Arrange
      jest.useFakeTimers();
      websocketService.connect('test-session-id');
      
      // Get the disconnect handler that was registered
      const disconnectHandler = socketMock.on.mock.calls.find((call: MockCall) => call[0] === 'disconnect')[1];
      
      // Act - Simulate a disconnection event
      disconnectHandler('transport error');
      
      // Fast-forward time to trigger reconnection
      jest.advanceTimersByTime(5000);
      
      // Assert
      expect(socketMock.connect).toHaveBeenCalled();
      
      // Cleanup
      jest.useRealTimers();
    });
  });
}); 