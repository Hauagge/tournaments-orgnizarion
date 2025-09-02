// 'use client';

// import { useRouter, useParams } from 'next/navigation';
// import { Card, CardContent } from '@/app/components/ui/card';
// import { Button } from '@/app/components/ui/button';
// import { useCategoryStore } from '@/app/store/useCategoryStore';

// export default function CategoryPage() {
//   const { categoryName } = useParams<{ categoryName: string }>();
//   const router = useRouter();
//   const { categories } = useCategoryStore();
//   console.log('Category Name:', categoryName);
//   console.log('Categories:', categories);
//   const bracket = categories.find(
//     (cat) => cat.name === decodeURIComponent(categoryName),
//   );
//   if (!bracket) {
//     return (
//       <div className="p-6">
//         <p>Chave não encontrada.</p>
//         <Button onClick={() => router.back()}>Voltar</Button>
//       </div>
//     );
//   }
//   return (
//     <div className="p-6 space-y-4">
//       <div className="flex justify-between items-center">
//         <h1 className="text-2xl font-bold">{bracket.name}</h1>
//         {/* <Button onClick={() => router.back()}>← Voltar</Button> */}
//       </div>

//       <p>
//         Faixa etária: {bracket.ageDivision.min} - {bracket.ageDivision.max} anos
//       </p>
//       <p>
//         Peso: {bracket.minWeight} - {bracket.maxWeight} kg
//       </p>

//       <h2 className="text-xl font-semibold mt-4">Lutas:</h2>
//       {bracket?.fights && bracket?.fights.length > 0 ? (
//         <div className="space-y-3">
//           {bracket?.fights.map((fight, index) => {
//             const [a, b] = fight.athletes;
//             return (
//               <Card key={index}>
//                 <CardContent className="p-4 flex justify-between items-center">
//                   <span>{a}</span>
//                   <span className="font-semibold">vs</span>
//                   <span>{b}</span>
//                 </CardContent>
//               </Card>
//             );
//           })}
//         </div>
//       ) : (
//         <p>Sem lutas cadastradas para esta chave.</p>
//       )}
//     </div>
//   );
// }
'use client';

import { useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
// import { Card, CardContent } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
// import { Input } from '@/app/components/ui/input';
import { useCategoryStore } from '@/app/store/useCategoryStore';
import { Fight } from '@/app/types';
import { Round } from '@/app/components/Rounds';

type WinnerMap = Record<number, string | null>;

export default function CategoryPage() {
  const router = useRouter();
  const { categoryName } = useParams<{ categoryName: string }>();
  const decoded = decodeURIComponent(categoryName);
  const { categories } = useCategoryStore();

  const bracket = useMemo(
    () => categories.find((cat) => cat.name === decoded),
    [categories, decoded],
  );

  // estado local de UI
  // const [search, setSearch] = useState('');
  // const [winners, setWinners] = useState<WinnerMap>({});
  const search = '';
  const winners: WinnerMap = {};

  // apenas lutas da categoria (sem filtro de faixa)
  const filteredFights = useMemo(() => {
    const fights = bracket?.fights ?? [];
    if (!search.trim()) return fights;
    return fights.filter((f: Fight) => {
      const [a, b] = f?.athletes ?? [];
      const txt = `${a || ''} ${b || ''}`.toLowerCase();
      return txt.includes(search.toLowerCase());
    });
  }, [bracket?.fights, search]);

  // function handleSelectWinner(index: number, athlete: string) {
  //   setWinners((prev) => ({
  //     ...prev,
  //     [index]: prev[index] === athlete ? null : athlete,
  //   }));
  // }

  // function roundLabel(idx: number, total: number) {
  //   if (total >= 8) {
  //     if (idx < total / 4) return 'Oitavas';
  //     if (idx < total / 2) return 'Quartas';
  //     if (idx < total - 1) return 'Semifinal';
  //     return 'Final';
  //   }
  //   if (total >= 4) {
  //     if (idx < total / 2) return 'Quartas';
  //     if (idx < total - 1) return 'Semifinal';
  //     return 'Final';
  //   }
  //   if (total === 2) return idx === 1 ? 'Final' : 'Semifinal';
  //   return 'Luta';
  // }

  const totalFights = bracket?.fights?.length ?? 0;
  const finishedCount = Object.values(winners).filter(Boolean).length;
  if (!bracket) {
    return (
      <div className="p-6 flex flex-col items-center gap-4">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold">Chave não encontrada</h2>
          <p className="text-muted-foreground max-w-md">
            Verifique o nome da categoria ou retorne para a lista de chaves.
          </p>
        </div>
        <Button onClick={() => router.back()}>← Voltar</Button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-gradient-to-br bg-red-900 via-slate-900 to-slate-950 min-h-screen">
      {/* Header */}
      <div className="rounded-2xl bg-slate-800/80 border border-red-700/40 p-6 shadow-lg">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight text-slate-100">
              {bracket.name}
            </h1>
            <p className="text-slate-300">
              Idade:{' '}
              <span className="font-medium">
                {bracket.ageDivision.min}–{bracket.ageDivision.max}
              </span>{' '}
              anos · Peso:{' '}
              <span className="font-medium">
                {bracket.minWeight}–{bracket.maxWeight}
              </span>{' '}
              kg
            </p>
          </div>

          {/* Métricas */}
          <div className="grid grid-cols-3 gap-3">
            <Stat value={totalFights} label="Lutas" />
            <Stat value={finishedCount} label="Definidas" />
            <Stat
              value={Math.max(totalFights - finishedCount, 0)}
              label="Pendentes"
            />
          </div>
        </div>

        {/* Busca + ações */}
        <div className="mt-6 flex flex-col md:flex-row gap-3">
          {/* <div className="flex-1">
            <Input
              placeholder="Buscar por atleta..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10"
            />
          </div> */}
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              className="bg-slate-700 hover:bg-slate-600 text-slate-100"
              variant="secondary"
              onClick={() => router.back()}
            >
              ← Voltar
            </Button>
            <Button className="bg-red-600 hover:bg-red-500 text-white">
              Exportar PDF
            </Button>
            <Button>Salvar progresso</Button>
          </div>
        </div>
      </div>

      {/* Lutas */}
      <section className="space-y-3">
        <div className="flex items-baseline justify-between">
          <h2 className="text-xl font-semibold">Lutas</h2>
          <span className="text-sm text-muted-foreground">
            Exibindo {filteredFights.length} de {totalFights}
          </span>
        </div>

        {filteredFights.length === 0 ? (
          <EmptyState
            title="Sem lutas correspondentes"
            subtitle="Tente outro nome na busca."
          />
        ) : (
          filteredFights.map((fight: Fight, idx: number) => {
            console.log('Fight', idx);
            return (
              <>
                <Round
                  athletes={fight.athletes}
                  slots={16}
                  onWinner={() => {}}
                />
                <Round
                  athletes={fight.athletes}
                  slots={8}
                  onWinner={() => {}}
                />
                <Round
                  athletes={fight.athletes}
                  slots={4}
                  onWinner={() => {}}
                />
                <Round
                  athletes={fight.athletes}
                  slots={2}
                  onWinner={() => {}}
                />
              </>
            );
          })
          // <div className="grid grid-cols-3 gap-4 items-center">
          //   {/* quartas */}
          //   <div className="grid grid-cols-1 gap-4">
          //     <Card className="border-white/10 hover:border-white/20 transition-colors">
          //       luta #1
          //     </Card>
          //     <Card className="border-white/10 hover:border-white/20 transition-colors">
          //       luta #2
          //     </Card>
          //     <Card className="border-white/10 hover:border-white/20 transition-colors">
          //       luta #3
          //     </Card>
          //     <Card className="border-white/10 hover:border-white/20 transition-colors">
          //       luta #4
          //     </Card>
          //   </div>
          //   {/* semi */}
          //   <div className="grid grid-cols-1 gap-4">
          //     <Card className="border-white/10 hover:border-white/20 transition-colors">
          //       <b>luta #5</b>
          //       vencedor pessoa luta #1 vencedor pessoa luta #2
          //     </Card>
          //     <Card className="border-white/10 hover:border-white/20 transition-colors">
          //       <b>luta #6</b>
          //       vencedor pessoa luta #3 vencedor pessoa luta #4
          //     </Card>
          //   </div>
          // {/* final */}
          //   <div className="grid grid-cols-1">
          //     <div className="">
          //       <Card className="border-white/10 hover:border-white/20 transition-colors">
          //         <b>luta #7</b>
          //         vencedor pessoa luta #5 vencedor pessoa luta #6
          //       </Card>
          //     </div>
          //   </div>
          // </div>

          // <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          //   {filteredFights.map((fight: Fight, idx: number) => {
          //     const [a = 'W.O.', b = 'W.O.'] = fight?.athletes ?? [];
          //     const isA = winners[idx] === a;
          //     const isB = winners[idx] === b;
          //     return (
          //       <Card
          //         key={`${a}-${b}-${idx}`}
          //         className="border-white/10 hover:border-white/20 transition-colors"
          //       >
          // <CardContent className="p-4 space-y-3">
          //   <div className="flex items-center justify-between">
          //     <span className="text-xs font-medium px-2 py-1 rounded-full bg-white/5 border border-white/10">
          //       {roundLabel(idx, totalFights)}
          //     </span>
          //     <span className="text-xs text-muted-foreground">
          //       Luta #{idx + 1}
          //     </span>
          //   </div>

          //   <div className="rounded-xl border border-white/10">
          //     <RowFighter
          //       name={a}
          //       selected={!!isA}
          //       onClick={() => handleSelectWinner(idx, a)}
          //       side="left"
          //     />
          //     <div className="h-px bg-white/10" />
          //     <RowFighter
          //       name={b}
          //       selected={!!isB}
          //       onClick={() => handleSelectWinner(idx, b)}
          //       side="right"
          //     />
          //   </div>

          //   <div className="flex items-center justify-end gap-2">
          //     <Button
          //       size="sm"
          //       variant="outline"
          //       onClick={() =>
          //         setWinners((p) => ({ ...p, [idx]: null }))
          //       }
          //     >
          //       Limpar
          //     </Button>
          //     <Button
          //       size="sm"
          //       onClick={() => {
          //         // TODO: persistir no store/DB
          //         // ex.: useCategoryStore().setFightWinner(bracket.id, idx, winners[idx])
          //       }}
          //     >
          //       Confirmar
          //     </Button>
          //   </div>
          // </CardContent>
          //       </Card>
          //     );
          //   })}
          // </div>
        )}
      </section>
    </div>
  );
}

/** ---------- UI helpers ---------- */

function Stat({ value, label }: { value: number | string; label: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white px-4 py-3 text-center">
      <div className="text-2xl font-bold leading-none">{value}</div>
      <div className="text-xs text-muted-foreground mt-1">{label}</div>
    </div>
  );
}

function EmptyState({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-white p-10 text-center">
      <div className="text-lg font-semibold">{title}</div>
      {subtitle && (
        <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
      )}
    </div>
  );
}

// function RowFighter({
//   name,
//   selected,
//   onClick,
//   side,
// }: {
//   name: string;
//   selected: boolean;
//   onClick: () => void;
//   side: 'left' | 'right';
// }) {
//   return (
//     <button
//       type="button"
//       onClick={onClick}
//       className={[
//         'w-full flex items-center justify-between px-3 py-3 text-left',
//         'hover:bg-white/[0.04] transition-colors',
//         selected ? 'bg-white/[0.06]' : '',
//       ].join(' ')}
//     >
//       <span className="truncate font-medium">
//         {name || <span className="text-muted-foreground">W.O.</span>}
//       </span>
//       <span
//         className={[
//           'text-[10px] px-2 py-1 rounded-full border',
//           selected
//             ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-300'
//             : 'border-white/10 text-muted-foreground',
//         ].join(' ')}
//       >
//         {selected
//           ? 'Vencedor'
//           : side === 'left'
//           ? 'Selecionar A'
//           : 'Selecionar B'}
//       </span>
//     </button>
//   );
// }
