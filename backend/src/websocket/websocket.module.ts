import { Module } from '@nestjs/common';
import { WebSocketService } from '../services/websocket.service';
import { WebSocketGateway } from './websocket.gateway';
import { Server } from 'socket.io';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: Server,
      useFactory: (configService: ConfigService) => {
        return new Server({
          cors: {
            origin: configService.get('FRONTEND_URL', 'http://localhost:3000'),
            credentials: true
          }
        });
      },
      inject: [ConfigService]
    },
    WebSocketService,
    WebSocketGateway
  ],
  exports: [WebSocketService, Server]
})
export class WebSocketModule {} 