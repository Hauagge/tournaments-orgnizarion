'use client';

import { useEffect, useState } from 'react';
import { Athlete } from '@/app/dashboard';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { useRouter } from 'next/navigation';
import {
  Category,
  useGenerateCategories,
} from '@/app/hooks/useGenerateCategory';
import { useSeparateBracketByAgeGroup } from '@/app/hooks/useSeparateBracketByAgeGroup';

export type BracketCategory = {
  category: Category;
  fights: Array<[string, string]>;
};

type BracketsPageProps = {
  athletes: Array<Athlete>;
};

export default function BracketsPage({ athletes }: BracketsPageProps) {
  const [brackets, setBrackets] = useState<BracketCategory[]>([]);
  const { infantil, juvenil, adulto } = useSeparateBracketByAgeGroup(brackets);

  const router = useRouter();
  function loadFromLocalStorage() {
    const athletes = localStorage.getItem('athletes');
    if (!athletes || JSON.parse(athletes).length === 0) {
      localStorage.clear();
      return;
    }
    const stored = localStorage.getItem('all-brackets');
    if (stored) {
      const parsed = JSON.parse(stored) as Category[];

      setBrackets(
        parsed.map((category) => ({
          category,
          fights: [],
        })) || [],
      );
    }
  }
  // Carregar brackets do localStorage no carregamento inicial
  useEffect(() => {
    loadFromLocalStorage();
  }, []);

  // Função para gerar brackets
  // const generateAllBrackets = () => {
  //   localStorage.removeItem('all-brackets');
  //   const categories = brackets.length
  //     ? brackets.map((b) => b.category.name)
  //     : ca.map((c) => c.name);
  //   console.log('Athletes from localStorage:', categories);

  //   const newBrackets: BracketCategory[] = categories.map((category) => {
  //     const athletesInCategory = athletes.filter(
  //       (a) => a.category?.name === category,
  //     );
  //     const shuffled = [...athletesInCategory].sort(() => Math.random() - 0.5);
  //     console.log('shuffled athletes:', shuffled);
  //     const fights: Array<[string, string]> = [];
  //     for (let i = 0; i < shuffled.length; i += 2) {
  //       const a = shuffled[i];
  //       const b = shuffled[i + 1] || 'W.O.';
  //       fights.push([a.name, b.name]);
  //     }

  //     const ages = athletesInCategory.map((a) => a.age);
  //     const weights = athletesInCategory.map((a) => a.weight);
  //     console.log('ages:', ages);
  //     return {
  //       name: category,
  //       fights,
  //     };
  //   });

  //   localStorage.setItem('all-brackets', JSON.stringify(newBrackets));
  //   setBrackets(newBrackets);
  // };

  const orderedInfantil = infantil;

  return (
    <div className="space-y-6">
      {brackets.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Infantil */}
          <div className="space-y-4 max-h-[600px] overflow-y-auto">
            <h2 className="text-xl font-bold text-center">🧒 Infantil</h2>
            {orderedInfantil.map((bracket) => (
              <Card
                key={bracket.category.name}
                className="cursor-pointer hover:shadow-lg"
                onClick={() =>
                  router.push(
                    `/category/${encodeURIComponent(bracket.category.name)}`,
                  )
                }
              >
                <CardContent className="p-6">
                  <h3 className="text-lg font-bold">{bracket.category.name}</h3>
                  <p>
                    Idade: {bracket.category?.ageDivision.min} -{' '}
                    {bracket.category?.ageDivision.max} anos
                  </p>
                  <p>
                    Peso: {bracket.category?.minWeight} -{' '}
                    {bracket.category?.maxWeight} kg
                  </p>
                  <p>{bracket.fights?.length || 0} lutas</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Juvenil */}
          <div className="space-y-4 max-h-[600px] overflow-y-auto">
            <h2 className="text-xl font-bold text-center">👦 Juvenil</h2>
            {juvenil.map((bracket) => (
              <Card
                key={bracket.category.name}
                className="cursor-pointer hover:shadow-lg"
                onClick={() =>
                  router.push(
                    `/category/${encodeURIComponent(bracket.category.name)}`,
                  )
                }
              >
                <CardContent className="p-6">
                  <h3 className="text-lg font-bold">{bracket.category.name}</h3>
                  <p>
                    Idade: {bracket.category.ageDivision.min} -{' '}
                    {bracket.category.ageDivision.max} anos
                  </p>
                  <p>
                    Peso: {bracket.category.minWeight} -{' '}
                    {bracket.category.maxWeight} kg
                  </p>
                  <p>{bracket.fights?.length || 0} lutas</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Adulto */}
          <div className="space-y-4 max-h-[600px] overflow-y-auto">
            <h2 className="text-xl font-bold text-center">🧑 Adulto</h2>
            {adulto.map((bracket) => (
              <Card
                key={bracket.category.name}
                className="cursor-pointer hover:shadow-lg"
                onClick={() =>
                  router.push(
                    `/category/${encodeURIComponent(bracket.category.name)}`,
                  )
                }
              >
                <CardContent className="p-6">
                  <h3 className="text-lg font-bold">{bracket.category.name}</h3>
                  <p>
                    Idade: {bracket.category.ageDivision.min} -{' '}
                    {bracket.category.ageDivision.max} anos
                  </p>
                  <p>
                    Peso: {bracket.category.minWeight} -{' '}
                    {bracket.category.maxWeight} kg
                  </p>
                  <p>{bracket.fights?.length || 0} lutas</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-center text-lg">
          Nenhuma chave criada. Clique em &quot;Gerar Todas as Chaves&quot; para
          começar.
        </p>
      )}
    </div>
  );
}
