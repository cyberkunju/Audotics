import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { ValidationPipe } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { Request, Response, NextFunction } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Main');
  
  // Enable trust proxy - IMPORTANT for secure cookies across domains
  app.getHttpAdapter().getInstance().set('trust proxy', 1);
  
  // Configure CORS
  app.enableCors({
    origin: ['http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie']
  });

  // Enable cookie parsing
  app.use(cookieParser());

  // Enable validation pipes
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true
  }));

  // Add middleware to log cookies for debugging
  app.use((req: Request, res: Response, next: NextFunction) => {
    // Log cookies on each request for debugging
    if (req.path.includes('/auth/spotify/refresh')) {
      logger.debug(`Cookies received: ${JSON.stringify(req.cookies)}`);
    }
    
    // Continue to next middleware
    next();
  });

  // Get the port from environment variables or use default
  const port = process.env.PORT || 3002;
  
  // Use a single port for both HTTP and WebSocket
  // Using the standard WebSocket adapter without custom server
  app.useWebSocketAdapter(new IoAdapter(app));

  // Start the server
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
  console.log(`WebSocket server is also running on port: ${port}`);
}

bootstrap(); 