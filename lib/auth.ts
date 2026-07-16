import { createHmac, timingSafeEqual } from "node:crypto";

export const AUTH_COOKIE_NAME = "visionextract_session";
export const AUTH_SESSION_MAX_AGE_SECONDS = 24 * 60 * 60;
const TOKEN_VERSION = "v1";
const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 1_024;

export class AuthConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthConfigurationError";
  }
}

export function getAppPassword(env: NodeJS.ProcessEnv = process.env): string {
  const password = env.APP_PASSWORD;
  if (!password) {
    throw new AuthConfigurationError(
      "Access password is not configured. Set APP_PASSWORD on the server.",
    );
  }
  if (password.length < MIN_PASSWORD_LENGTH || password.length > MAX_PASSWORD_LENGTH) {
    throw new AuthConfigurationError(
      `APP_PASSWORD must be between ${MIN_PASSWORD_LENGTH} and ${MAX_PASSWORD_LENGTH} characters.`,
    );
  }
  return password;
}

function safeEqual(left: string, right: string): boolean {
  const leftDigest = createHmac("sha256", "visionextract-compare").update(left).digest();
  const rightDigest = createHmac("sha256", "visionextract-compare").update(right).digest();
  return timingSafeEqual(leftDigest, rightDigest);
}

export function isPasswordValid(candidate: unknown, password = getAppPassword()): boolean {
  return typeof candidate === "string" && safeEqual(candidate, password);
}

function sign(payload: string, password: string): string {
  return createHmac("sha256", password).update(payload).digest("base64url");
}

export function createSessionToken(
  password = getAppPassword(),
  now = Date.now(),
): string {
  const expiresAt = now + AUTH_SESSION_MAX_AGE_SECONDS * 1_000;
  const payload = `${TOKEN_VERSION}.${expiresAt}`;
  return `${payload}.${sign(payload, password)}`;
}

export function isSessionTokenValid(
  token: string | undefined,
  password = getAppPassword(),
  now = Date.now(),
): boolean {
  if (!token) return false;
  const [version, expiresText, signature, ...extra] = token.split(".");
  if (version !== TOKEN_VERSION || !expiresText || !signature || extra.length > 0) return false;

  const expiresAt = Number(expiresText);
  const latestAllowedExpiry = now + AUTH_SESSION_MAX_AGE_SECONDS * 1_000 + 60_000;
  if (!Number.isSafeInteger(expiresAt) || expiresAt <= now || expiresAt > latestAllowedExpiry) {
    return false;
  }

  const payload = `${version}.${expiresText}`;
  return safeEqual(signature, sign(payload, password));
}

function readCookie(cookieHeader: string | null, name: string): string | undefined {
  if (!cookieHeader) return undefined;
  for (const part of cookieHeader.split(";")) {
    const separator = part.indexOf("=");
    if (separator < 0) continue;
    const key = part.slice(0, separator).trim();
    if (key !== name) continue;
    const value = part.slice(separator + 1).trim();
    try {
      return decodeURIComponent(value);
    } catch {
      return undefined;
    }
  }
  return undefined;
}

export function isRequestAuthenticated(request: Request): boolean {
  try {
    const token = readCookie(request.headers.get("cookie"), AUTH_COOKIE_NAME);
    return isSessionTokenValid(token);
  } catch (error) {
    if (error instanceof AuthConfigurationError) return false;
    throw error;
  }
}
