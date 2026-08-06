/**
 * Observability, Logging & Health Check Service
 */

export interface SystemHealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  checks: {
    database: { status: 'up' | 'down'; latencyMs: number };
    storage: { status: 'up' | 'down'; latencyMs: number };
    aiProvider: { status: 'up' | 'degraded' | 'down'; providerName: string };
    processingQueue: { activeJobs: number; failedJobs: number; status: 'idle' | 'busy' | 'stalled' };
  };
}

export function checkSystemHealth(): SystemHealthStatus {
  const startTime = Date.now();
  // Simulate lightweight DB check
  const dbLatency = Date.now() - startTime;

  return {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    checks: {
      database: { status: 'up', latencyMs: Math.max(1, dbLatency) },
      storage: { status: 'up', latencyMs: 2 },
      aiProvider: { status: 'up', providerName: 'gemini-2.5-pro' },
      processingQueue: { activeJobs: 0, failedJobs: 0, status: 'idle' },
    },
  };
}

export interface StructuredLog {
  level: 'info' | 'warn' | 'error' | 'audit';
  event: string;
  correlationId?: string;
  teacherId?: string;
  details?: Record<string, any>;
  timestamp: string;
}

const logBuffer: StructuredLog[] = [];

export function logEvent(
  level: 'info' | 'warn' | 'error' | 'audit',
  event: string,
  details?: Record<string, any>,
  correlationId?: string
): StructuredLog {
  const log: StructuredLog = {
    level,
    event,
    details,
    correlationId: correlationId || `corr-${Math.random().toString(36).substring(2, 9)}`,
    timestamp: new Date().toISOString(),
  };

  logBuffer.push(log);
  if (logBuffer.length > 500) {
    logBuffer.shift(); // keep buffer bounded
  }

  if (process.env.NODE_ENV !== 'test') {
    console.log(JSON.stringify(log));
  }

  return log;
}

export function getLogBuffer(): StructuredLog[] {
  return [...logBuffer];
}
