import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseService } from './services/database.service';
import { UserService } from './services/user.service';
import { SpotifyService } from './services/spotify.service';
import { SpotifyController } from './controllers/spotify.controller';
import { GroupSessionService } from './services/group-session.service';
import { GroupSessionController } from './controllers/group-session.controller';
import { WebSocketService } from './services/websocket.service';
import { RecommendationService } from './services/recommendation.service';
import { GroupRecommendationsController } from './controllers/group-recommendations.controller';
import { AuthModule } from './auth/auth.module';
import { RedisModule } from './redis/redis.module';
import { WebSocketModule } from './websocket/websocket.module';
import { AimlModule } from './aiml/aiml.module';
import { NLPRecommendationController } from './controllers/nlp-recommendation.controller';
import { AnalyticsController } from './controllers/analytics.controller';
import { AnalyticsService } from './services/analytics.service';
import { CacheService } from './services/cache.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    JwtModule.registerAsync({
      useFactory: () => ({
        secret: process.env.JWT_SECRET,
        signOptions: { expiresIn: process.env.JWT_EXPIRES_IN || '7d' },
      }),
    }),
    AuthModule,
    RedisModule,
    WebSocketModule,
    AimlModule,
  ],
  controllers: [
    AppController,
    SpotifyController,
    GroupSessionController,
    GroupRecommendationsController,
    NLPRecommendationController,
    AnalyticsController,
  ],
  providers: [
    AppService,
    DatabaseService,
    UserService,
    SpotifyService,
    GroupSessionService,
    RecommendationService,
    AnalyticsService,
    CacheService,
  ],
  exports: [
    DatabaseService,
    SpotifyService,
    GroupSessionService,
  ],
})
export class AppModule {} 