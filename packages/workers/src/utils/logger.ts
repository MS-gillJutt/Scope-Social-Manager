import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  redact: {
    paths: [
      'accessToken',
      'refreshToken',
      'token',
      'tokens',
      'password',
      'secret',
      'key',
      'headers.authorization',
      'headers.cookie',
      'req.headers.authorization',
      '*.accessToken',
      '*.refreshToken',
      '*.password',
      '*.secret',
    ],
    censor: '[REDACTED]',
  },
  transport:
    process.env.NODE_ENV !== 'production'
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            ignore: 'pid,hostname',
            translateTime: 'SYS:standard',
          },
        }
      : undefined,
});

export default logger;
