'use client';

function decodeJwtPayload(token: string) {
  const [, payload] = token.split('.');

  if (!payload) {
    return null;
  }

  try {
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(
      normalized.length + ((4 - (normalized.length % 4)) % 4),
      '=',
    );
    const decoded = window.atob(padded);
    return JSON.parse(decoded) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function readRole(payload: Record<string, unknown> | null) {
  if (!payload) {
    return null;
  }

  const candidates = [
    payload.role,
    payload.profile,
    payload.type,
    payload.userRole,
    payload.user_type,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim()) {
      return candidate.trim().toUpperCase();
    }
  }

  return null;
}

export function readTokenRole(token: string | null) {
  if (!token || typeof window === 'undefined') {
    return null;
  }

  return readRole(decodeJwtPayload(token));
}

