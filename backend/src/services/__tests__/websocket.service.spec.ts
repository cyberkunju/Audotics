import { Test, TestingModule } from '@nestjs/testing';
import { WebSocketService } from '../websocket.service';
import { Socket, Server } from 'socket.io';
import { Logger } from '@nestjs/common';

describe('WebSocketService', () => {
  let service: WebSocketService;
  let mockServer: any;

  beforeEach(async () => {
    // Create mock server
    mockServer = {
      on: jest.fn(),
      emit: jest.fn(),
      to: jest.fn().mockReturnValue({
        emit: jest.fn(),
      }),
      close: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: WebSocketService,
          useFactory: () => {
            return new WebSocketService(mockServer as any);
          },
        },
      ],
    }).compile();

    service = module.get<WebSocketService>(WebSocketService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('broadcastToAll', () => {
    it('should emit a message to all connected clients', () => {
      const event = 'system_event';
      const data = { message: 'Hello, world!' };

      service['broadcastToAll'](event, data);

      expect(mockServer.emit).toHaveBeenCalledWith(event, data);
    });
  });

  describe('broadcastToSession', () => {
    it('should emit a message to a specific room', () => {
      const sessionId = 'test-session-id';
      const payload = { message: 'Hello, session!' };

      service.broadcastToSession(sessionId, payload);

      expect(mockServer.to).toHaveBeenCalledWith(sessionId);
      expect(mockServer.to(sessionId).emit).toHaveBeenCalledWith('session_update', payload);
    });
  });

  describe('singleton pattern', () => {
    it('should return the same instance when getInstance is called', () => {
      const instance1 = WebSocketService.getInstance();
      const instance2 = WebSocketService.getInstance();

      expect(instance1).toBe(instance2);
    });
  });
}); 