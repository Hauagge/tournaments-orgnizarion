export class ApiError extends Error {
  status: number;
  payload: unknown;
  code?: string;
  details?: unknown;

  constructor(
    message: string,
    status: number,
    payload?: unknown,
    options?: { code?: string; details?: unknown },
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.payload = payload;
    this.code = options?.code;
    this.details = options?.details;
  }
}

function getBaseUrl() {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  return baseUrl?.replace(/\/$/, '') ?? '';
}

async function parseBody(response: Response) {
  const contentType = response.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    return response.json();
  }

  const text = await response.text();
  return text || null;
}

export async function apiFetch<TResponse>(
  path: string,
  init?: RequestInit,
): Promise<TResponse> {
  const url = `${getBaseUrl()}${path.startsWith('/') ? path : `/${path}`}`;
  const isFormDataBody = init?.body instanceof FormData;

  const response = await fetch(url, {
    ...init,
    headers: {
      ...(isFormDataBody ? {} : { 'Content-Type': 'application/json' }),
      ...(init?.headers ?? {}),
    },
  });

  const payload = await parseBody(response);

  if (!response.ok) {
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
    const message =
      directMessage ??
      nestedMessage ??
      `Request failed with status ${response.status}`;

    const code =
      nestedError && typeof nestedError.code === 'string'
        ? nestedError.code
        : undefined;
    const details = nestedError ? nestedError.details : undefined;

    throw new ApiError(message, response.status, payload, { code, details });
  }

  return payload as TResponse;
}
