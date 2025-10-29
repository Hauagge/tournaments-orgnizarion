import { AgeDivisionRange } from '../components/enums/category';
import { CategoryMap } from '../hooks/useImportAthletes';

export type Fight = {
  id: string;
  athletes: [string, string];
  winner?: string;
};

export type Athlete = {
  id?: number;
  name: string;
  belt: BeltsEnum | '';
  weight: number;
  academy: string;
  category: CategoryMap | null;
  age: number;
  isApto?: boolean;
  gender: GenderEnum | '';
  status?: 'Aguardando' | 'Avaliado';
};

export enum GenderEnum {
  Masculino = 'M',
  Feminino = 'F',
}

export enum BeltsEnum {
  BRANCA = 'BRANCA',
  CINZA = 'CINZA',
  AMARELA = 'AMARELA',
  LARANJA = 'LARANJA',
  VERDE = 'VERDE',
  AZUL = 'AZUL',
  ROXA = 'ROXA',
  MARROM = 'MARROM',
  PRETA = 'PRETA',
}

export type FightContextType = {
  athletes: Athlete[];
  fights: Fight[];
  addAthlete: (athlete: Athlete) => void;
  addFight: (fight: Fight) => void;
  setWinner: (fightId: string, winner: string) => void;
};

export type Category = {
  id: number;
  name: string;
  belt: string;
  ageDivision: AgeDivisionRange;
  weightName: string;
  minWeight?: number;
  maxWeight: number;
  athletes: Array<Athlete>; // Inicialmente vazio
};

export type Bracket = {
  category: string;
  athletes: Athlete[];
};
