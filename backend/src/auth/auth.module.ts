import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from '../controllers/auth.controller';
import { SpotifyAuthService } from './services/spotify-auth.service';
import { TokenService } from './services/token.service';
import { RedisModule } from '../redis/redis.module';

@Module({
  imports: [
    ConfigModule,
    JwtModule.registerAsync({
      useFactory: () => ({
        secret: process.env.JWT_SECRET,
        signOptions: { expiresIn: process.env.JWT_EXPIRES_IN || '7d' },
      }),
    }),
    RedisModule,
  ],
  controllers: [AuthController],
  providers: [SpotifyAuthService, TokenService],
  exports: [SpotifyAuthService, TokenService]
})
export class AuthModule {} 