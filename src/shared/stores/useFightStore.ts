import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Fight = {
  id: string;
  categoryName: string;
  athletes: [string, string];
  winner?: string;
};

type FightStore = {
  fights: Fight[];
  addFight: (fight: Fight) => void;
  setFights: (fights: Fight[]) => void;
  setWinner: (fightId: string, winner: string) => void;
};

export const useFightStore = create<FightStore>()(
  persist(
    (set, get) => ({
      fights: [],
      addFight: (fight) => set((s) => ({ fights: [...s.fights, fight] })),
      setFights: (fights) => set({ fights }),
      setWinner: (fightId, winner) => {
        const updated = get().fights.map((f) =>
          f.id === fightId ? { ...f, winner } : f,
        );
        set({ fights: updated });
      },
    }),
    { name: 'fights-storage' },
  ),
);
