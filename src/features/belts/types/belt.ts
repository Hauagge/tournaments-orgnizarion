export type BeltsResponse =
  | string[]
  | {
      data?: string[];
      error?: unknown;
    };

export function normalizeBeltsResponse(response: BeltsResponse): string[] {
  const items = Array.isArray(response)
    ? response
    : Array.isArray(response?.data)
      ? response.data
      : [];

  return items
    .filter((belt): belt is string => typeof belt === 'string' && belt.trim().length > 0)
    .map((belt) => belt.trim());
}
