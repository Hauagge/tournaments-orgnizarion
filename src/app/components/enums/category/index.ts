type AgeCategory =
  | 'Mirim'
  | 'Infantil A'
  | 'Infantil B'
  | 'Infanto Juvenil A'
  | 'Infanto Juvenil B'
  | 'Juvenil';

type WeightClass =
  | 'Galo'
  | 'Pluma'
  | 'Pena'
  | 'Leve'
  | 'Médio'
  | 'Meio-pesado'
  | 'Pesado'
  | 'Super-pesado'
  | 'Pesadissimo A'
  | 'Pesadissimo B'
  | 'Pesadissimo C';

type CategoryWeightMap = {
  [age in AgeCategory]: {
    [weight in WeightClass]?: { min: string | number; max: string | number }; // alguns têm "Acima" ou "de"
  };
};

export const BELTS = [
  'Branca',
  'Cinza',
  'Amarela',
  'Laranja',
  'Verde',
  'Azul',
  'Roxa',
  'Marrom',
  'Preta',
];

export const CATEGORIES_BY_AGE_WEIGHT: CategoryWeightMap = {
  Mirim: {
    Galo: { min: 15, max: 18 },
    Pluma: { min: 19, max: 21 },
    Pena: { min: 22, max: 24 },
    Leve: { min: 25, max: 27 },
    Médio: { min: 28, max: 30 },
    'Meio-pesado': { min: 31, max: 33 },
    Pesado: { min: 34, max: 36 },
    'Super-pesado': { min: 37, max: 39 },
    'Pesadissimo A': { min: 40, max: 42 },
    'Pesadissimo B': { min: 43, max: 45 },
    'Pesadissimo C': { min: 46, max: Infinity },
  },
  'Infantil A': {
    Galo: { min: 20, max: 24 },
    Pluma: { min: 25, max: 27 },
    Pena: { min: 28, max: 30 },
    Leve: { min: 31, max: 33 },
    Médio: { min: 34, max: 36 },
    'Meio-pesado': { min: 37, max: 39 },
    Pesado: { min: 40, max: 42 },
    'Super-pesado': { min: 43, max: 45 },
    'Pesadissimo A': { min: 46, max: 48 },
    'Pesadissimo B': { min: 49, max: 51 },
    'Pesadissimo C': { min: 52, max: Infinity },
  },
  'Infantil B': {
    Galo: { min: 29, max: 32 },
    Pluma: { min: 33, max: 36 },
    Pena: { min: 37, max: 39 },
    Leve: { min: 40, max: 43 },
    Médio: { min: 44, max: 46 },
    'Meio-pesado': { min: 47, max: 49 },
    Pesado: { min: 50, max: 52 },
    'Super-pesado': { min: 53, max: 55 },
    'Pesadissimo A': { min: 56, max: 58 },
    'Pesadissimo B': { min: 59, max: 61 },
    'Pesadissimo C': { min: 62, max: Infinity },
  },
  'Infanto Juvenil A': {
    Galo: { min: 32, max: 35 },
    Pluma: { min: 36, max: 39 },
    Pena: { min: 40, max: 43 },
    Leve: { min: 44, max: 47 },
    Médio: { min: 48, max: 51 },
    'Meio-pesado': { min: 52, max: 55 },
    Pesado: { min: 56, max: 59 },
    'Super-pesado': { min: 60, max: 63 },
    'Pesadissimo A': { min: 64, max: 67 },
    'Pesadissimo B': { min: 68, max: 71 },
    'Pesadissimo C': { min: 72, max: Infinity },
  },
  'Infanto Juvenil B': {
    Galo: { min: 36, max: 39 },
    Pluma: { min: 40, max: 43 },
    Pena: { min: 44, max: 47 },
    Leve: { min: 48, max: 51 },
    Médio: { min: 52, max: 55 },
    'Meio-pesado': { min: 56, max: 59 },
    Pesado: { min: 60, max: 63 },
    'Super-pesado': { min: 64, max: 67 },
    'Pesadissimo A': { min: 68, max: 71 },
    'Pesadissimo B': { min: 72, max: 75 },
    'Pesadissimo C': { min: 76, max: Infinity },
  },
  Juvenil: {
    Galo: { min: 50, max: 54 },
    Pluma: { min: 55, max: 59 },
    Pena: { min: 60, max: 64 },
    Leve: { min: 65, max: 68 },
    Médio: { min: 69, max: 72 },
    'Meio-pesado': { min: 73, max: 76 },
    Pesado: { min: 77, max: 81 },
    'Super-pesado': { min: 82, max: 85 },
    'Pesadissimo A': { min: 86, max: 90 },
    'Pesadissimo B': { min: 91, max: 95 },
    'Pesadissimo C': { min: 96, max: Infinity },
  },
};

