'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCompetition } from '@/features/competitions/hooks/use-competitions';
import { getCompetitionSectionItems } from '@/features/competitions/lib/competition-flow';
import { useCompetitionStore } from '@/shared/stores/useCompetitionStore';

function isSectionActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function CompetitionSectionNav() {
  const pathname = usePathname();
  const activeCompetitionId = useCompetitionStore(
    (state) => state.activeCompetitionId,
  );
  const hasHydrated = useCompetitionStore((state) => state.hasHydrated);
  const competitionQuery = useCompetition(activeCompetitionId ?? '');

  if (!hasHydrated || !activeCompetitionId || pathname.startsWith('/competitions')) {
    return null;
  }

  if (competitionQuery.isLoading || !competitionQuery.data) {
    return null;
  }

  const mode = competitionQuery.data.mode;
  const sectionItems = getCompetitionSectionItems(mode);

  return (
    <div className="mb-6 overflow-x-auto rounded-[28px] border-4 border-slate-900 bg-white p-3 shadow-[6px_6px_0_0_rgba(15,23,42,0.95)]">
      <nav className="flex min-w-max gap-2">
        {sectionItems.map((item) => {
          const isActive = isSectionActive(pathname, item.href);

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
