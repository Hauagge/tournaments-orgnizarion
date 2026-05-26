import React, { ReactNode } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DistributeAthletesButton } from '@/features/categories/components/distribute-athletes-button';
import { ToastProvider, Toaster } from '@/shared/ui/use-toast';

const mockMutation = vi.fn();

vi.mock('@/features/categories/hooks/use-categories', () => ({
  useDistributeAthletesInCategories: () => ({
    isPending: false,
    mutateAsync: mockMutation,
  }),
}));

function renderWithProviders(node: ReactNode) {
  return render(
    <ToastProvider>
      {node}
      <Toaster />
    </ToastProvider>,
  );
}

function deferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;

  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
}

describe('DistributeAthletesButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renderiza o botão corretamente', () => {
    renderWithProviders(
      <DistributeAthletesButton competitionId="comp-1" />,
    );

    expect(
      screen.getByRole('button', {
        name: /distribuir atletas nas categorias/i,
      }),
    ).toBeInTheDocument();
  });

  it('abre confirmação antes de executar a distribuição', async () => {
    const user = userEvent.setup();
    mockMutation.mockResolvedValue({
      success: true,
      competitionId: 'comp-1',
      allocated: [],
      notAllocated: [],
      summary: {
        totalAthletes: 20,
        allocatedCount: 20,
        notAllocatedCount: 0,
      },
    });

    renderWithProviders(
      <DistributeAthletesButton competitionId="comp-1" />,
    );

    await user.click(
      screen.getByRole('button', {
        name: /distribuir atletas nas categorias/i,
      }),
    );

    expect(mockMutation).not.toHaveBeenCalled();
    expect(
      screen.getByText(/esta ação irá distribuir automaticamente os atletas/i),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole('button', {
        name: /confirmar distribuição/i,
      }),
    );

    expect(mockMutation).toHaveBeenCalledWith(false);
  });

  it('desabilita o botão durante o loading e evita múltiplas requisições', async () => {
    const user = userEvent.setup();
    const request = deferred<{
      success: boolean;
      competitionId: string;
      allocated: [];
      notAllocated: [];
      summary: {
        totalAthletes: number;
        allocatedCount: number;
        notAllocatedCount: number;
      };
    }>();
    mockMutation.mockReturnValue(request.promise);

    renderWithProviders(
      <DistributeAthletesButton competitionId="comp-1" />,
    );

    await user.click(
      screen.getByRole('button', {
        name: /distribuir atletas nas categorias/i,
      }),
    );

    const confirmButton = screen.getByRole('button', {
      name: /confirmar distribuição/i,
    });
    await user.dblClick(confirmButton);

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /distribuindo atletas/i }),
      ).toBeDisabled();
    });

    expect(confirmButton).toBeDisabled();
    expect(mockMutation).toHaveBeenCalledTimes(1);

    request.resolve({
      success: true,
      competitionId: 'comp-1',
      allocated: [],
      notAllocated: [],
      summary: {
        totalAthletes: 20,
        allocatedCount: 20,
        notAllocatedCount: 0,
      },
    });

    expect(
      await screen.findAllByText(
        /distribuição concluída: 20 de 20 atletas alocados\. 0 atletas não foram alocados\./i,
      ),
    ).toHaveLength(2);
  });

  it('exibe resumo e lista de atletas não alocados após sucesso', async () => {
    const user = userEvent.setup();
    mockMutation.mockResolvedValue({
      success: true,
      competitionId: 'comp-1',
      allocated: [
        {
          athleteId: 'a-1',
          athleteName: 'João Silva',
          categoryId: 'c-1',
          categoryName: 'Adulto Azul Leve',
          matchedRules: {
            belt: true,
            weight: true,
            age: true,
            beltMix: false,
          },
        },
      ],
      notAllocated: [
        {
          athleteId: 'a-2',
          athleteName: 'Carlos Souza',
          reasons: [
            'Faixa incompatível',
            'Peso acima do limite da categoria',
          ],
        },
      ],
      summary: {
        totalAthletes: 20,
        allocatedCount: 16,
        notAllocatedCount: 4,
      },
    });

    renderWithProviders(
      <DistributeAthletesButton competitionId="comp-1" />,
    );

    await user.click(
      screen.getByRole('button', {
        name: /distribuir atletas nas categorias/i,
      }),
    );
    await user.click(
      screen.getByRole('button', {
        name: /confirmar distribuição/i,
      }),
    );

    expect(
      await screen.findAllByText(
        /distribuição concluída: 16 de 20 atletas alocados\. 4 atletas não foram alocados\./i,
      ),
    ).toHaveLength(2);
    expect(await screen.findByText('Carlos Souza')).toBeInTheDocument();
    expect(screen.getByText('Faixa incompatível')).toBeInTheDocument();
    expect(
      screen.getByText('Peso acima do limite da categoria'),
    ).toBeInTheDocument();
  });

  it('exibe mensagem amigável quando a API falha', async () => {
    const user = userEvent.setup();
    mockMutation.mockRejectedValue(
      new Error('Não existem categorias cadastradas para esta competição'),
    );

    renderWithProviders(
      <DistributeAthletesButton competitionId="comp-1" />,
    );

    await user.click(
      screen.getByRole('button', {
        name: /distribuir atletas nas categorias/i,
      }),
    );
    await user.click(
      screen.getByRole('button', {
        name: /confirmar distribuição/i,
      }),
    );

    expect(
      await screen.findByText(
        'Não existem categorias cadastradas para esta competição',
      ),
    ).toBeInTheDocument();
  });
});
