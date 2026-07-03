import { ConsoleLogger } from '@nestjs/common';
import { appendFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const LOG_DIR = join(process.cwd(), 'logs');
const LOG_FILE = join(LOG_DIR, 'app.log');

mkdirSync(LOG_DIR, { recursive: true });

function stripAnsi(text: string): string {
  // eslint-disable-next-line no-control-regex
  return text.replace(/\x1B\[[0-9;]*m/g, '');
}

function writeToFile(level: string, message: unknown, context?: string) {
  const timestamp = new Date().toISOString();
  const text = typeof message === 'string' ? message : JSON.stringify(message, null, 2);
  const line = `[${timestamp}] [${level}]${context ? ` [${context}]` : ''} ${stripAnsi(text)}\n`;
  appendFileSync(LOG_FILE, line);
}

export class FileLogger extends ConsoleLogger {
  log(message: unknown, context?: string) {
    super.log(message, context);
    writeToFile('LOG', message, context);
  }

  error(message: unknown, stack?: string, context?: string) {
    super.error(message, stack, context);
    writeToFile('ERROR', stack ? `${message}\n${stack}` : message, context);
  }

  warn(message: unknown, context?: string) {
    super.warn(message, context);
    writeToFile('WARN', message, context);
  }

  debug(message: unknown, context?: string) {
    super.debug(message, context);
    writeToFile('DEBUG', message, context);
  }

  verbose(message: unknown, context?: string) {
    super.verbose(message, context);
    writeToFile('VERBOSE', message, context);
  }
}
