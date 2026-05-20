import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LEVEL_PRIORITY: Record<LogLevel, number> = { debug: 0, info: 1, warn: 2, error: 3 };

const minLevel: LogLevel = (process.env.LOG_LEVEL as LogLevel) || (process.env.NODE_ENV === 'production' ? 'info' : 'debug');
const jsonMode = process.env.LOG_FORMAT === 'json' || process.env.NODE_ENV === 'production';
const writeToFile = process.env.NODE_ENV === 'production' || process.env.LOG_TO_FILE === 'true';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOG_DIR = process.env.LOG_DIR || path.join(__dirname, '..', 'logs');

if (writeToFile) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

function logFilePathForDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return path.join(LOG_DIR, `app-${y}-${m}-${d}.log`);
}

function appendToLogFile(line: string): void {
  if (!writeToFile) return;
  try {
    fs.appendFileSync(logFilePathForDate(new Date()), line + '\n', 'utf8');
  } catch {
    // 文件写入失败时不影响控制台输出
  }
}

function shouldLog(level: LogLevel): boolean {
  return LEVEL_PRIORITY[level] >= LEVEL_PRIORITY[minLevel];
}

function formatJson(level: LogLevel, module: string, msg: string, extra?: Record<string, unknown>) {
  const entry: Record<string, unknown> = {
    ts: new Date().toISOString(),
    level,
    module,
    msg,
    ...extra,
  };
  return JSON.stringify(entry);
}

const LEVEL_COLOR: Record<LogLevel, string> = {
  debug: '\x1b[90m',
  info: '\x1b[36m',
  warn: '\x1b[33m',
  error: '\x1b[31m',
};
const RESET = '\x1b[0m';

function formatPretty(level: LogLevel, module: string, msg: string, extra?: Record<string, unknown>) {
  const ts = new Date().toISOString().slice(11, 23);
  const color = LEVEL_COLOR[level];
  const extraStr = extra && Object.keys(extra).length ? ` ${JSON.stringify(extra)}` : '';
  return `${color}${ts} [${level.toUpperCase().padEnd(5)}]${RESET} [${module}] ${msg}${extraStr}`;
}

function emit(level: LogLevel, module: string, msg: string, extra?: Record<string, unknown>) {
  if (!shouldLog(level)) return;
  const line = jsonMode ? formatJson(level, module, msg, extra) : formatPretty(level, module, msg, extra);
  if (level === 'error') process.stderr.write(line + '\n');
  else process.stdout.write(line + '\n');
  appendToLogFile(line);
}

export interface Logger {
  debug(msg: string, extra?: Record<string, unknown>): void;
  info(msg: string, extra?: Record<string, unknown>): void;
  warn(msg: string, extra?: Record<string, unknown>): void;
  error(msg: string, extra?: Record<string, unknown>): void;
  child(subModule: string): Logger;
}

export function createLogger(module: string): Logger {
  return {
    debug: (msg, extra) => emit('debug', module, msg, extra),
    info: (msg, extra) => emit('info', module, msg, extra),
    warn: (msg, extra) => emit('warn', module, msg, extra),
    error: (msg, extra) => emit('error', module, msg, extra),
    child: (sub) => createLogger(`${module}:${sub}`),
  };
}

export const log = createLogger('app');
