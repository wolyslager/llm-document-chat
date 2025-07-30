import pino from 'pino';

// Determine log level based on environment
const getLogLevel = (): string => {
  if (process.env.NODE_ENV === 'test') {
    return 'silent'; // No logging during tests unless explicitly enabled
  }
  
  if (process.env.DEBUG === 'true' || process.env.LOG_LEVEL === 'debug') {
    return 'debug';
  }
  
  if (process.env.NODE_ENV === 'development') {
    return 'info';
  }
  
  return 'warn'; // Production default
};

// Configure pino logger
const logger = pino({
  level: getLogLevel(),
  transport: process.env.NODE_ENV === 'development' ? {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:yyyy-mm-dd HH:MM:ss',
      ignore: 'pid,hostname',
    }
  } : undefined,
  formatters: {
    level: (label) => {
      return { level: label };
    }
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});

// Helper functions for common logging patterns with emojis
export const createLogger = (module: string) => {
  const childLogger = logger.child({ module });

  return {
    // Debug level - for detailed flow and emoji messages
    debug: (message: string, data?: object) => {
      childLogger.debug(data, message);
    },

    // Info level - for general operational messages
    info: (message: string, data?: object) => {
      childLogger.info(data, message);
    },

    // Warn level - for warnings that don't break flow
    warn: (message: string, data?: object) => {
      childLogger.warn(data, message);
    },

    // Error level - for actual errors with context
    error: (message: string, error?: Error | unknown, data?: object) => {
      const errorData = {
        ...data,
        ...(error instanceof Error ? {
          error: {
            message: error.message,
            stack: error.stack,
            name: error.name
          }
        } : error ? { error } : {})
      };
      
      childLogger.error(errorData, message);
    },

    // Specialized methods for common patterns
    
    // Database operations
    dbOperation: (operation: string, data?: object) => {
      childLogger.info(data, `📂 Database: ${operation}`);
    },

    dbError: (operation: string, error: Error, data?: object) => {
      childLogger.error({ 
        ...data, 
        operation,
        error: {
          message: error.message,
          stack: error.stack,
          name: error.name
        }
      }, `❌ Database Error: ${operation} failed`);
    },

    // API operations
    apiRequest: (method: string, path: string, data?: object) => {
      childLogger.info({ method, path, ...data }, `🔍 API ${method} ${path}`);
    },

    apiResponse: (method: string, path: string, status: number, data?: object) => {
      const level = status >= 400 ? 'error' : status >= 300 ? 'warn' : 'info';
      const emoji = status >= 400 ? '❌' : status >= 300 ? '⚠️' : '✅';
      
      childLogger[level]({ method, path, status, ...data }, `${emoji} API ${method} ${path} - ${status}`);
    },

    // Processing operations
    processStart: (operation: string, data?: object) => {
      childLogger.debug(data, `🚀 Starting: ${operation}`);
    },

    processStep: (step: string, data?: object) => {
      childLogger.debug(data, `⚡ Step: ${step}`);
    },

    processComplete: (operation: string, duration?: number, data?: object) => {
      const durationData = duration ? { duration } : {};
      childLogger.info({ ...durationData, ...data }, `✅ Completed: ${operation}`);
    },

    processError: (operation: string, error: Error, data?: object) => {
      childLogger.error({
        ...data,
        operation,
        error: {
          message: error.message,
          stack: error.stack,
          name: error.name
        }
      }, `❌ Failed: ${operation}`);
    }
  };
};

// Export default logger for general use
export default logger;

// Export commonly used loggers
export const dbLogger = createLogger('database');
export const apiLogger = createLogger('api');
export const openaiLogger = createLogger('openai');