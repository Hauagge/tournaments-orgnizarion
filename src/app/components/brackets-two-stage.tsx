'use client';

import React, { useState } from 'react';

type BracketProps = {
  children: React.ReactNode;
  lastStage?: boolean;
  onClick?: () => void;
  isActive?: boolean;
};

const Box = ({
  children,
  lastStage = false,
  onClick,
  isActive = false,
}: BracketProps) => (
  <div
    className={`flex items-center cursor-pointer select-one`}
    onClick={onClick}
  >
    <div
      className={`w-50 h-20 rounded-lg border border-gray-400 bg-white flex items-center justify-center shadow  ${
        isActive ? 'ring-2 ring-green-500' : ''
      }`}
    >
      {children}
    </div>
    {/* Linha para direita */}

    {!lastStage && <div className="h-0.5 w-10 bg-gray-400"></div>}
  </div>
);

export default function Bracket() {
  const [semis, setSemis] = useState<[string | null, string | null]>([
    null,
    null,
  ]);
  const [finalWinner, setFinalWinner] = useState<string | null>(null);

  function handleFinal(winner: string) {
    setFinalWinner(winner);
  }

  function handleSemi(idx: 0 | 1, winner: string) {
    const next = [...semis] as [string | null, string | null];
    next[idx] = winner;
    setSemis(next);
    // Reset final se semifinal mudou
    setFinalWinner(null);
  }
  return (
    <div className="flex items-center justify-between min-h-screen min-w-screen bg-gray-50">
      <div className="flex">
        <div className="flex flex-col  h-200 justify-between">
          <Box
            onClick={() => handleSemi(0, 'Lutador 1')}
            isActive={semis[0] === 'Lutador 1'}
          >
            <p>Lutador 1</p>
          </Box>

          <Box
            onClick={() => handleSemi(0, 'Lutador 2')}
            isActive={semis[0] === 'Lutador 2'}
          >
            <p>Lutador 2</p>
          </Box>

          <Box
            onClick={() => handleSemi(1, 'Lutador 3')}
            isActive={semis[1] === 'Lutador 3'}
          >
            <p>Lutador 3</p>
          </Box>

          <Box
            onClick={() => handleSemi(1, 'Lutador 4')}
            isActive={semis[1] === 'Lutador 4'}
          >
            <p>Lutador 4</p>
          </Box>
        </div>

        {/* Linhas verticais ligando quartas às semifinais */}
        <div className="relative h-64 w-10">
          {/* Conexão entre Lutador 1 e Lutador 2 */}
          <div className="relative left-0 top-[160px] w-10 h-0.5 bg-gray-400"></div>
          <div className="relative left-0 top-[37px] w-0.5 h-[242px] bg-gray-400"></div>
          {/* Conexão entre Lutador 3 e Lutador 4 */}
          <div className="relative left-0 top-[390px] w-10 h-0.5 bg-gray-400"></div>
          <div className="relative left-0 top-[273px] w-0.5 h-[242px] bg-gray-400"></div>
        </div>

        {/* Semifinais */}
        <div className="flex flex-col justify-between h-150">
          <div className="flex items-center mt-[120px]">
            <Box
              lastStage
              onClick={() => handleFinal(semis[0] || '')}
              isActive={finalWinner === semis[0]}
            >
              <p>{semis[0] || 'Vencedor'}</p>
            </Box>
          </div>
          <div className="mt-[400px]">
            <Box
              lastStage
              onClick={() => handleFinal(semis[1] || '')}
              isActive={finalWinner === semis[1]}
            >
              <p>{semis[1] || 'Vencedor 2'}</p>
            </Box>
          </div>
        </div>

        {/* Linha vertical conectando semifinal à final */}
        <div className="relative h-64 w-10">
          <div className="relative left-0 top-[159px] w-0.5 h-[482px] bg-gray-400"></div>
          <div className="relative left-0 top-[-80px] w-10 h-0.5 bg-gray-400"></div>
        </div>

        {/* Final */}
        <div className="flex flex-col justify-center h-200">
          <div className="flex items-center mt-[10px]">
            <Box lastStage>
              <p>{finalWinner || 'Campeão'}</p>
            </Box>
          </div>
        </div>
      </div>
    </div>
  );
}
