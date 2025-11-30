/* eslint-disable no-console */
type LoggerMethod = (...args: unknown[]) => void;

const withPrefix =
  (method: LoggerMethod) =>
  (message: unknown, ...args: unknown[]) => {
    const prefix = '[allpro]';
    if (typeof message === 'string') {
      method(`${prefix} ${message}`, ...args);
    } else {
      method(prefix, message, ...args);
    }
  };

export const logger = {
  debug: withPrefix(console.debug.bind(console)),
  info: withPrefix(console.info.bind(console)),
  warn: withPrefix(console.warn.bind(console)),
  error: withPrefix(console.error.bind(console)),
};
