import { CompetitionMode } from '@/features/competitions/types/competition';

export type CompetitionFlowEntry = {
  href: string;
  label: string;
};

export function getCompetitionEntry(mode: CompetitionMode): CompetitionFlowEntry {
  if (mode === 'ABSOLUTE_GP') {
    return {
      href: '/categories',
      label: 'Abrir categorias',
    };
  }

  return {
    href: '/key-groups',
    label: 'Abrir chaves',
  };
}

export function getCompetitionSectionItems(mode: CompetitionMode) {
  const setupItems = [
    { href: '/athletes', label: 'Atletas' },
    { href: '/imports/athletes', label: 'Importação' },
    { href: '/weigh-in', label: 'Pesagem' },
  ];

  if (mode === 'ABSOLUTE_GP') {
    return [
      ...setupItems,
      { href: '/categories', label: 'Categorias' },
      { href: '/fights', label: 'Lutas' },
      { href: '/areas', label: 'Áreas' },
    ];
  }

  return [
    ...setupItems,
    { href: '/key-groups', label: 'Chaves' },
    { href: '/fights', label: 'Lutas' },
    { href: '/areas', label: 'Áreas' },
  ];
}
