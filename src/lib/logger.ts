type LogContext = Record<string, unknown> | undefined;

function write(
  level: 'info' | 'warn' | 'error',
  message: string,
  context?: LogContext
) {
  const prefix = '[worksight_dashboard]';
  if (context) {
    console[level](`${prefix} ${message}`, context);
    return;
  }
  console[level](`${prefix} ${message}`);
}

export const logger = {
  info(message: string, context?: LogContext) {
    write('info', message, context);
  },
  warn(message: string, context?: LogContext) {
    write('warn', message, context);
  },
  error(message: string, context?: LogContext) {
    write('error', message, context);
  },
};
