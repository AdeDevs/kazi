// Thin fetch wrapper around the KaziHub backend: attaches the bearer token, refreshes it
// once on a 401 and retries, and normalizes error bodies into a single ApiError shape.

export const API_BASE_URL: string =
  (import.meta as any).env?.VITE_API_BASE_URL || 'https://kazihub-52ph.onrender.com/api/v1';

const ACCESS_TOKEN_KEY = 'kazihub_access_token';
const REFRESH_TOKEN_KEY = 'kazihub_refresh_token';

export function getAccessToken(): string | null {
  try {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function getRefreshToken(): string | null {
  try {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setTokens(accessToken: string, refreshToken: string): void {
  try {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  } catch (e) {
    console.warn('Unable to persist auth tokens', e);
  }
}

export function clearTokens(): void {
  try {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  } catch (e) {
    console.warn('Unable to clear auth tokens', e);
  }
}

// AuthContext registers a listener here on mount so it can clear its own `user`/`token` React
// state (and trigger App.tsx's `!user` redirect to the Auth screen) whenever this module decides
// a session is dead -- this module has no access to React state on its own, and without this hook
// a mid-session token expiry left the UI believing it was still logged in (see the one call site
// below) while every subsequent request kept 401ing, instead of bouncing back to sign-in.
let onSessionExpired: (() => void) | null = null;
export function setOnSessionExpired(callback: (() => void) | null): void {
  onSessionExpired = callback;
}

export interface ValidationErrorDetail {
  loc: (string | number)[];
  msg: string;
  type: string;
}

export class ApiError extends Error {
  status: number;
  details?: ValidationErrorDetail[];

  constructor(message: string, status: number, details?: ValidationErrorDetail[]) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

async function parseErrorBody(response: Response): Promise<ApiError> {
  let body: any = null;
  try {
    body = await response.json();
  } catch {
    // No JSON body (e.g. a plain-text or empty error response) -- fall through to the status text.
  }

  const detail = body?.detail;
  if (Array.isArray(detail)) {
    // FastAPI validation error: an array of {loc, msg, type} entries.
    const message = detail.map((d: ValidationErrorDetail) => d.msg).join(' ');
    return new ApiError(message || 'Request validation failed.', response.status, detail);
  }
  if (typeof detail === 'string') {
    return new ApiError(detail, response.status);
  }
  return new ApiError(response.statusText || `Request failed with status ${response.status}`, response.status);
}

type RequestBody =
  | { kind: 'json'; data: unknown }
  | { kind: 'form'; data: Record<string, string | undefined | null> }
  | { kind: 'multipart'; data: FormData };

interface RequestOptions {
  method?: string;
  body?: RequestBody;
  auth?: boolean; // attach the Authorization header (default true)
  signal?: AbortSignal;
  headers?: Record<string, string>;
}

let refreshInFlight: Promise<boolean> | null = null;

/** Exchanges the stored refresh token for a new token pair. Returns false if there is none, or it's invalid. */
async function tryRefreshTokens(): Promise<boolean> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;

  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh_token: refreshToken }),
        });
        if (!response.ok) {
          clearTokens();
          onSessionExpired?.();
          return false;
        }
        const pair = await response.json();
        setTokens(pair.access_token, pair.refresh_token);
        return true;
      } catch {
        return false;
      } finally {
        refreshInFlight = null;
      }
    })();
  }
  return refreshInFlight;
}

function buildRequestInit(body: RequestBody | undefined, accessToken: string | null, auth: boolean): RequestInit {
  const headers: Record<string, string> = {};
  if (auth && accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  if (!body) {
    return { headers };
  }

  if (body.kind === 'json') {
    headers['Content-Type'] = 'application/json';
    return { headers, body: JSON.stringify(body.data) };
  }

  if (body.kind === 'form') {
    headers['Content-Type'] = 'application/x-www-form-urlencoded';
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(body.data)) {
      if (value !== undefined && value !== null) params.set(key, value);
    }
    return { headers, body: params.toString() };
  }

  // multipart: let the browser set the Content-Type (with boundary) itself.
  return { headers, body: body.data };
}

/**
 * Core request function. On a 401 (and only when `auth` is true and a refresh token exists),
 * attempts one silent token refresh and retries the request exactly once before giving up.
 */
export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, auth = true, signal, headers: extraHeaders } = options;
  const url = `${API_BASE_URL}${path}`;

  const doFetch = () => {
    const accessToken = auth ? getAccessToken() : null;
    const init = buildRequestInit(body, accessToken, auth);
    // The same headers go on the retry after a token refresh, so an Idempotency-Key stays stable.
    const headers = { ...(init.headers as Record<string, string>), ...(extraHeaders || {}) };
    return fetch(url, { method, signal, ...init, headers });
  };

  let response = await doFetch();

  if (response.status === 401 && auth && getRefreshToken()) {
    const refreshed = await tryRefreshTokens();
    if (refreshed) {
      response = await doFetch();
    }
  }

  if (!response.ok) {
    throw await parseErrorBody(response);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();
  if (!text) return undefined as T;
  return JSON.parse(text) as T;
}

export const apiGet = <T>(path: string, options?: Omit<RequestOptions, 'method' | 'body'>) =>
  apiRequest<T>(path, { ...options, method: 'GET' });

export const apiPost = <T>(path: string, data?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) =>
  apiRequest<T>(path, { ...options, method: 'POST', body: data !== undefined ? { kind: 'json', data } : undefined });

export const apiPut = <T>(path: string, data?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) =>
  apiRequest<T>(path, { ...options, method: 'PUT', body: data !== undefined ? { kind: 'json', data } : undefined });

export const apiPatch = <T>(path: string, data?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) =>
  apiRequest<T>(path, { ...options, method: 'PATCH', body: data !== undefined ? { kind: 'json', data } : undefined });

export const apiDelete = <T>(path: string, options?: Omit<RequestOptions, 'method' | 'body'>) =>
  apiRequest<T>(path, { ...options, method: 'DELETE' });

export const apiPostForm = <T>(path: string, data: Record<string, string | undefined | null>) =>
  apiRequest<T>(path, { method: 'POST', body: { kind: 'form', data }, auth: false });

export const apiPostMultipart = <T>(path: string, data: FormData) =>
  apiRequest<T>(path, { method: 'POST', body: { kind: 'multipart', data } });
