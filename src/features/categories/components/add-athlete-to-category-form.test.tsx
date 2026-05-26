import React, { useState } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '@/shared/api/fetch-client';
import {
  CategoryDetailDrawer,
} from '@/features/categories/components/categories-page';
import { ToastProvider, Toaster } from '@/shared/ui/use-toast';

const mockMutation = vi.fn();

vi.mock('@/features/categories/hooks/use-categories', async () => {
  const actual = await vi.importActual<
    typeof import('@/features/categories/hooks/use-categories')
  >('@/features/categories/hooks/use-categories');

  return {
    ...actual,
    useAddAthleteToCategory: () => ({
      isPending: false,
      mutateAsync: mockMutation,
    }),
  };
});

vi.mock('@/features/key-groups/hooks/use-key-groups', () => ({
  useKeyGroups: () => ({
    data: [],
    isLoading: false,
    isError: false,
    error: null,
  }),
  useKeyGroup: () => ({
    data: null,
    isLoading: false,
    isError: false,
    error: null,
  }),
  useCreateKeyGroupFight: () => ({
    isPending: false,
    mutateAsync: vi.fn(),
  }),
}));

const existingAthlete = {
  id: 'ath-1',
  name: 'João Silva',
  documentNumber: '1',
  belt: 'Azul',
  birthDate: '2000-01-01',
  age: 24,
  declaredWeight: 70,
  realWeightGrams: null,
  academyId: 'academy-1',
  academy: 'Alliance',
  teamId: 'academy-1',
  team: 'Alliance',
  weighInStatus: 'APPROVED',
  paymentStatus: 'PAID' as const,
};

const availableAthlete = {
  id: 'ath-2',
  name: 'Carlos Souza',
  documentNumber: '2',
  belt: 'Azul',
  birthDate: '1999-01-01',
  age: 25,
  declaredWeight: 72,
  realWeightGrams: null,
  academyId: 'academy-2',
  academy: 'Checkmat',
  teamId: 'academy-2',
  team: 'Checkmat',
  weighInStatus: 'APPROVED',
  paymentStatus: 'PAID' as const,
};

const categoryDetail = {
  id: 'cat-1',
  name: 'Adulto Azul Leve',
  belt: 'Azul',
  ageMin: 18,
  ageMax: 29,
  weightMin: 65,
  weightMax: 75,
  totalAthletes: 1,
  athletes: [existingAthlete],
};

