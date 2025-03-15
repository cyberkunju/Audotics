import { WebSocketGateway as WSGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';

@WSGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
  }
})
export class WebSocketGateway {
  @WebSocketServer()
  server: Server;
} 