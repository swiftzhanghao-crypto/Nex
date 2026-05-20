const REPORT_URL = `${import.meta.env.VITE_API_URL || '/api'}/errors`;
const MAX_QUEUE = 10;
const FLUSH_INTERVAL = 5000;

interface ErrorEntry {
  message: string;
  stack?: string;
  source?: string;
  url: string;
  timestamp: string;
  userAgent: string;
}

const queue: ErrorEntry[] = [];
let timer: ReturnType<typeof setTimeout> | null = null;

function flush() {
  if (queue.length === 0) return;
  const batch = queue.splice(0, MAX_QUEUE);
  try {
    const blob = new Blob([JSON.stringify(batch)], { type: 'application/json' });
    navigator.sendBeacon(REPORT_URL, blob);
  } catch {
    /* silently fail — error reporting should never break the app */
  }
}

function scheduleFlush() {
  if (timer) return;
  timer = setTimeout(() => {
    timer = null;
    flush();
  }, FLUSH_INTERVAL);
}

export function reportError(error: Error | string, source?: string) {
  const entry: ErrorEntry = {
    message: typeof error === 'string' ? error : error.message,
    stack: typeof error === 'string' ? undefined : error.stack?.slice(0, 2000),
    source,
    url: window.location.href,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
  };
  queue.push(entry);
  if (queue.length >= MAX_QUEUE) flush();
  else scheduleFlush();
}

export function initGlobalErrorHandlers() {
  window.addEventListener('error', (event) => {
    reportError(event.error || event.message, 'window.onerror');
  });

  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    const msg = reason instanceof Error ? reason : String(reason);
    reportError(msg instanceof Error ? msg : new Error(String(msg)), 'unhandledrejection');
  });
}
