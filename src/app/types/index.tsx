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
  belt: string;
  weight: number;
  academy: string;
  category: CategoryMap | null;
  age: number;
  isApto?: boolean;
  status?: 'Aguardando' | 'Avaliado';
};

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
  fights?: Array<Fight>; // Inicialmente vazio
};
