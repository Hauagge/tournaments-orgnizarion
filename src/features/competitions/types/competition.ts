export const competitionModes = ['TEAM', 'ABSOLUTE_GP'] as const;

export type CompetitionMode = (typeof competitionModes)[number];

export const competitionModeLabels: Record<CompetitionMode, string> = {
  TEAM: 'Por equipes',
  ABSOLUTE_GP: 'GP absoluto',
};

export type Competition = {
  id: string;
  name: string;
  mode: CompetitionMode;
  fightDurationSeconds: number;
  weighInMarginGrams: number;
  ageSplitYears: number;
  createdAt?: string;
  updatedAt?: string;
};

export type CompetitionPayload = Omit<
  Competition,
  'id' | 'createdAt' | 'updatedAt'
>;
