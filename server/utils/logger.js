/**
 * Structured logger utility
 */
const logLevels = {
  INFO: 'INFO',
  WARN: 'WARN',
  ERROR: 'ERROR',
  DEBUG: 'DEBUG',
};

const formatMessage = (level, message, meta = null) => {
  const timestamp = new Date().toISOString();
  let log = `[${timestamp}] [${level}] ${message}`;
  if (meta) {
    if (meta instanceof Error) {
      log += `\nStack: ${meta.stack}`;
    } else {
      try {
        log += ` | ${JSON.stringify(meta)}`;
      } catch {
        log += ` | [Object]`;
      }
    }
  }
  return log;
};

const logger = {
  info: (msg, meta) => console.log(formatMessage(logLevels.INFO, msg, meta)),
  warn: (msg, meta) => console.warn(formatMessage(logLevels.WARN, msg, meta)),
  error: (msg, meta) => console.error(formatMessage(logLevels.ERROR, msg, meta)),
  debug: (msg, meta) => {
    if (process.env.NODE_ENV !== 'production') {
      console.log(formatMessage(logLevels.DEBUG, msg, meta));
    }
  },
};

module.exports = logger;
