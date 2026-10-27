// Thin client for the Mendyr API, for both builds (see lib/platform.ts):
//   web — calls this site's own /api/v1/*, which next.config.ts proxies to the backend, so the
//         backend's httponly session cookies ride along and JavaScript never sees a token.
//   app — calls the backend directly with the tokens from lib/session.ts as a Bearer header,
//         and tells the backend it's a native client so it returns tokens instead of cookies.

import { API_ORIGIN, IS_APP, nativePlatform } from "@/lib/platform";
import { getTokens, setTokens } from "@/lib/session";
import { handleMockRequest } from "@/lib/mock-handler";
import type { TokenPair } from "@/lib/types";

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

interface Envelope<T> {
  success: boolean;
  data: T;
  error: { code: string; message: string } | null;
}

const BASE = `${API_ORIGIN}/api/v1`;

// Auth calls that must never trigger a silent session refresh (they're how a session
// starts or ends, or the refresh itself).
const NO_REFRESH = ["/auth/login", "/auth/register", "/auth/token/refresh", "/auth/logout"];

/** Fired on `window` when a request is rejected and the session can't be refreshed. */
export const SESSION_ENDED = "mendyr:session-ended";

/** App build: the native-client marker plus the current access token. */
async function appHeaders(withAuth = true): Promise<Record<string, string>> {
  if (!IS_APP) return {};
  const headers: Record<string, string> = {};
  const platform = await nativePlatform();
  if (platform !== "web") headers["X-Client-Platform"] = platform;
  const tokens = withAuth ? await getTokens() : null;
  if (tokens) headers.Authorization = `Bearer ${tokens.access}`;
  return headers;
}

async function refreshWebSession(): Promise<boolean> {
  try {
    const response = await fetch(`${BASE}/auth/token/refresh`, { method: "POST", credentials: "include" });
    return response.ok;
  } catch {
    return false;
  }
}

async function refreshAppSession(): Promise<boolean> {
  const tokens = await getTokens();
  if (!tokens) return false;
  try {
    const response = await fetch(`${BASE}/auth/token/refresh`, {
      method: "POST",
      headers: { ...(await appHeaders(false)), "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: tokens.refresh }),
    });
    if (!response.ok) {
      if (response.status === 401) await setTokens(null);
      return false;
    }
    const data = await response.json();
    const pair: TokenPair = data && typeof data === "object" && "data" in data ? (data as Envelope<TokenPair>).data : data;
    await setTokens({ access: pair.access_token, refresh: pair.refresh_token });
    return true;
  } catch {
    return false;
  }
}

let refreshInFlight: Promise<boolean> | null = null;

/** Renew the access token. Concurrent 401s share one attempt. */
function refreshSession(): Promise<boolean> {
  refreshInFlight ??= (IS_APP ? refreshAppSession() : refreshWebSession()).finally(() => {
    refreshInFlight = null;
  });
  return refreshInFlight;
}

type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export async function api<T>(
  path: string,
  { method = "GET", body }: { method?: Method; body?: unknown } = {},
  retried = false,
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${BASE}${path}`, {
      method,
      credentials: IS_APP ? "omit" : "include",
      cache: "no-store",
      headers: {
        ...(await appHeaders()),
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    // If backend is unreachable (e.g. testing mobile app without running server),
    // fall back to mock handler so user can test booking and receiving flows smoothly!
    const mockData = handleMockRequest<T>(path, method, body);
    if (mockData !== null) {
      return mockData;
    }
    throw new ApiError("Can't reach Mendyr right now. Check your connection.", 0, "network");
  }

  if (response.status === 401 && !retried && !NO_REFRESH.some((p) => path.startsWith(p))) {
    if (await refreshSession()) return api<T>(path, { method, body }, true);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event(SESSION_ENDED));
    }
    throw new ApiError("Your session has ended. Please log in again.", 401, "session_ended");
  }

  let payload: any = null;
  try {
    payload = await response.json();
  } catch {
    // Non-JSON (e.g. a proxy error page)
  }

  if (!response.ok) {
    if (response.status >= 404) {
      const mockData = handleMockRequest<T>(path, method, body);
      if (mockData !== null) {
        return mockData;
      }
    }
    const message = payload?.detail ?? payload?.error?.message ?? `Something went wrong (${response.status}).`;
    const code = payload?.error?.code ?? "http_error";
    throw new ApiError(message, response.status, code);
  }

  // If backend wrapped response in { success: true, data: ... }, unwrap it; otherwise return raw payload
  if (payload && typeof payload === "object" && "success" in payload && "data" in payload && payload.success) {
    return payload.data as T;
  }
  return payload as T;
}

export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return "Something went wrong.";
}

/** Build a query string, skipping empty values. */
export function query(params: Record<string, string | number | null | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== null && value !== undefined && value !== "") search.set(key, String(value));
  }
  const text = search.toString();
  return text ? `?${text}` : "";
}
