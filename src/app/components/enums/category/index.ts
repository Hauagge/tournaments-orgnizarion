type AgeCategory =
  | 'Mirim'
  | 'Infantil A'
  | 'Infantil B'
  | 'Infanto Juvenil A'
  | 'Infanto Juvenil B'
  | 'Juvenil'
  | 'Adulto'
  | 'Master'
  | 'Senior'
  | 'Super Senior';

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
    [weight in WeightClass]?: number | string; // alguns têm "Acima" ou "de"
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
    Galo: 17,
    Pluma: 19,
    Pena: 22,
    Leve: 25,
    Médio: 28,
    'Meio-pesado': 31,
    Pesado: 34,
    'Super-pesado': 37,
    'Pesadissimo A': 40,
    'Pesadissimo B': 43,
    'Pesadissimo C': 46,
  },
  'Infantil A': {
    Galo: 22,
    Pluma: 25,
    Pena: 28,
    Leve: 31,
    Médio: 34,
    'Meio-pesado': 37,
    Pesado: 40,
    'Super-pesado': 43,
    'Pesadissimo A': 46,
    'Pesadissimo B': 49,
    'Pesadissimo C': 52,
  },
  'Infantil B': {
    Galo: 28,
    Pluma: 31,
    Pena: 34,
    Leve: 37,
    Médio: 40,
    'Meio-pesado': 43,
    Pesado: 46,
    'Super-pesado': 49,
    'Pesadissimo A': 52,
    'Pesadissimo B': 56,
    'Pesadissimo C': 58,
  },
  'Infanto Juvenil A': {
    Galo: 33,
    Pluma: 37,
    Pena: 40,
    Leve: 45,
    Médio: 49,
    'Meio-pesado': 53,
    Pesado: 57,
    'Super-pesado': 61,
    'Pesadissimo A': 65,
    'Pesadissimo B': 69,
    'Pesadissimo C': 73,
  },
  'Infanto Juvenil B': {
    Galo: 42,
    Pluma: 46,
    Pena: 49,
    Leve: 53,
    Médio: 58,
    'Meio-pesado': 62,
    Pesado: 66,
    'Super-pesado': 70,
    'Pesadissimo A': 74,
    'Pesadissimo B': 78,
    'Pesadissimo C': 82,
  },
  Juvenil: {
    Galo: 51,
    Pluma: 56,
    Pena: 60,
    Leve: 64,
    Médio: 69,
    'Meio-pesado': 73,
    Pesado: 77,
    'Super-pesado': 82,
    'Pesadissimo A': 'Acima',
    'Pesadissimo B': 'de',
    'Pesadissimo C': 86,
  },
  Adulto: {
    Galo: 55,
    Pluma: 61,
    Pena: 67,
    Leve: 73,
    Médio: 79,
    'Meio-pesado': 85,
    Pesado: 91,
    'Super-pesado': 97,
    'Pesadissimo A': 'Acima',
    'Pesadissimo B': 'de',
    'Pesadissimo C': 97,
  },
  Master: {
    Galo: 55,
    Pluma: 61,
    Pena: 67,
    Leve: 73,
    Médio: 79,
    'Meio-pesado': 85,
    Pesado: 91,
    'Super-pesado': 97,
    'Pesadissimo A': 'Acima',
    'Pesadissimo B': 'de',
    'Pesadissimo C': 97,
  },
  Senior: {
    Galo: 55,
    Pluma: 61,
    Pena: 67,
    Leve: 73,
    Médio: 79,
    'Meio-pesado': 85,
    Pesado: 91,
    'Super-pesado': 97,
    'Pesadissimo A': 'Acima',
    'Pesadissimo B': 'de',
    'Pesadissimo C': 97,
  },
  'Super Senior': {
    Galo: 55,
    Pluma: 61,
    Pena: 67,
    Leve: 73,
    Médio: 79,
    'Meio-pesado': 85,
    Pesado: 91,
    'Super-pesado': 97,
    'Pesadissimo A': 'Acima',
    'Pesadissimo B': 'de',
    'Pesadissimo C': 97,
  },
};

export enum AgeDivision {
  MIRIM = 'Mirim', // 7 anos
  INFANTIL_A = 'Infantil A', // 8 e 9 anos
  INFANTIL_B = 'Infantil B', // 10 e 11 anos
  INFANTO_JUVENIL_A = 'Infanto Juvenil A', // 12 e 13 anos
  INFANTO_JUVENIL_B = 'Infanto Juvenil B', // 14 e 15 anos
  JUVENIL = 'Juvenil', // 16 e 17 anos
  ADULTO = 'Adulto', // 18 a 29 anos
  MASTER = 'Master', // 30 a 34 anos
  SENIOR = 'Senior', // 35 a 39 anos
  SUPER_SENIOR = 'Super Senior', // 40 anos ou mais
}

export type AgeDivisionRange = {
  min: number;
  max: number;
  division: AgeDivision;
};

const divisions = [
  { min: 7, max: 7, division: AgeDivision.MIRIM },
  { min: 8, max: 9, division: AgeDivision.INFANTIL_A },
  { min: 10, max: 11, division: AgeDivision.INFANTIL_B },
  { min: 12, max: 13, division: AgeDivision.INFANTO_JUVENIL_A },
  { min: 14, max: 15, division: AgeDivision.INFANTO_JUVENIL_B },
  { min: 16, max: 17, division: AgeDivision.JUVENIL },
  { min: 18, max: 29, division: AgeDivision.ADULTO },
  { min: 30, max: 34, division: AgeDivision.MASTER },
  { min: 35, max: 39, division: AgeDivision.SENIOR },
  { min: 40, max: Infinity, division: AgeDivision.SUPER_SENIOR },
];

export function getDivisionByAge(age: number): AgeDivisionRange | null {
  // const divisions = [
  //   { min: 7, max: 7, division: AgeDivision.MIRIM },
  //   { min: 8, max: 9, division: AgeDivision.INFANTIL_A },
  //   { min: 10, max: 11, division: AgeDivision.INFANTIL_B },
  //   { min: 12, max: 13, division: AgeDivision.INFANTO_JUVENIL_A },
  //   { min: 14, max: 15, division: AgeDivision.INFANTO_JUVENIL_B },
  //   { min: 16, max: 17, division: AgeDivision.JUVENIL },
  //   { min: 18, max: 29, division: AgeDivision.ADULTO },
  //   { min: 30, max: 34, division: AgeDivision.MASTER },
  //   { min: 35, max: 39, division: AgeDivision.SENIOR },
  //   { min: 40, max: Infinity, division: AgeDivision.SUPER_SENIOR },
  // ];

  return divisions.find((d) => age >= d.min && age <= d.max) || null;
}

export function getAgeDivisionByName(name: string): AgeDivisionRange | null {
  const division = divisions.find(
    (div) => div.division.toUpperCase() === name.toUpperCase(),
  );
  return division || null;
}
