import React from 'react';
// Tipos
interface TeamProps {
  name: string;
  isWinner?: boolean;
  isBye?: boolean;
}

interface MatchBoxProps {
  team1: string;
  team2: string;
  connectIds?: string[];
  isWinner?: boolean;
  isBye?: boolean;
  roundType?: 'round-1' | 'round-2' | 'final';
  matchIndex?: number;
}

interface RoundProps {
  label: string;
  matches: MatchBoxProps[];
  roundType: 'round-1' | 'round-2' | 'final';
}

// Componentes
const Team: React.FC<TeamProps> = ({
  name,
  isWinner = false,
  isBye = false,
}) => {
  if (isBye) {
    return (
      <div
        className="
        p-3 min-h-10 text-center italic text-gray-300 border-2 border-dashed border-gray-400
        bg-gray-600 bg-opacity-20
      "
      >
        {name || 'Bye'}
      </div>
    );
  }

  return (
    <div
      className={`
      p-3 min-h-10 relative
      ${
        isWinner
          ? 'bg-green-600 flex justify-center items-center w-[151px] py-6'
          : 'bg-opacity-60 bg-gray-700 '
      }
      ${!isWinner && 'border-b-2 border-gray-600 '}
    `}
    >
      {name}
      {isWinner && <span className="ml-2">🏆</span>}
    </div>
  );
};

const ConnectRight = ({ isJumpPhase = false }: { isJumpPhase?: boolean }) => (
  <div
    className={`
    absolute bg-gray-500 h-[2px] w-[65px] top-1/2 right-[-65px]
    ${isJumpPhase ? 'bg-opacity-50' : ''}
  `}
  ></div>
);

const ConnectDown: React.FC<{
  ids: string[];
  roundType: string;
  matchIndex?: number;
}> = ({ ids, roundType, matchIndex }) => {
  const getHeight = () => {
    if (roundType === 'round-1') {
      if (matchIndex === 0 || matchIndex === 2) return 'h-[74px] top-1/2';
      if (matchIndex === 1 || matchIndex === 3) return 'h-[80px] bottom-1/2';
    }
    if (roundType === 'round-2') {
      if (matchIndex === 0) return 'h-[185px] top-1/2';
      if (matchIndex === 1) return 'h-[195px] bottom-1/2';
    }
    if (roundType === 'final') return 'h-[300px] bottom-[-65%]';
    return 'h-[100px] top-1/2';
  };

  const getMargin = () => {
    if (
      ids.includes('chave1') ||
      ids.includes('chave3') ||
      ids.includes('chave5') ||
      ids.includes('chave7')
    )
      return 'mt-[35px]';
    if (
      ids.includes('chave2') ||
      ids.includes('chave4') ||
      ids.includes('chave6') ||
      ids.includes('chave8')
    )
      return 'mt-[-40px]';
    return '';
  };

  return (
    <div
      className={`absolute right-[-65px] w-[2px] bg-gray-500 ${getHeight()} ${getMargin()}`}
    >
      {ids.map((id) => (
        <span key={id} id={id}></span>
      ))}
    </div>
  );
};

const MatchBox: React.FC<MatchBoxProps> = ({
  team1,
  team2,
  connectIds = [],
  isWinner = false,
  isBye = false,
  roundType = 'round-1',
  matchIndex = 0,
}) => (
  <div
    className={`
    relative border-2 rounded-md bg-gray-700 bg-opacity-60 border-gray-600
    ${roundType === 'final' ? 'border-blue-300 border-opacity-10' : ''}
    ${roundType === 'round-2' && matchIndex === 1 ? 'mt-[211px]' : ''}
    ${roundType === 'final' ? 'mt-[300px]' : ''}
    w-[200px]
  `}
  >
    <Team name={team1} isWinner={isWinner && !team2} isBye={isBye && !team1} />
    {team2 && (
      <Team
        name={team2}
        isWinner={isWinner && !!team2}
        isBye={isBye && !team2}
      />
    )}
    <ConnectRight isJumpPhase={roundType === 'final'} />
    {connectIds.length > 0 && (
      <>
        <ConnectDown
          ids={connectIds}
          roundType={roundType}
          matchIndex={matchIndex}
        />
      </>
    )}
  </div>
);

