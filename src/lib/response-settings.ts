import type { Endpoint } from '@/db';
import type { ResponseSettings } from '@/types';

export const DEFAULT_RESPONSE_SETTINGS: ResponseSettings = {
  status: 200,
  contentType: 'application/json',
  headers: {},
  body: null,
};

// Statuses that must not carry a response body
const NULL_BODY_STATUSES = new Set([101, 204, 205, 304]);

export function toResponseSettings(endpoint: Endpoint): ResponseSettings {
  let headers: Record<string, string> = {};
  try {
    headers = JSON.parse(endpoint.responseHeaders || '{}');
  } catch {
    headers = {};
  }
  return {
    status: endpoint.responseStatus ?? DEFAULT_RESPONSE_SETTINGS.status,
    contentType: endpoint.responseContentType || DEFAULT_RESPONSE_SETTINGS.contentType,
    headers,
    body: endpoint.responseBody ?? null,
  };
}

// Validate an untrusted settings payload; returns an error message or the parsed settings
export function parseResponseSettings(input: unknown): ResponseSettings | string {
  if (!input || typeof input !== 'object') return 'Invalid settings payload';
  const data = input as Record<string, unknown>;

  const status = Number(data.status);
  if (!Number.isInteger(status) || status < 200 || status > 599) {
    return 'Status must be an integer between 200 and 599';
  }

  const contentType = typeof data.contentType === 'string' ? data.contentType.trim() : '';
  if (!contentType) return 'Content-Type is required';

  const headers: Record<string, string> = {};
  if (data.headers !== undefined) {
    if (!data.headers || typeof data.headers !== 'object' || Array.isArray(data.headers)) {
      return 'Headers must be an object of string values';
    }
    for (const [key, value] of Object.entries(data.headers)) {
      const name = key.trim();
      if (!name) continue;
      if (!/^[!#$%&'*+.^_`|~0-9A-Za-z-]+$/.test(name)) return `Invalid header name: ${name}`;
      if (typeof value !== 'string') return `Header ${name} must be a string`;
      headers[name] = value;
    }
  }

  const body = data.body === null || data.body === undefined ? null : String(data.body);

  return { status, contentType, headers, body };
}

export function buildWebhookResponse(
  settings: ResponseSettings,
  requestId: string,
  method: string,
  corsHeaders: Record<string, string>
): Response {
  const headers = new Headers(corsHeaders);
  let body: string | null;

  if (settings.body === null) {
    headers.set('Content-Type', 'application/json');
    body = JSON.stringify({ success: true, message: 'Request captured by Hooky', requestId });
  } else {
    headers.set('Content-Type', settings.contentType);
    body = settings.body.replaceAll('{{requestId}}', requestId);
  }

  for (const [key, value] of Object.entries(settings.headers)) {
    headers.set(key, value);
  }

  if (NULL_BODY_STATUSES.has(settings.status) || method === 'HEAD') {
    body = null;
  }

  return new Response(body, { status: settings.status, headers });
}
