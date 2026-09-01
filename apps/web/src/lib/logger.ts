// Centralized logging utility for consistent error handling and debugging

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogEntry {
  level: LogLevel
  message: string
  timestamp: string
  context?: Record<string, any>
  error?: Error
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development'

  private formatLog(entry: LogEntry): string {
    const { level, message, timestamp, context, error } = entry
    const contextStr = context ? ` | Context: ${JSON.stringify(context)}` : ''
    const errorStr = error ? ` | Error: ${error.message}` : ''
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}${errorStr}`
  }

  private log(level: LogLevel, message: string, context?: Record<string, any>, error?: Error) {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
      error
    }

    const formattedMessage = this.formatLog(entry)

    switch (level) {
      case 'debug':
        if (this.isDevelopment) console.debug(formattedMessage)
        break
      case 'info':
        console.info(formattedMessage)
        break
      case 'warn':
        console.warn(formattedMessage)
        break
      case 'error':
        console.error(formattedMessage)
        if (error && this.isDevelopment) console.error(error.stack)
        break
    }
  }

  debug(message: string, context?: Record<string, any>) {
    this.log('debug', message, context)
  }

  info(message: string, context?: Record<string, any>) {
    this.log('info', message, context)
  }

  warn(message: string, context?: Record<string, any>) {
    this.log('warn', message, context)
  }

  error(message: string, error?: Error, context?: Record<string, any>) {
    this.log('error', message, context, error)
  }

  // Specialized logging methods for common scenarios
  apiRequest(method: string, endpoint: string, context?: Record<string, any>) {
    this.info(`API Request: ${method} ${endpoint}`, context)
  }

  apiResponse(method: string, endpoint: string, statusCode: number, context?: Record<string, any>) {
    this.info(`API Response: ${method} ${endpoint} - ${statusCode}`, context)
  }

  apiError(method: string, endpoint: string, error: Error, context?: Record<string, any>) {
    this.error(`API Error: ${method} ${endpoint}`, error, context)
  }

  databaseOperation(operation: string, table: string, context?: Record<string, any>) {
    this.debug(`Database: ${operation} on ${table}`, context)
  }

  databaseError(operation: string, table: string, error: Error, context?: Record<string, any>) {
    this.error(`Database Error: ${operation} on ${table}`, error, context)
  }

  authEvent(event: string, context?: Record<string, any>) {
    this.info(`Auth Event: ${event}`, context)
  }

  paymentEvent(event: string, context?: Record<string, any>) {
    this.info(`Payment Event: ${event}`, context)
  }
}

export const logger = new Logger()