export enum AgeDivision {
  MIRIM = 'Mirim', // 7 anos
  INFANTIL_A = 'Infantil A', // 8 e 9 anos
  INFANTIL_B = 'Infantil B', // 10 e 11 anos
  INFANTO_JUVENIL_A = 'Infanto Juvenil A', // 12 e 13 anos
  INFANTO_JUVENIL_B = 'Infanto Juvenil B', // 14 e 15 anos
  JUVENIL = 'Juvenil', // 16 e 17 anos
  // ADULTO = 'Adulto', // 18 a 29 anos
  // MASTER = 'Master', // 30 a 34 anos
  // SENIOR = 'Senior', // 35 a 39 anos
  // SUPER_SENIOR = 'Super Senior', // 40 anos ou mais
}

export type AgeDivisionRange = {
  min: number;
  max: number;
  division: AgeDivision;
};

const divisions = [
  { min: 4, max: 7, division: AgeDivision.MIRIM }, // Added range for 4-5 years
  { min: 8, max: 14, division: AgeDivision.INFANTO_JUVENIL_A },
  { min: 15, max: 17, division: AgeDivision.JUVENIL },
  { min: 12, max: 13, division: AgeDivision.INFANTO_JUVENIL_A },
  { min: 14, max: 15, division: AgeDivision.INFANTO_JUVENIL_B },
  { min: 16, max: 17, division: AgeDivision.JUVENIL },
  // { min: 18, max: 29, division: AgeDivision.ADULTO },
  // { min: 30, max: 34, division: AgeDivision.MASTER },
  // { min: 35, max: 39, division: AgeDivision.SENIOR },
  // { min: 40, max: Infinity, division: AgeDivision.SUPER_SENIOR },
];

export function getDivisionByAge(age: number): AgeDivisionRange | null {
  return divisions.find((d) => age >= d.min && age <= d.max) || null;
}

export function getAgeDivisionByName(name: string): AgeDivisionRange | null {
  const division = divisions.find(
    (div) => div.division.toUpperCase() === name.toUpperCase(),
  );
  return division || null;
}

const beltsForCategory: { [key in AgeDivision]: string[] } = {
  [AgeDivision.MIRIM]: ['Branca', 'Cinza', 'Amarela', 'Laranja'],
  [AgeDivision.INFANTIL_A]: ['Branca', 'Cinza', 'Amarela', 'Laranja'],
  [AgeDivision.INFANTIL_B]: ['Branca', 'Cinza', 'Amarela', 'Laranja'],
  [AgeDivision.INFANTO_JUVENIL_A]: [
    'Branca',
    'Cinza',
    'Amarela',
    'Laranja',
    'Verde',
  ],
  [AgeDivision.INFANTO_JUVENIL_B]: [
    'Branca',
    'Cinza',
    'Amarela',
    'Laranja',
    'Verde',
  ],
  [AgeDivision.JUVENIL]: [
    'Branca',
    'Cinza',
    'Amarela',
    'Laranja',
    'Verde',
    'Azul',
  ],
  // [AgeDivision.ADULTO]: ['Branca', 'Azul', 'Roxa', 'Marrom', 'Preta'],
  // [AgeDivision.MASTER]: ['Branca', 'Azul', 'Roxa', 'Marrom', 'Preta'],
  // [AgeDivision.SENIOR]: ['Branca', 'Azul', 'Roxa', 'Marrom', 'Preta'],
  // [AgeDivision.SUPER_SENIOR]: ['Branca', 'Azul', 'Roxa', 'Marrom', 'Preta'],
};

export function getBeltsForCategory(ageDivision: AgeDivision): string[] {
  return beltsForCategory[ageDivision] || [];
}