const Round: React.FC<RoundProps> = ({ label, matches, roundType }) => (
  <div
    className={`
    flex flex-col gap-20 mx-[60px] relative
    ${roundType === 'round-2' ? 'mt-[100px] ml-[68px]' : ''}
    ${roundType === 'final' ? 'ml-[68px]' : ''}
  `}
  >
    <h3 className="text-xl font-bold text-white text-center sticky top-0 z-10 py-2 bg-blue-800 bg-opacity-70 rounded">
      {label}
    </h3>
    <div className="flex flex-col gap-[80px]">
      {matches.map((match, index) => (
        <MatchBox
          key={index}
          {...match}
          roundType={roundType}
          matchIndex={index}
        />
      ))}
    </div>
  </div>
);

// Componente principal
interface TournamentBracketProps {
  category?: string;
  belt?: string;
}

const TournamentBracket: React.FC<TournamentBracketProps> = ({
  category = 'Juvenil',
  belt = 'Faixa azul',
}) => {
  const nextPowerOfTwo = (n: number) =>
    Math.pow(2, Math.ceil(Math.log2(n)) || 1);
  const athletes = [
    'Atleta 1',
    'Atleta 2',
    'Atleta 3',
    'Atleta 4',
    'Atleta 5',
    'Atleta 6',
    'Atleta 7',
    'Atleta 8',
  ];
  const createBracketRounds = (participants: string[]) => {
    const numParticipants = participants.length;
    const totalSlots = nextPowerOfTwo(numParticipants);
    const rounds: RoundProps[] = [];
    let idCounter = 1;

    // Preencher com byes se necessário
    const filledParticipants = [...participants];
    while (filledParticipants.length < totalSlots) {
      filledParticipants.push('');
    }

    // Primeira rodada
    let currentMatches: MatchBoxProps[] = [];
    for (let i = 0; i < filledParticipants.length; i += 2) {
      const isBye1 = !filledParticipants[i];
      const isBye2 = !filledParticipants[i + 1];

      currentMatches.push({
        team1: isBye1 ? '' : filledParticipants[i],
        team2: isBye2 ? '' : filledParticipants[i + 1],
        connectIds: [`chave${idCounter++}`],
        isBye: isBye1 || isBye2,
        roundType: 'round-1',
      });
    }
    rounds.push({
      label: 'Primeira Fase',
      matches: currentMatches,
      roundType: 'round-1',
    });

    // Rodadas subsequentes
    let roundNumber = 2;
    while (currentMatches.length > 1) {
      const nextMatches: MatchBoxProps[] = [];
      const nextMatchesCount = Math.ceil(currentMatches.length / 2);
      const isFinal = nextMatchesCount === 1;

      for (let i = 0; i < nextMatchesCount; i++) {
        const match1 = currentMatches[i * 2];
        const match2 = currentMatches[i * 2 + 1] || { team1: '', team2: '' };

        nextMatches.push({
          team1: match1.team1 || match1.team2 ? `Vencedor ${i * 2 + 1}` : '',
          team2: match2?.team1 || match2?.team2 ? `Vencedor ${i * 2 + 2}` : '',
          connectIds: isFinal
            ? [`chave${idCounter++}`, `chave${idCounter++}`]
            : [`chave${idCounter++}`],
          roundType: isFinal
            ? 'final'
            : nextMatchesCount === 2
            ? 'round-2'
            : 'round-1',
        });
      }

      const roundLabel = isFinal
        ? 'Final'
        : nextMatchesCount === 2
        ? 'Semifinais'
        : `Rodada ${roundNumber}`;

      rounds.push({
        label: roundLabel,
        matches: nextMatches,
        roundType: isFinal
          ? 'final'
          : nextMatchesCount === 2
          ? 'round-2'
          : 'round-1',
      });
      currentMatches = nextMatches;
      roundNumber++;
    }

    return rounds;
  };

  const rounds = createBracketRounds(athletes);

  return (
    <div
      className="
      font-sans bg-blue-600 bg-opacity-70 p-10
      border-t border-b border-blue-800 border-opacity-10
    "
    >
      <div className="flex flex-col items-center justify-center gap-5 mb-10">
        <h1 className="text-3xl font-bold text-white">{category}</h1>
        <h2 className="text-xl text-white opacity-90">{belt}</h2>
      </div>

      <div className="flex justify-center min-w-[800px] overflow-auto py-5">
        {rounds.map((round, index) => (
          <Round
            key={index}
            label={round.label}
            matches={round.matches}
            roundType={round.roundType}
          />
        ))}
      </div>
    </div>
  );
};

export default TournamentBracket;
