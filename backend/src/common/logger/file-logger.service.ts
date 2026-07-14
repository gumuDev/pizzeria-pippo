import { ConsoleLogger } from '@nestjs/common';
import { appendFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { todayInBolivia } from '../utils/timezone';

const LOG_DIR = join(process.cwd(), 'logs');

// Vercel (and other serverless hosts) give a read-only filesystem outside
// /tmp — file logging only makes sense for local dev there.
const canWriteToFile = !process.env.VERCEL;

if (canWriteToFile) {
  mkdirSync(LOG_DIR, { recursive: true });
}

// One file per business day (Bolivia time) so `logs/` doesn't grow into a single
// unbounded file — computed on every write, so it rotates naturally past midnight
// without needing to restart the process.
function getLogFilePath(): string {
  return join(LOG_DIR, `app-${todayInBolivia()}.log`);
}

function stripAnsi(text: string): string {
  // eslint-disable-next-line no-control-regex
  return text.replace(/\x1B\[[0-9;]*m/g, '');
}

function writeToFile(level: string, message: unknown, context?: string) {
  if (!canWriteToFile) return;
  const timestamp = new Date().toISOString();
  const text = typeof message === 'string' ? message : JSON.stringify(message, null, 2);
  const line = `[${timestamp}] [${level}]${context ? ` [${context}]` : ''} ${stripAnsi(text)}\n`;
  appendFileSync(getLogFilePath(), line);
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
