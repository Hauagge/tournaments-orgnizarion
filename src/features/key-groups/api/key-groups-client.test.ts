import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createKeyGroupFight } from '@/features/key-groups/api/key-groups-client';
import { apiFetch } from '@/shared/api/fetch-client';

vi.mock('@/shared/api/fetch-client', () => ({
  apiFetch: vi.fn(),
}));

describe('createKeyGroupFight', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('envia a requisição para o endpoint correto com athleteAId e athleteBId', async () => {
    vi.mocked(apiFetch).mockResolvedValue({
      success: true,
    });

    await createKeyGroupFight('group-1', {
      athleteAId: 101,
      athleteBId: 102,
    });

    expect(apiFetch).toHaveBeenCalledWith('/key-groups/group-1/fights', {
      method: 'POST',
      body: JSON.stringify({
        athleteAId: 101,
        athleteBId: 102,
      }),
    });
  });
});
