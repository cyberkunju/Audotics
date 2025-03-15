import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';

/**
 * Structured WebSocket error response
 */
export interface WebSocketErrorResponse {
  status: 'error';
  message: string;
  errorCode: string;
  timestamp: string;
  data?: any;
}

/**
 * Exception types for WebSocket connections
 */
export enum WebSocketErrorCode {
  UNAUTHORIZED = 'UNAUTHORIZED',
  CONNECTION_ERROR = 'CONNECTION_ERROR',
  INVALID_PAYLOAD = 'INVALID_PAYLOAD',
  SESSION_ERROR = 'SESSION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  INTERNAL_ERROR = 'INTERNAL_ERROR'
}

/**
 * Custom WebSocket exception class
 */
export class WebSocketError extends WsException {
  constructor(
    public readonly message: string,
    public readonly errorCode: WebSocketErrorCode = WebSocketErrorCode.INTERNAL_ERROR,
    public readonly data?: any
  ) {
    super({ message, errorCode, data });
  }
}

/**
 * Exception filter for WebSocket connections
 * This filter catches all exceptions thrown during WebSocket communication
 * and formats them in a consistent way
 */
@Catch()
export class WebSocketExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(WebSocketExceptionFilter.name);

  catch(exception: any, host: ArgumentsHost) {
    const client = host.switchToWs().getClient() as Socket;
    let errorResponse: WebSocketErrorResponse;

    // Format different types of exceptions into a consistent structure
    if (exception instanceof WebSocketError) {
      errorResponse = this.handleWebSocketError(exception);
    } else if (exception instanceof WsException) {
      errorResponse = this.handleWsException(exception);
    } else if (exception instanceof HttpException) {
      errorResponse = this.handleHttpException(exception);
    } else {
      errorResponse = this.handleUnknownError(exception);
    }

    // Log the error for server-side troubleshooting
    this.logger.error(`WebSocket Error: ${errorResponse.message}`, {
      errorCode: errorResponse.errorCode,
      clientId: client.id,
      timestamp: errorResponse.timestamp,
      data: errorResponse.data
    });

    // Send the error to the client
    client.emit('exception', errorResponse);
  }

  private handleWebSocketError(exception: WebSocketError): WebSocketErrorResponse {
    return {
      status: 'error',
      message: exception.message,
      errorCode: exception.errorCode,
      timestamp: new Date().toISOString(),
      data: exception.data
    };
  }

  private handleWsException(exception: WsException): WebSocketErrorResponse {
    const error = exception.getError();
    const message = typeof error === 'string' 
      ? error 
      : (typeof error === 'object' && error !== null && 'message' in error) 
        ? (error as { message: string }).message 
        : 'WebSocket error occurred';
    
    return {
      status: 'error',
      message,
      errorCode: WebSocketErrorCode.INTERNAL_ERROR,
      timestamp: new Date().toISOString(),
      data: typeof error === 'object' ? error : undefined
    };
  }

  private handleHttpException(exception: HttpException): WebSocketErrorResponse {
    const status = exception.getStatus();
    let errorCode = WebSocketErrorCode.INTERNAL_ERROR;
    
    // Map HTTP status codes to WebSocket error codes
    if (status === HttpStatus.UNAUTHORIZED) {
      errorCode = WebSocketErrorCode.UNAUTHORIZED;
    } else if (status === HttpStatus.NOT_FOUND) {
      errorCode = WebSocketErrorCode.NOT_FOUND;
    } else if (status === HttpStatus.BAD_REQUEST) {
      errorCode = WebSocketErrorCode.INVALID_PAYLOAD;
    }
    
    return {
      status: 'error',
      message: exception.message,
      errorCode,
      timestamp: new Date().toISOString(),
      data: exception.getResponse()
    };
  }

  private handleUnknownError(exception: any): WebSocketErrorResponse {
    const message = exception.message || 'An unexpected error occurred';
    
    return {
      status: 'error',
      message,
      errorCode: WebSocketErrorCode.INTERNAL_ERROR,
      timestamp: new Date().toISOString(),
      data: {
        name: exception.name,
        stack: exception.stack
      }
    };
  }
} 