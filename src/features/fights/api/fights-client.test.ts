import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  exportFightsByAreaPdf,
  updateFightOrder,
} from '@/features/fights/api/fights-client';
import { apiFetch } from '@/shared/api/fetch-client';
import { downloadBlob } from '@/shared/api/downloadBlob';

vi.mock('@/shared/api/fetch-client', () => ({
  apiFetch: vi.fn(),
}));

vi.mock('@/shared/api/downloadBlob', () => ({
  downloadBlob: vi.fn(),
}));

describe('exportFightsByAreaPdf', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('chama o endpoint correto com abertura em nova aba', async () => {
    vi.mocked(downloadBlob).mockResolvedValue({
      blob: new Blob(['pdf'], { type: 'application/pdf' }),
      filename: 'fights-by-area-comp-1.pdf',
    });

    await exportFightsByAreaPdf('comp-1');

    expect(downloadBlob).toHaveBeenCalledWith(
      '/competitions/comp-1/reports/pdf/fights-by-area',
      {
        method: 'GET',
      },
      {
        defaultFilename: 'fights-by-area-comp-1.pdf',
        disposition: 'open',
      },
    );
  });
});

describe('updateFightOrder', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('envia a lista normalizada de lutas com fightId e orderIndex', async () => {
    vi.mocked(apiFetch).mockResolvedValue({
      data: {
        competitionId: 1,
        totalUpdated: 2,
        items: [
          { fightId: 10, orderIndex: 1 },
          { fightId: 11, orderIndex: 2 },
        ],
      },
      error: null,
    });

    const response = await updateFightOrder('comp-1', {
      items: [
        { fightId: 10, orderIndex: 1 },
        { fightId: 11, orderIndex: 2 },
      ],
    });

    expect(apiFetch).toHaveBeenCalledWith(
      '/competitions/comp-1/fights/order',
      {
        method: 'PATCH',
        body: JSON.stringify({
          items: [
            { fightId: 10, orderIndex: 1 },
            { fightId: 11, orderIndex: 2 },
          ],
        }),
      },
    );
    expect(response.totalUpdated).toBe(2);
    expect(response.items).toEqual([
      { fightId: 10, orderIndex: 1 },
      { fightId: 11, orderIndex: 2 },
    ]);
  });
});
