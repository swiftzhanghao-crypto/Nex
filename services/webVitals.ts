const VITALS_URL = `${import.meta.env.VITE_API_URL || '/api'}/metrics/vitals`;

export interface VitalPayload {
  name: string;
  value: number;
  rating?: string;
  id?: string;
  navigationType?: string;
  delta?: number;
  url: string;
  timestamp: string;
  userAgent: string;
}

function sendVital(metric: Omit<VitalPayload, 'url' | 'timestamp' | 'userAgent'>) {
  const payload: VitalPayload = {
    ...metric,
    url: window.location.href,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
  };
  try {
    const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
    navigator.sendBeacon(VITALS_URL, blob);
  } catch {
    /* vitals reporting must never break the app */
  }
}

function observe(
  type: string,
  callback: (entry: PerformanceEntry) => void,
  options?: PerformanceObserverInit,
): PerformanceObserver | null {
  try {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        callback(entry);
      }
    });
    observer.observe({ type, buffered: true, ...options } as PerformanceObserverInit);
    return observer;
  } catch {
    return null;
  }
}

export function initWebVitals(): void {
  if (typeof window === 'undefined' || !('PerformanceObserver' in window)) return;

  // Cumulative Layout Shift
  let clsValue = 0;
  observe('layout-shift', (entry) => {
    const ls = entry as PerformanceEntry & { value?: number; hadRecentInput?: boolean };
    if (!ls.hadRecentInput) {
      clsValue += ls.value ?? 0;
    }
  });

  document.addEventListener(
    'visibilitychange',
    () => {
      if (document.visibilityState === 'hidden' && clsValue > 0) {
        sendVital({ name: 'CLS', value: clsValue });
      }
    },
    { once: false },
  );

  // Largest Contentful Paint
  observe('largest-contentful-paint', (entry) => {
    sendVital({
      name: 'LCP',
      value: entry.startTime,
      id: entry.name,
    });
  });

  // Interaction to Next Paint (when supported)
  let inpReported = false;
  observe(
    'event',
    (entry) => {
      if (inpReported) return;
      const ev = entry as PerformanceEventTiming & { interactionId?: number };
      if (ev.interactionId && ev.duration > 0) {
        inpReported = true;
        sendVital({
          name: 'INP',
          value: ev.duration,
          id: String(ev.interactionId),
        });
      }
    },
    { durationThreshold: 40 } as PerformanceObserverInit,
  );

  // First Input Delay
  observe('first-input', (entry) => {
    const fi = entry as PerformanceEventTiming;
    sendVital({
      name: 'FID',
      value: fi.processingStart - fi.startTime,
      id: fi.name,
    });
  });
}
