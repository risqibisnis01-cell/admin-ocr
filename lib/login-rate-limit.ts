const MAX_FAILURES = 5;
const WINDOW_MS = 15 * 60 * 1_000;
const MAX_TRACKED_CLIENTS = 1_000;

interface AttemptRecord {
  failures: number;
  resetAt: number;
}

const attempts = new Map<string, AttemptRecord>();

export function getClientKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || request.headers.get("x-real-ip")?.trim() || "unknown";
}

export function isLoginBlocked(key: string, now = Date.now()): boolean {
  const record = attempts.get(key);
  if (!record) return false;
  if (record.resetAt <= now) {
    attempts.delete(key);
    return false;
  }
  return record.failures >= MAX_FAILURES;
}

export function recordLoginFailure(key: string, now = Date.now()): void {
  if (attempts.size >= MAX_TRACKED_CLIENTS && !attempts.has(key)) {
    const firstKey = attempts.keys().next().value;
    if (typeof firstKey === "string") attempts.delete(firstKey);
  }

  const current = attempts.get(key);
  if (!current || current.resetAt <= now) {
    attempts.set(key, { failures: 1, resetAt: now + WINDOW_MS });
    return;
  }
  current.failures += 1;
}

export function clearLoginFailures(key: string): void {
  attempts.delete(key);
}
