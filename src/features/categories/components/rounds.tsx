/* eslint-disable @typescript-eslint/no-unused-vars */
import { WinnerMap } from '@/app/category/[categoryName]/page';
import { Card, CardContent } from '@/app/components/ui/card';
import { Button } from '../ui/button';

type Density = 'normal' | 'compact';

type RoundProps = {
  athletes: string[];
  slots: number;
  onWinner: (index: number, athlete: string) => void;
  winners: WinnerMap;
  density?: Density;
};

export default function Round({
  athletes,
  slots,
  onWinner,
  winners,
  density = 'normal',
}: RoundProps) {
  if (athletes.length < slots / 2) return null;
  console.log('Rendering Round with athletes:', athletes, 'slots:', slots);
  const isCompact = density === 'compact';

  function roundLabel(idx: number, total: number) {
    if (total >= 8) {
      if (idx < total / 4) return 'Oitavas';
      if (idx < total / 2) return 'Quartas';
      if (idx < total - 1) return 'Semifinal';
      return 'Final';
    }
    if (total >= 4) {
      if (idx < total / 2) return 'Quartas';
      if (idx < total - 1) return 'Semifinal';
      return 'Final';
    }
    if (total === 2) return idx === 1 ? 'Final' : 'Semifinal';
    return 'Luta';
  }

  // normaliza com W.O.
  const normalized = [...athletes];
  while (normalized.length < slots) normalized.push('W.O.');

  // gera as lutas iniciais
  const firstPhase: [string, string][] = [];
  for (let i = 0; i < normalized.length; i += 2) {
    firstPhase.push([normalized[i], normalized[i + 1]]);
  }

  // rounds placeholder (se quiser exibir as colunas seguintes depois)
  const rounds: [string, string][][] = [firstPhase];
  let fights = firstPhase.length;
  while (fights > 1) {
    fights = fights / 2;
    const emptyFights: [string, string][] = Array.from(
      { length: fights },
      () => ['_____', '_____'],
    );
    rounds.push(emptyFights);
  }
  console.log('firstPhase:', firstPhase);

  return (
    <div
      className={[
        // responsividade: 1 → 2 → 3 colunas
        'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
        isCompact ? 'gap-3' : 'gap-4',
        'items-start',
      ].join(' ')}
    >
      {/* Primeira fase (exibe as lutas já com nomes) */}
      <div
        className={
          isCompact ? 'grid grid-cols-1 gap-3' : 'grid grid-cols-1 gap-4'
        }
      >
        {firstPhase.map(([a, b], idx) => {
          if (a === 'W.O.' && b === 'W.O.') return null;
          const isA = winners[idx] === a;
          const isB = winners[idx] === b;

          return (
            <Card
              key={idx}
              className={[
                'transition-colors',
                isCompact ? 'p-0' : 'p-3',
                'border-white/10 hover:border-white/20',
              ].join(' ')}
            >
              <CardContent
                className={isCompact ? 'p-3 space-y-2' : 'p-4 space-y-3'}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={[
                      'font-medium rounded-full border',
                      isCompact
                        ? 'text-[10px] px-2 py-0.5 bg-white/5 border-white/10'
                        : 'text-xs px-2 py-1 bg-white/5 border-white/10',
                    ].join(' ')}
                  >
                    {roundLabel(idx, firstPhase.length)}
                  </span>
                  <span
                    className={
                      isCompact
                        ? 'text-[10px] text-muted-foreground'
                        : 'text-xs text-muted-foreground'
                    }
                  >
                    Luta #{idx + 1}
                  </span>
                </div>

                <div
                  className={[
                    'rounded-xl border border-white/10',
                    isCompact ? '' : '',
                  ].join(' ')}
                >
                  <RowFighter
                    name={a}
                    selected={!!isA}
                    onClick={() => onWinner(idx, a)}
                    side="left"
                    compact={isCompact}
                  />
                  <div className="h-px bg-white/10" />
                  <RowFighter
                    name={b}
                    selected={!!isB}
                    onClick={() => onWinner(idx, b)}
                    side="right"
                    compact={isCompact}
                  />
                </div>

                <div className="flex items-center justify-end gap-2">
                  <Button
                    size={isCompact ? 'xs' : 'sm'}
                    variant="outline"
                    onClick={() => onWinner(idx, '')} // limpa selecionando null
                  >
                    Limpar
                  </Button>
                  <Button size={isCompact ? 'xs' : 'sm'}>Confirmar</Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Colunas futuras (semis/final placeholders) — mantém escala compacta */}
      {rounds.slice(1).map((phase, colIdx) => (
        <div
          key={colIdx}
          className={
            isCompact ? 'grid grid-cols-1 gap-3' : 'grid grid-cols-1 gap-4'
          }
        >
          {phase.map(([_a, _b], idx) => (
            <Card key={idx} className={isCompact ? 'p-0' : 'p-3'}>
              <CardContent className={isCompact ? 'p-3' : 'p-4'}>
                <div
                  className={[
                    'w-full rounded-lg border border-dashed text-center',
                    isCompact
                      ? 'py-5 text-sm text-muted-foreground'
                      : 'py-8 text-base text-muted-foreground',
                  ].join(' ')}
                >
                  {colIdx === rounds.length - 2 && idx === phase.length - 1
                    ? 'Final'
                    : 'Em definição'}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ))}
    </div>
  );
}

function RowFighter({
  name,
  selected,
  onClick,
  side,
  compact = false,
}: {
  name: string;
  selected: boolean;
  onClick: () => void;
  side: 'left' | 'right';
  compact?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'w-full flex items-center justify-between text-left transition-colors',
        compact ? 'px-3 py-2 text-sm' : 'px-3 py-3',
        'hover:bg-white/[0.04]',
        selected ? 'bg-white/[0.06]' : '',
      ].join(' ')}
    >
      <span
        className={['truncate font-medium', compact ? 'text-sm' : ''].join(' ')}
      >
        {name || <span className="text-muted-foreground">W.O.</span>}
      </span>
      <span
        className={[
          'rounded-full border',
          compact ? 'text-[10px] px-2 py-0.5' : 'text-[10px] px-2 py-1',
          selected
            ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-300'
            : 'border-white/10 text-muted-foreground',
        ].join(' ')}
      >
        {selected
          ? 'Vencedor'
          : side === 'left'
          ? 'Selecionar A'
          : 'Selecionar B'}
      </span>
    </button>
  );
}
