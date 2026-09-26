// Small helpers shared by the API routes (Web Request/Response style).
import { SESSION_COOKIE, SESSION_DAYS } from './security.js';

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...headers },
  });
}

// Wraps a route so thrown HttpErrors become JSON replies and anything
// unexpected is logged and hidden from the browser.
export function route(fn) {
  return async request => {
    try {
      return await fn(request);
    } catch (err) {
      if (err instanceof HttpError) return json({ ok: false, message: err.message }, err.status);
      console.error(err);
      return json({ ok: false, message: 'Something went wrong on the server. Please try again.' }, 500);
    }
  };
}

// Reads a JSON body from a same-site POST. Requiring JSON plus a matching
// Origin blocks other websites from submitting forms on a student's behalf.
export async function readJson(request, maxBytes = 20000) {
  const origin = request.headers.get('origin');
  if (origin && new URL(origin).host !== new URL(request.url).host) {
    throw new HttpError(403, 'Cross-site requests are not allowed.');
  }
  if (!(request.headers.get('content-type') || '').includes('application/json')) {
    throw new HttpError(415, 'Expected a JSON request.');
  }
  const text = await request.text();
  if (text.length > maxBytes) throw new HttpError(413, 'Request is too large.');
  try {
    const body = JSON.parse(text);
    if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error();
    return body;
  } catch {
    throw new HttpError(400, 'Request body is not valid JSON.');
  }
}

export function getCookie(request, name) {
  const header = request.headers.get('cookie') || '';
  for (const part of header.split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k === name) return decodeURIComponent(v.join('='));
  }
  return null;
}

function isLocal(request) {
  return ['localhost', '127.0.0.1', '[::1]'].includes(new URL(request.url).hostname);
}

export function sessionCookie(request, token) {
  const secure = isLocal(request) ? '' : '; Secure';
  return `${SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_DAYS * 86400}${secure}`;
}

export function clearSessionCookie(request) {
  const secure = isLocal(request) ? '' : '; Secure';
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`;
}
