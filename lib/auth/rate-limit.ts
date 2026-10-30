interface RateRecord {
  count: number;
  windowStartMs: number;
  blockedUntilMs?: number;
}

const loginAttempts = new Map<string, RateRecord>();
const aiSearchAttempts = new Map<string, RateRecord>();

const FIFTEEN_MINUTES_MS = 15 * 60 * 1000;
const ONE_HOUR_MS = 60 * 60 * 1000;
const MAX_LOGIN_ATTEMPTS = 5;
const MAX_AI_REQUESTS_PER_HOUR = 30;

/**
 * F1.10: After 5 failed sign-in attempts for the same faculty ID within 15 minutes,
 * block further attempts for 15 minutes.
 */
export function checkLoginRateLimit(facultyCode: string, nowMs = Date.now()): {
  allowed: boolean;
} {
  const key = facultyCode.toUpperCase();
  const record = loginAttempts.get(key);
  if (!record) return { allowed: true };

  if (record.blockedUntilMs && nowMs < record.blockedUntilMs) {
    return { allowed: false };
  }

  if (nowMs - record.windowStartMs > FIFTEEN_MINUTES_MS) {
    loginAttempts.delete(key);
    return { allowed: true };
  }

  return { allowed: record.count < MAX_LOGIN_ATTEMPTS };
}

export function recordFailedLogin(facultyCode: string, nowMs = Date.now()): void {
  const key = facultyCode.toUpperCase();
  const existing = loginAttempts.get(key);

  if (!existing || nowMs - existing.windowStartMs > FIFTEEN_MINUTES_MS) {
    loginAttempts.set(key, { count: 1, windowStartMs: nowMs });
    return;
  }

  const nextCount = existing.count + 1;
  const blockedUntilMs =
    nextCount >= MAX_LOGIN_ATTEMPTS ? nowMs + FIFTEEN_MINUTES_MS : undefined;

  loginAttempts.set(key, {
    count: nextCount,
    windowStartMs: existing.windowStartMs,
    blockedUntilMs,
  });
}

export function clearLoginRateLimit(facultyCode: string): void {
  loginAttempts.delete(facultyCode.toUpperCase());
}

/**
 * SEC7: Rate limit on AI search (30 requests per user per hour).
 */
export function consumeAiRateLimit(facultyId: string, nowMs = Date.now()): {
  allowed: boolean;
} {
  const existing = aiSearchAttempts.get(facultyId);
  if (!existing || nowMs - existing.windowStartMs > ONE_HOUR_MS) {
    aiSearchAttempts.set(facultyId, { count: 1, windowStartMs: nowMs });
    return { allowed: true };
  }

  if (existing.count >= MAX_AI_REQUESTS_PER_HOUR) {
    return { allowed: false };
  }

  existing.count += 1;
  return { allowed: true };
}

setInterval(() => {
  const now = Date.now();
  for (const [key, val] of loginAttempts.entries()) {
    if (now - val.windowStartMs > FIFTEEN_MINUTES_MS) loginAttempts.delete(key);
  }
  for (const [key, val] of aiSearchAttempts.entries()) {
    if (now - val.windowStartMs > ONE_HOUR_MS) aiSearchAttempts.delete(key);
  }
}, 15 * 60 * 1000);

