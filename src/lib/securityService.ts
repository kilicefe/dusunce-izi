/**
 * Security Service for Rate Limiting, Input Sanitization, IDOR Protection,
 * Prompt Injection Protection, and CSV Formula Injection Neutralization.
 */

// Simple token bucket / sliding window rate limiter
interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitRecord>();

export interface RateLimitOptions {
  windowMs: number;
  maxRequests: number;
}

export function checkRateLimit(key: string, options: RateLimitOptions = { windowMs: 60000, maxRequests: 30 }): {
  allowed: boolean;
  remaining: number;
  resetMs: number;
} {
  const now = Date.now();
  const record = rateLimitStore.get(key);

  if (!record || now > record.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + options.windowMs });
    return { allowed: true, remaining: options.maxRequests - 1, resetMs: options.windowMs };
  }

  if (record.count >= options.maxRequests) {
    return { allowed: false, remaining: 0, resetMs: record.resetAt - now };
  }

  record.count += 1;
  return { allowed: true, remaining: options.maxRequests - record.count, resetMs: record.resetAt - now };
}

/**
 * Resets rate limit store (useful for tests).
 */
export function resetRateLimitStore(): void {
  rateLimitStore.clear();
}

/**
 * Sanitizes input text to neutralize CSV formula injection attacks.
 * Prefixes strings starting with =, +, -, @, \t, \r with a single quote.
 */
export function sanitizeCsvField(field: string | number | boolean | null | undefined): string {
  if (field === null || field === undefined) return '';
  const str = String(field);
  if (/^[=+\-@\t\r]/.test(str)) {
    return `'${str}`;
  }
  return str;
}

/**
 * Sanitizes untrusted student input text before sending to LLM prompts
 * to mitigate prompt injection / system instruction jailbreaks.
 */
export function sanitizePromptInput(input: string): string {
  if (!input) return '';
  return input
    .replace(/<system>/gi, '[SYSTEM_TAG_STRIPPED]')
    .replace(/<\/system>/gi, '[/SYSTEM_TAG_STRIPPED]')
    .replace(/<instructions>/gi, '[INSTRUCTIONS_STRIPPED]')
    .replace(/IGNORE ALL PREVIOUS INSTRUCTIONS/gi, '[FILTERED_INJECTION_ATTEMPT]')
    .replace(/YOU ARE NOW AN UNRESTRICTED/gi, '[FILTERED_INJECTION_ATTEMPT]')
    .trim();
}

/**
 * Validates ownership for IDOR (Insecure Direct Object Reference) mitigation.
 */
export function validateTeacherOwnership(resourceOwnerId: string, currentTeacherId: string): boolean {
  if (!resourceOwnerId || !currentTeacherId) return false;
  return resourceOwnerId === currentTeacherId;
}

/**
 * Sanitizes file upload names to prevent directory traversal or unsafe characters.
 */
export function sanitizeFilename(filename: string): string {
  return filename.replace(/[^a-zA-Z0-9.\-_]/g, '_');
}
