type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface Logger {
  debug: (message: string, ...args: unknown[]) => void
  info: (message: string, ...args: unknown[]) => void
  warn: (message: string, ...args: unknown[]) => void
  error: (message: string, ...args: unknown[]) => void
}

const isDevelopment = process.env.NODE_ENV === 'development'

function shouldLog(level: LogLevel): boolean {
  if (level === 'error' || level === 'warn') {
    return true
  }
  return isDevelopment
}

function formatMessage(prefix: string, message: string): string {
  return `[${prefix}] ${message}`
}

function createLogger(prefix: string): Logger {
  return {
    debug: (message: string, ...args: unknown[]) => {
      if (shouldLog('debug')) {
        // eslint-disable-next-line no-console
        console.log(formatMessage(prefix, message), ...args)
      }
    },
    info: (message: string, ...args: unknown[]) => {
      if (shouldLog('info')) {
        // eslint-disable-next-line no-console
        console.log(formatMessage(prefix, message), ...args)
      }
    },
    warn: (message: string, ...args: unknown[]) => {
      if (shouldLog('warn')) {
        console.warn(formatMessage(prefix, message), ...args)
      }
    },
    error: (message: string, ...args: unknown[]) => {
      if (shouldLog('error')) {
        console.error(formatMessage(prefix, message), ...args)
      }
    },
  }
}

export const authLogger = createLogger('Auth')
export const statsLogger = createLogger('Stats')
export const cacheLogger = createLogger('Cache')
export const githubLogger = createLogger('GitHub')
export const comparisonLogger = createLogger('Comparison')
