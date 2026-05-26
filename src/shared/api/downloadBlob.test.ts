import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AUTH_TOKEN_STORAGE_KEY } from '@/features/auth/stores/useAuthStore';
import { downloadBlob } from '@/shared/api/downloadBlob';

describe('downloadBlob', () => {
  const originalFetch = global.fetch;
  const originalCreateObjectURL = URL.createObjectURL;
  const originalRevokeObjectURL = URL.revokeObjectURL;
  const createObjectUrlSpy = vi.fn();
  const revokeObjectUrlSpy = vi.fn();
  const windowOpenSpy = vi.spyOn(window, 'open');

  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, 'token-123');
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      writable: true,
      value: createObjectUrlSpy,
    });
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      writable: true,
      value: revokeObjectUrlSpy,
    });
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    localStorage.clear();
    global.fetch = originalFetch;
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      writable: true,
      value: originalCreateObjectURL,
    });
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      writable: true,
      value: originalRevokeObjectURL,
    });
  });

  it('abre o blob em nova aba, cria a URL e revoga após uso', async () => {
    const blob = new Blob(['pdf'], { type: 'application/pdf' });

    createObjectUrlSpy.mockReturnValue('blob:pdf-url');
    windowOpenSpy.mockReturnValue({} as Window);
    global.fetch = vi.fn().mockResolvedValue(
      new Response(blob, {
        status: 200,
        headers: {
          'content-type': 'application/pdf',
          'content-disposition': 'attachment; filename="fights.pdf"',
        },
      }),
    ) as typeof fetch;

    const result = await downloadBlob(
      '/competitions/comp-1/reports/fights-by-area/pdf',
      { method: 'GET' },
      { disposition: 'open' },
    );

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/competitions/comp-1/reports/fights-by-area/pdf'),
      expect.objectContaining({
        method: 'GET',
        headers: expect.any(Headers),
      }),
    );

    const headers = (vi.mocked(global.fetch).mock.calls[0]?.[1] as RequestInit)
      .headers as Headers;
    expect(headers.get('Authorization')).toBe('Bearer token-123');
    expect(createObjectUrlSpy).toHaveBeenCalledTimes(1);
    expect(createObjectUrlSpy.mock.calls[0]?.[0]).toMatchObject({
      type: 'application/pdf',
      size: 13,
    });
    expect(windowOpenSpy).toHaveBeenCalledWith(
      'blob:pdf-url',
      '_blank',
      'noopener,noreferrer',
    );

    vi.runAllTimers();
    expect(revokeObjectUrlSpy).toHaveBeenCalledWith('blob:pdf-url');
    expect(result.filename).toBe('fights.pdf');
  });

  it('expõe a mensagem específica retornada pela API', async () => {
    global.fetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          message: 'Nenhuma luta encontrada para esta competição.',
        }),
        {
          status: 404,
          headers: {
            'content-type': 'application/json',
          },
        },
      ),
    ) as typeof fetch;

    await expect(
      downloadBlob('/competitions/comp-1/reports/fights-by-area/pdf', {
        method: 'GET',
      }),
    ).rejects.toThrow('Nenhuma luta encontrada para esta competição.');
  });
});
