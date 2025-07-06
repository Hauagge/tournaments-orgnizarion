import React from 'react';

export default function FightBracket({
  athletes = ['Lutador 1', 'Lutador 2'],
}) {
  return (
    <div className="flex items-center justify-start  h-64 ">
      {/* Esquerda: Lados dos atletas */}
      <div className="flex flex-col justify-between h-40">
        <div className="flex items-center">
          <div className="w-40 h-10 rounded-lg border border-gray-300 bg-white flex items-center justify-center shadow">
            {athletes[0]}
          </div>
          {/* Linha horizontal para direita */}
          <div className="h-0.5 w-8 bg-gray-400"></div>
        </div>
        <div className="flex items-center">
          <div className="w-40 h-10 rounded-lg border border-gray-300 bg-white flex items-center justify-center shadow">
            {athletes[1]}
          </div>
          {/* Linha horizontal para direita */}
          <div className="h-0.5 w-8 bg-gray-400"></div>
        </div>
      </div>

      {/* Conexão vertical */}
      <div className="relative left-[-2px] w-0.5 h-30 bg-gray-400">
        {/* Linha vertical conectando os dois horizontais */}
        <div className="absolute left-0 top-1/2 w-9 h-0.5 bg-gray-400"></div>
      </div>

      {/* Direita: Avanço na chave */}
      {/* <div className="flex items-center ml-8">
        <div className="w-40 h-10 rounded-lg border border-gray-300 bg-white flex items-center justify-center shadow">
          Vencedor
        </div>
      </div> */}
    </div>
  );
}
