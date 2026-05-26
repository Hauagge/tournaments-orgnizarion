'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { buildAthleteReadinessSummary } from '@/features/athletes/lib/athlete-readiness';
import { useAthletes } from '@/features/athletes/hooks/use-athletes';
import { useCompetition } from '@/features/competitions/hooks/use-competitions';
import { getCompetitionSectionItems } from '@/features/competitions/lib/competition-flow';
import { useCompetitionStore } from '@/shared/stores/useCompetitionStore';

function isSectionActive(pathname: string, href: string) {
  if (pathname === href) {
    return true;
  }

  if (href === '/areas') {
    return pathname.startsWith('/areas/') && !pathname.startsWith('/areas/distribution');
  }

  return pathname.startsWith(`${href}/`);
}

export function CompetitionSectionNav() {
  const pathname = usePathname();
  const activeCompetitionId = useCompetitionStore(
    (state) => state.activeCompetitionId,
  );
  const hasHydrated = useCompetitionStore((state) => state.hasHydrated);
  const competitionQuery = useCompetition(activeCompetitionId ?? '');
  const athletesQuery = useAthletes(activeCompetitionId, '');

  if (!hasHydrated || !activeCompetitionId || pathname.startsWith('/competitions')) {
    return null;
  }

  if (competitionQuery.isLoading || !competitionQuery.data) {
    return null;
  }

  const mode = competitionQuery.data.mode;
  const readiness = athletesQuery.data
    ? buildAthleteReadinessSummary(athletesQuery.data)
    : null;
  const sectionItems = getCompetitionSectionItems(mode, readiness);

  return (
    <div className="mb-6 overflow-x-auto rounded-[28px] border-4 border-slate-900 bg-white p-3 shadow-[6px_6px_0_0_rgba(15,23,42,0.95)]">
      <nav className="flex min-w-max gap-2">
        {sectionItems.map((item) => {
          const isActive = isSectionActive(pathname, item.href);
          const blockedTitle =
            item.href === '/key-groups'
              ? 'Disponível depois que existir pelo menos um atleta na competição. Atletas com pesagem pendente podem coexistir, mas só atletas aprovados entram na chave.'
              : item.href === '/areas/distribution'
              ? 'Disponível depois que a competição já tiver base mínima de atletas. A tela passa a fazer sentido quando a primeira chave ou categoria gerar lutas.'
              : 'Disponível depois que a base de atletas e a pesagem mínima estiverem prontas.';

          if (item.blocked) {
            return (
              <span
                key={item.href}
                title={blockedTitle}
                className="inline-flex cursor-not-allowed items-center rounded-2xl bg-slate-50 px-4 py-3 text-sm font-black uppercase tracking-[0.12em] text-slate-400"
              >
                {item.label}
              </span>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-2xl px-4 py-3 text-sm font-black uppercase tracking-[0.12em] transition ${
                isActive
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-amber-100 hover:text-slate-950'
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
