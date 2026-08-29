import { db } from '../db';

export interface TelemetryEvent {
  id: string;
  timestamp: string;
  type: 'error' | 'click' | 'warning' | 'diagnostic';
  source: string;
  message: string;
  details?: any;
}

const TELEMETRY_STORAGE_KEY = 'clickopticx_telemetry_logs';

class TelemetryLogger {
  private logs: TelemetryEvent[] = [];

  constructor() {
    try {
      const stored = localStorage.getItem(TELEMETRY_STORAGE_KEY);
      if (stored) {
        this.logs = JSON.parse(stored);
      }
    } catch (e) {
      console.warn('[Telemetry] Failed to load logs from localStorage:', e);
    }
  }

  log(type: TelemetryEvent['type'], source: string, message: string, details?: any) {
    const event: TelemetryEvent = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      type,
      source,
      message,
      details: details ? (typeof details === 'object' ? JSON.stringify(details) : details) : undefined
    };

    console.log(`[Telemetry - ${type.toUpperCase()}] [${source}] ${message}`, details || '');

    this.logs.unshift(event);
    if (this.logs.length > 500) {
      this.logs = this.logs.slice(0, 500);
    }

    try {
      localStorage.setItem(TELEMETRY_STORAGE_KEY, JSON.stringify(this.logs));
    } catch (e) {
      // ignore
    }

    // Try to sync with backend auditLogs
    try {
      db.logAudit({
        action: `Telemetry: [${type.toUpperCase()}] ${message}`,
        userId: 'system',
        userName: 'System Telemetry',
        details: `Source: ${source}${details ? ` | Details: ${JSON.stringify(details)}` : ''}`,
        type: 'system'
      }).catch(err => console.warn('[Telemetry] DB sync failed:', err));
    } catch (err) {
      console.warn('[Telemetry] DB sync exception:', err);
    }
  }

  getLogs(): TelemetryEvent[] {
    return this.logs;
  }

  clearLogs() {
    this.logs = [];
    try {
      localStorage.removeItem(TELEMETRY_STORAGE_KEY);
    } catch {}
  }
}

export const telemetry = new TelemetryLogger();
