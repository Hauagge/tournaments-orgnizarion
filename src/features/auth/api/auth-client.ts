import { apiFetch } from '@/shared/api/fetch-client';
import { LoginPayload, LoginResult, normalizeLoginResponse } from '@/features/auth/types/auth';

function getLoginPath() {
  const value = process.env.NEXT_PUBLIC_AUTH_LOGIN_PATH;
  if (!value) {
    return '/auth/login';
  }

  return value.startsWith('/') ? value : `/${value}`;
}

export function login(payload: LoginPayload): Promise<LoginResult> {
  return apiFetch<unknown>(getLoginPath(), {
    method: 'POST',
    body: JSON.stringify(payload),
  }).then(normalizeLoginResponse);
}