function renderDrawer({
  detail = categoryDetail,
  athletes = [existingAthlete, availableAthlete],
  onRefresh,
}: {
  detail?: typeof categoryDetail;
  athletes?: Array<typeof existingAthlete>;
  onRefresh?: () => Promise<void> | void;
} = {}) {
  return render(
    <ToastProvider>
      <CategoryDetailDrawer
        competitionId="comp-1"
        categoryId="cat-1"
        categories={[categoryDetail]}
        athletes={athletes}
        detail={detail}
        isError={false}
        isLoading={false}
        errorMessage=""
        isOpen
        onClose={() => undefined}
        onRefresh={onRefresh}
      />
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

describe('CategoryDetailDrawer manual add athlete flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('exibe a ação de adicionar atleta dentro do modal e filtra atletas já vinculados', async () => {
    renderDrawer();

    expect(screen.getByText('Atletas da categoria')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /adicionar atleta/i }),
    ).toBeInTheDocument();

    const select = screen.getByRole('combobox', {
      name: /selecionar atleta/i,
    });
    expect(select).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /carlos souza/i })).toBeInTheDocument();
    expect(
      screen.queryByRole('option', { name: /joão silva/i }),
    ).not.toBeInTheDocument();
  });

  it('permite selecionar atleta e chama a mutation com categoryId e athleteId', async () => {
    const user = userEvent.setup();
    mockMutation.mockResolvedValue({
      success: true,
      message: 'Atleta adicionado à categoria com sucesso.',
      data: {
        competitionId: 'comp-1',
        categoryId: 'cat-1',
        athleteId: 'ath-2',
      },
    });

    renderDrawer();

    await user.selectOptions(
      screen.getByRole('combobox', { name: /selecionar atleta/i }),
      'ath-2',
    );

    expect(screen.getByText(/carlos souza \| faixa: azul/i)).toBeInTheDocument();

    await user.click(
      screen.getByRole('button', { name: /^adicionar atleta$/i }),
    );

    expect(mockMutation).toHaveBeenCalledWith({
      categoryId: 'cat-1',
      athleteId: 'ath-2',
    });
  });

  it('desabilita o botão durante loading e evita múltiplas requisições', async () => {
    const user = userEvent.setup();
    const request = deferred<{
      success: boolean;
      message: string;
      data: {
        competitionId: string;
        categoryId: string;
        athleteId: string;
      };
    }>();
    mockMutation.mockReturnValue(request.promise);

    renderDrawer();

    await user.selectOptions(
      screen.getByRole('combobox', { name: /selecionar atleta/i }),
      'ath-2',
    );

    const button = screen.getByRole('button', { name: /^adicionar atleta$/i });
    await user.dblClick(button);

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /adicionando/i }),
      ).toBeDisabled();
    });

    expect(mockMutation).toHaveBeenCalledTimes(1);

    request.resolve({
      success: true,
      message: 'Atleta adicionado à categoria com sucesso.',
      data: {
        competitionId: 'comp-1',
        categoryId: 'cat-1',
        athleteId: 'ath-2',
      },
    });

    await screen.findByText('Atleta adicionado à categoria com sucesso.');
  });

  it('mantém o modal aberto, limpa a seleção e atualiza a lista após sucesso', async () => {
    const user = userEvent.setup();
    mockMutation.mockResolvedValue({
      success: true,
      message: 'Atleta adicionado à categoria com sucesso.',
      data: {
        competitionId: 'comp-1',
        categoryId: 'cat-1',
        athleteId: 'ath-2',
      },
    });

    function Wrapper() {
      const [detail, setDetail] = useState(categoryDetail);

      return (
        <ToastProvider>
          <CategoryDetailDrawer
            competitionId="comp-1"
            categoryId="cat-1"
            categories={[categoryDetail]}
            athletes={[existingAthlete, availableAthlete]}
            detail={detail}
            isError={false}
            isLoading={false}
            errorMessage=""
            isOpen
            onClose={() => undefined}
            onRefresh={() => {
              setDetail((current) => ({
                ...current,
                totalAthletes: 2,
                athletes: [...current.athletes, availableAthlete],
              }));
            }}
          />
          <Toaster />
        </ToastProvider>
      );
    }

    render(<Wrapper />);

    await user.selectOptions(
      screen.getByRole('combobox', { name: /selecionar atleta/i }),
      'ath-2',
    );
    await user.click(
      screen.getByRole('button', { name: /^adicionar atleta$/i }),
    );

    expect(await screen.findByText('Carlos Souza')).toBeInTheDocument();
    expect(screen.getByText('Adulto Azul Leve')).toBeInTheDocument();
    expect(
      screen.getByRole('combobox', { name: /selecionar atleta/i }),
    ).toHaveValue('');
  });

  it('exibe mensagem amigável e motivos retornados pela API sem fechar o modal', async () => {
    const user = userEvent.setup();
    mockMutation.mockRejectedValue(
      new ApiError(
        'Atleta não pode ser adicionado a esta categoria.',
        400,
        {
          success: false,
          message: 'Atleta não pode ser adicionado a esta categoria.',
          reasons: ['Faixa incompatível', 'Peso acima do limite da categoria'],
        },
      ),
    );

    renderDrawer();

    await user.selectOptions(
      screen.getByRole('combobox', { name: /selecionar atleta/i }),
      'ath-2',
    );
    await user.click(
      screen.getByRole('button', { name: /^adicionar atleta$/i }),
    );

    expect(
      await screen.findAllByText('Atleta não pode ser adicionado a esta categoria.'),
    ).toHaveLength(2);
    expect(screen.getByText('Faixa incompatível')).toBeInTheDocument();
    expect(
      screen.getByText('Peso acima do limite da categoria'),
    ).toBeInTheDocument();
    expect(screen.getByText('Adulto Azul Leve')).toBeInTheDocument();
  });

  it('extrai motivos aninhados em error.details quando o backend não retorna reasons na raiz', async () => {
    const user = userEvent.setup();
    mockMutation.mockRejectedValue(
      new ApiError(
        'Atleta não pode ser adicionado a esta categoria.',
        400,
        {
          error: {
            message: 'Atleta não pode ser adicionado a esta categoria.',
            details: {
              reasons: [
                'Categoria bloqueada para a faixa do atleta',
                'Diferença de peso fora da regra',
              ],
            },
          },
        },
        {
          details: {
            reasons: [
              'Categoria bloqueada para a faixa do atleta',
              'Diferença de peso fora da regra',
            ],
          },
        },
      ),
    );

    renderDrawer();

    await user.selectOptions(
      screen.getByRole('combobox', { name: /selecionar atleta/i }),
      'ath-2',
    );
    await user.click(
      screen.getByRole('button', { name: /^adicionar atleta$/i }),
    );

    expect(
      await screen.findAllByText('Atleta não pode ser adicionado a esta categoria.'),
    ).toHaveLength(2);
    expect(
      screen.getByText('Categoria bloqueada para a faixa do atleta'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Diferença de peso fora da regra'),
    ).toBeInTheDocument();
  });
});
