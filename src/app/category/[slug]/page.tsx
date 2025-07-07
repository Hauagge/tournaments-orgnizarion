'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { BracketCategory } from '@/app/components/Cards';

// Suponha que você passe brackets como prop global ou puxe de algum storage/localStorage/api

export default function CategoryPage() {
  const router = useRouter();
  const { slug } = useParams();

  const [bracket, setBracket] = useState<BracketCategory | undefined>();

  useEffect(() => {
    const stored = localStorage.getItem(`bracket-${slug}`);
    if (stored) {
      const parsed = JSON.parse(stored) as BracketCategory;
      if (parsed.category.name === slug) {
        setBracket(parsed);
      }
    }
  }, [slug]);

  if (!bracket) {
    return (
      <div className="p-6">
        <p>Categoria não encontrada.</p>
        <Button onClick={() => router.back()}>Voltar</Button>
      </div>
    );
  }

  const generateRounds = (fights: Array<[string, string]>) => {
    const rounds = [];
    let current = fights;

    while (current.length > 0) {
      rounds.push(current);

      const next: Array<[string, string]> = [];

      for (let i = 0; i < current.length; i += 2) {
        const winnerA = `Vencedor ${i + 1}`;
        const winnerB = current[i + 1] ? `Vencedor ${i + 2}` : 'W.O.';
        next.push([winnerA, winnerB]);
      }

      if (next.length === 1) break;
      current = next;
    }

    return rounds;
  };

  const rounds = generateRounds(bracket.fights);

  return (
    <div className="space-y-6 p-6">
      <Button onClick={() => router.back()}>Voltar</Button>

      <h1 className="text-2xl font-bold">
        Chave completa da categoria: {bracket.category.name}
      </h1>

      {rounds.map((round, idx) => (
        <Card key={idx}>
          <CardContent className="p-6 space-y-4">
            <h2 className="text-xl font-bold">Fase {idx + 1}</h2>
            {round.map((pair, index) => (
              <div
                key={index}
                className="flex justify-between border p-4 rounded-md"
              >
                <span>{pair[0]}</span>
                <span className="font-bold">VS</span>
                <span>{pair[1]}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
