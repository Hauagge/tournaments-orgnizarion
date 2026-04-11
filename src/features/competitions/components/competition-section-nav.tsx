'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCompetitionStore } from '@/shared/stores/useCompetitionStore';

const baseSectionItems = [
  { href: '/key-groups', label: 'Chaves' },
  { href: '/athletes', label: 'Atletas' },
  { href: '/imports/athletes', label: 'Importação' },
  { href: '/weigh-in', label: 'Pesagem' },
  { href: '/fights', label: 'Lutas' },
  { href: '/areas', label: 'Áreas' },
];

function isSectionActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function CompetitionSectionNav() {
  const pathname = usePathname();
  const activeCompetitionId = useCompetitionStore(
    (state) => state.activeCompetitionId,
  );
  const hasHydrated = useCompetitionStore((state) => state.hasHydrated);
  const isKeyGroupsContext =
    pathname.startsWith('/key-groups') || pathname.startsWith('/categories');
  const sectionItems = isKeyGroupsContext
    ? [
        { href: '/categories', label: 'Categorias' },
        ...baseSectionItems,
      ]
    : baseSectionItems;

  if (!hasHydrated || !activeCompetitionId || pathname.startsWith('/competitions')) {
    return null;
  }

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
