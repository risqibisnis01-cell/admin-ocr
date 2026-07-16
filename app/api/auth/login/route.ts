import { NextResponse } from "next/server";
import {
  AUTH_COOKIE_NAME,
  AUTH_SESSION_MAX_AGE_SECONDS,
  AuthConfigurationError,
  createSessionToken,
  getAppPassword,
  isPasswordValid,
} from "@/lib/auth";
import {
  clearLoginFailures,
  getClientKey,
  isLoginBlocked,
  recordLoginFailure,
} from "@/lib/login-rate-limit";

export async function POST(request: Request) {
  const clientKey = getClientKey(request);
  if (isLoginBlocked(clientKey)) {
    return NextResponse.json(
      { error: "Too many failed attempts. Try again in 15 minutes." },
      { status: 429 },
    );
  }

  try {
    const contentType = request.headers.get("content-type") ?? "";
    if (!contentType.toLowerCase().includes("application/json")) {
      return NextResponse.json(
        { error: "Content-Type must be application/json." },
        { status: 415 },
      );
    }

    const body = (await request.json()) as { password?: unknown };
    const configuredPassword = getAppPassword();
    if (!isPasswordValid(body.password, configuredPassword)) {
      recordLoginFailure(clientKey);
      return NextResponse.json(
        { error: "Incorrect password." },
        { status: 401 },
      );
    }

    clearLoginFailures(clientKey);
    const response = NextResponse.json({ authenticated: true });
    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: createSessionToken(configuredPassword),
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: AUTH_SESSION_MAX_AGE_SECONDS,
      priority: "high",
    });
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: "Request body contains invalid JSON." },
        { status: 400 },
      );
    }
    if (error instanceof AuthConfigurationError) {
      console.error(`[Auth] ${error.message}`);
      return NextResponse.json({ error: error.message }, { status: 503 });
    }
    console.error("[Auth] Unexpected login error");
    return NextResponse.json(
      { error: "Login failed unexpectedly." },
      { status: 500 },
    );
  }
}
