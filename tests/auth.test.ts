import { afterEach, describe, expect, it } from "vitest";
import {
  AUTH_COOKIE_NAME,
  AUTH_SESSION_MAX_AGE_SECONDS,
  AuthConfigurationError,
  createSessionToken,
  getAppPassword,
  isPasswordValid,
  isRequestAuthenticated,
  isSessionTokenValid,
} from "@/lib/auth";
import {
  clearLoginFailures,
  isLoginBlocked,
  recordLoginFailure,
} from "@/lib/login-rate-limit";
import { POST as login } from "@/app/api/auth/login/route";
import { POST as aiStructure } from "@/app/api/ai-structure/route";

const originalPassword = process.env.APP_PASSWORD;

afterEach(() => {
  if (originalPassword === undefined) delete process.env.APP_PASSWORD;
  else process.env.APP_PASSWORD = originalPassword;
});

describe("password configuration", () => {
  it("requires a server password of at least eight characters", () => {
    expect(() => getAppPassword({})).toThrow(AuthConfigurationError);
    expect(() => getAppPassword({ APP_PASSWORD: "short" })).toThrow("between 8 and 1024");
    expect(getAppPassword({ APP_PASSWORD: "valid-password" })).toBe("valid-password");
  });

  it("compares submitted passwords without accepting non-string values", () => {
    expect(isPasswordValid("valid-password", "valid-password")).toBe(true);
    expect(isPasswordValid("wrong-password", "valid-password")).toBe(false);
    expect(isPasswordValid(null, "valid-password")).toBe(false);
  });
});

describe("signed sessions", () => {
  const password = "valid-password";
  const now = 1_750_000_000_000;

  it("accepts valid cookies and rejects tampered or expired cookies", () => {
    const token = createSessionToken(password, now);
    expect(isSessionTokenValid(token, password, now + 1_000)).toBe(true);
    expect(isSessionTokenValid(`${token}tampered`, password, now + 1_000)).toBe(false);
    expect(
      isSessionTokenValid(
        token,
        password,
        now + AUTH_SESSION_MAX_AGE_SECONDS * 1_000 + 1,
      ),
    ).toBe(false);
  });

  it("authenticates requests from the HTTP-only cookie value", () => {
    process.env.APP_PASSWORD = password;
    const token = createSessionToken(password);
    const request = new Request("http://localhost/api/ai-structure", {
      headers: { Cookie: `${AUTH_COOKIE_NAME}=${encodeURIComponent(token)}` },
    });
    expect(isRequestAuthenticated(request)).toBe(true);
  });
});

describe("login endpoint", () => {
  it("sets a secure session cookie after the correct password", async () => {
    process.env.APP_PASSWORD = "valid-password";
    const response = await login(
      new Request("http://localhost/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Forwarded-For": "login-success-test",
        },
        body: JSON.stringify({ password: "valid-password" }),
      }),
    );

    expect(response.status).toBe(200);
    const setCookie = response.headers.get("set-cookie") ?? "";
    expect(setCookie).toContain(`${AUTH_COOKIE_NAME}=`);
    expect(setCookie.toLowerCase()).toContain("httponly");
    expect(setCookie.toLowerCase()).toContain("samesite=strict");
  });

  it("rejects an incorrect password without setting a cookie", async () => {
    process.env.APP_PASSWORD = "valid-password";
    const response = await login(
      new Request("http://localhost/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Forwarded-For": "login-failure-test",
        },
        body: JSON.stringify({ password: "wrong-password" }),
      }),
    );

    expect(response.status).toBe(401);
    expect(response.headers.get("set-cookie")).toBeNull();
  });

  it("rejects direct access to a protected AI endpoint", async () => {
    process.env.APP_PASSWORD = "valid-password";
    const response = await aiStructure(
      new Request("http://localhost/api/ai-structure", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      }),
    );
    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Authentication required." });
  });
});

describe("login throttling", () => {
  it("blocks a client after five failures and clears on success", () => {
    const key = "rate-limit-test";
    clearLoginFailures(key);
    for (let attempt = 0; attempt < 5; attempt += 1) recordLoginFailure(key, 1_000);
    expect(isLoginBlocked(key, 2_000)).toBe(true);
    clearLoginFailures(key);
    expect(isLoginBlocked(key, 2_000)).toBe(false);
  });
});
