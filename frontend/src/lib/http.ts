const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5250').replace(/\/$/, '');

export const TOKEN_KEY = 'farmbid_access_token';

export class ApiError extends Error {
  constructor(message: string, public readonly status?: number) {
    super(message);
    this.name = 'ApiError';
  }
}

function messageFrom(body: unknown, fallback: string) {
  if (body && typeof body === 'object' && 'message' in body && typeof body.message === 'string') return body.message;
  if (body && typeof body === 'object' && 'errors' in body && body.errors && typeof body.errors === 'object') {
    const first = Object.values(body.errors as Record<string, unknown>)
      .flatMap(value => Array.isArray(value) ? value : [])
      .find((value): value is string => typeof value === 'string');
    if (first) return first;
  }
  if (body && typeof body === 'object' && 'title' in body && typeof body.title === 'string') return body.title;
  return fallback;
}

export async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem(TOKEN_KEY);
  const headers = new Headers(init.headers);
  headers.set('Accept', 'application/json');
  if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, { ...init, headers });
  } catch {
    throw new ApiError('Cannot reach the FarmBid API. Start the backend and try again.');
  }

  const body: unknown = response.status === 204 ? undefined : await response.json().catch(() => undefined);
  if (!response.ok) {
    if (response.status === 401) localStorage.removeItem(TOKEN_KEY);
    throw new ApiError(messageFrom(body, `Request failed (${response.status}).`), response.status);
  }
  // React queries subscribe to this event. Only broadcast after the server
  // confirms a state-changing request so the UI never displays fake updates.
  if (!['GET', 'HEAD', 'OPTIONS'].includes((init.method ?? 'GET').toUpperCase())) emitChange();
  return body as T;
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}
import { emitChange } from '../services/events';

