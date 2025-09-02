type RoundProps = {
  athletes: string[];
  slots: number; // ex: 16, 8, 4, 2
  onWinner?: (fightIndex: number, winner: string) => void;
};

export function Round({ athletes, slots, onWinner }: RoundProps) {
  if (athletes.length < slots / 2) {
    return null;
  }
  // normaliza para caber nos slots
  const normalized = [...athletes];
  while (normalized.length < slots) {
    normalized.push('W.O.');
  }

  const fights: [string, string][] = [];
  for (let i = 0; i < normalized.length; i += 2) {
    fights.push([normalized[i], normalized[i + 1]]);
  }

  console.log('Comp', fights.length < slots / 2);
  console.log('qtd', fights.length);
  console.log('half', slots / 2);

  return (
    <div className="space-y-4">
      {fights.map(([a, b], idx) => {
        if (a === 'W.O.' && b === 'W.O.') return null;

        return (
          <div
            key={idx}
            className="flex justify-between items-center p-3 border rounded-lg bg-red-900/40"
          >
            <button
              className={`flex-1 text-center px-2 py-1 rounded
              hover:bg-red-700/40 ${a === 'W.O.' ? 'opacity-50' : ''}`}
              disabled={a === 'W.O.'}
              onClick={() => onWinner?.(idx, a)}
            >
              {a}
            </button>

            <span className="mx-3 text-slate-200 font-semibold">vs</span>

            <button
              className={`flex-1 text-center px-2 py-1 rounded
              hover:bg-red-700/40 ${b === 'W.O.' ? 'opacity-50' : ''}`}
              disabled={b === 'W.O.'}
              onClick={() => onWinner?.(idx, b)}
            >
              {b}
            </button>
          </div>
        );
      })}
    </div>
  );
}
