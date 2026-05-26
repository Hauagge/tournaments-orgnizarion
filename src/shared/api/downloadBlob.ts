import { ApiError } from '@/shared/api/fetch-client';
import { AUTH_TOKEN_STORAGE_KEY } from '@/features/auth/stores/useAuthStore';

function getBaseUrl() {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  return baseUrl?.replace(/\/$/, '') ?? '';
}

function extractFilename(contentDisposition: string | null) {
  if (!contentDisposition) {
    return null;
  }

  const utfMatch = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utfMatch?.[1]) {
    return decodeURIComponent(utfMatch[1]);
  }

  const plainMatch = contentDisposition.match(/filename="?([^"]+)"?/i);
  if (plainMatch?.[1]) {
    return plainMatch[1];
  }

  return null;
}

function getAuthToken() {
  if (typeof window === 'undefined') {
    return null;
  }

  const token = localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
  return token && token.trim().length > 0 ? token : null;
}

async function parseErrorPayload(response: Response) {
  const contentType = response.headers.get('content-type') ?? '';

  if (contentType.includes('application/json')) {
    return response.json();
  }

  const text = await response.text();
  return text || null;
}

export async function downloadBlob(
  path: string,
  init?: RequestInit,
  options?: {
    defaultFilename?: string;
    disposition?: 'download' | 'open';
  },
) {
  const url = `${getBaseUrl()}${path.startsWith('/') ? path : `/${path}`}`;
  const token = getAuthToken();
  const headers = new Headers(init?.headers);

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(url, {
    ...init,
    headers,
  });

  if (!response.ok) {
    const payload = await parseErrorPayload(response);
    const payloadRecord =
      typeof payload === 'object' && payload !== null
        ? (payload as Record<string, unknown>)
        : null;
    const nestedError =
      payloadRecord &&
      typeof payloadRecord.error === 'object' &&
      payloadRecord.error !== null
        ? (payloadRecord.error as Record<string, unknown>)
        : null;
    const directMessage =
      payloadRecord && typeof payloadRecord.message === 'string'
        ? payloadRecord.message
        : null;
    const nestedMessage =
      nestedError && typeof nestedError.message === 'string'
        ? nestedError.message
        : null;

    throw new ApiError(
      directMessage ??
        nestedMessage ??
        `Request failed with status ${response.status}`,
      response.status,
      payload,
      {
        code:
          nestedError && typeof nestedError.code === 'string'
            ? nestedError.code
            : undefined,
        details: nestedError ? nestedError.details : undefined,
      },
    );
  }

  const blob = await response.blob();
  const filename =
    extractFilename(response.headers.get('content-disposition')) ??
    options?.defaultFilename ??
    'download.pdf';
  const blobUrl = URL.createObjectURL(blob);
  const disposition = options?.disposition ?? 'download';

  if (disposition === 'open') {
    const openedWindow = window.open(blobUrl, '_blank', 'noopener,noreferrer');

    if (!openedWindow) {
      const anchor = document.createElement('a');
      anchor.href = blobUrl;
      anchor.download = filename;
      anchor.style.display = 'none';
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
    }
  } else {
    const anchor = document.createElement('a');

    anchor.href = blobUrl;
    anchor.download = filename;
    anchor.style.display = 'none';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  }

  window.setTimeout(() => {
    URL.revokeObjectURL(blobUrl);
  }, 0);

  return { blob, filename };
}
