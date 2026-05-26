import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FightsByAreaPdfButton } from '@/features/fights/components/fights-by-area-pdf-button';
import { ToastProvider, Toaster } from '@/shared/ui/use-toast';

const mockMutation = vi.fn();

vi.mock('@/features/fights/hooks/use-fights', () => ({
  useExportFightsByAreaPdf: () => ({
    isPending: false,
    mutateAsync: mockMutation,
  }),
}));

function deferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;

  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
}

function renderButton(competitionId: string | null) {
  return render(
    <ToastProvider>
      <FightsByAreaPdfButton competitionId={competitionId} />
      <Toaster />
    </ToastProvider>,
  );
}

describe('FightsByAreaPdfButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renderiza o botão na aba de lutas', () => {
    renderButton('comp-1');

    expect(
      screen.getByRole('button', { name: /gerar pdf de lutas por área/i }),
    ).toBeInTheDocument();
  });

  it('fica desabilitado quando não há competitionId', () => {
    renderButton(null);

    expect(
      screen.getByRole('button', { name: /gerar pdf de lutas por área/i }),
    ).toBeDisabled();
  });

  it('entra em loading e evita múltiplos cliques', async () => {
    const user = userEvent.setup();
    const request = deferred<void>();
    mockMutation.mockReturnValue(request.promise);

    renderButton('comp-1');

    const button = screen.getByRole('button', {
      name: /gerar pdf de lutas por área/i,
    });
    await user.dblClick(button);

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /gerando pdf/i }),
      ).toBeDisabled();
    });

    expect(mockMutation).toHaveBeenCalledTimes(1);

    request.resolve();
    await screen.findByText('PDF de lutas por área gerado com sucesso.');
  });

  it('exibe erro específico retornado pela API', async () => {
    const user = userEvent.setup();
    mockMutation.mockRejectedValue(
      new Error('Nenhuma luta encontrada para esta competição.'),
    );

    renderButton('comp-1');

    await user.click(
      screen.getByRole('button', { name: /gerar pdf de lutas por área/i }),
    );

    expect(
      await screen.findByText('Nenhuma luta encontrada para esta competição.'),
    ).toBeInTheDocument();
  });

  it('exibe erro genérico quando não há mensagem da API', async () => {
    const user = userEvent.setup();
    mockMutation.mockRejectedValue({});

    renderButton('comp-1');

    await user.click(
      screen.getByRole('button', { name: /gerar pdf de lutas por área/i }),
    );

    expect(
      await screen.findByText(
        'Não foi possível gerar o PDF de lutas por área. Tente novamente.',
      ),
    ).toBeInTheDocument();
  });
});
