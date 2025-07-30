import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { apiLogger } from './logger';

// Standard error codes
export enum ErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  FILE_PROCESSING_ERROR = 'FILE_PROCESSING_ERROR'
}

// Error payload structure
export interface ErrorPayload {
  success: false;
  error: {
    message: string;
    code: ErrorCode;
    details?: any;
  };
}

// Custom error classes
export class AppError extends Error {
  constructor(
    message: string,
    public code: ErrorCode,
    public statusCode: number = 500,
    public details?: any
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, ErrorCode.VALIDATION_ERROR, 400, details);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, identifier?: string) {
    const message = identifier 
      ? `${resource} with identifier '${identifier}' not found`
      : `${resource} not found`;
    super(message, ErrorCode.NOT_FOUND, 404);
    this.name = 'NotFoundError';
  }
}

export class ExternalServiceError extends AppError {
  constructor(service: string, message: string, details?: any) {
    super(`${service} error: ${message}`, ErrorCode.EXTERNAL_SERVICE_ERROR, 502, details);
    this.name = 'ExternalServiceError';
  }
}

export class DatabaseError extends AppError {
  constructor(operation: string, originalError?: Error) {
    super(`Database ${operation} failed`, ErrorCode.DATABASE_ERROR, 500, {
      originalMessage: originalError?.message,
      originalStack: originalError?.stack
    });
    this.name = 'DatabaseError';
  }
}

export class FileProcessingError extends AppError {
  constructor(operation: string, filename?: string, originalError?: Error) {
    const message = filename 
      ? `File processing failed for '${filename}': ${operation}`
      : `File processing failed: ${operation}`;
    super(message, ErrorCode.FILE_PROCESSING_ERROR, 422, {
      filename,
      operation,
      originalMessage: originalError?.message
    });
    this.name = 'FileProcessingError';
  }
}

// Error handling utilities
export function handleZodError(error: ZodError): ValidationError {
  const details = error.issues?.map((err: any) => ({
    field: err.path.join('.'),
    message: err.message,
    code: err.code
  })) || [];
  
  return new ValidationError('Validation failed', { validationErrors: details });
}

export function createErrorResponse(
  error: Error,
  method: string,
  path: string
): NextResponse<ErrorPayload> {
  let appError: AppError;

  // Convert different error types to AppError
  if (error instanceof AppError) {
    appError = error;
  } else if (error instanceof ZodError) {
    appError = handleZodError(error);
  } else {
    // Unknown error - treat as internal server error
    appError = new AppError(
      'An unexpected error occurred',
      ErrorCode.INTERNAL_ERROR,
      500,
      { originalMessage: error.message }
    );
  }

  // Log the error
  apiLogger.apiResponse(method, path, appError.statusCode, {
    error: appError.message,
    code: appError.code,
    details: appError.details
  });

  const payload: ErrorPayload = {
    success: false,
    error: {
      message: appError.message,
      code: appError.code,
      details: appError.details
    }
  };

  return NextResponse.json(payload, { status: appError.statusCode });
}

// Helper function to safely extract error message
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'Unknown error occurred';
}

// Helper to determine if an error should be retried
export function isRetryableError(error: Error): boolean {
  if (error instanceof AppError) {
    return error.code === ErrorCode.EXTERNAL_SERVICE_ERROR && error.statusCode >= 500;
  }
  
  // Check for common retryable error patterns
  const message = error.message.toLowerCase();
  return message.includes('timeout') || 
         message.includes('network') || 
         message.includes('connection') ||
         message.includes('rate limit');
}