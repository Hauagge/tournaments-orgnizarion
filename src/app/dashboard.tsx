'use client';

import React, { useState, useEffect } from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/app/components/ui/tabs';

import {
  CATEGORIES_BY_AGE_WEIGHT,
  getDivisionByAge,
} from './components/enums/category';
import AthleteTabs from './components/Tabs/Athletes';
import BracketTabs from './components/Tabs/Brackets';
import WeighInTabs from './components/Tabs/Weigh-in';
import FightsTab from './components/Tabs/Fights';
import ResultTab from './components/Tabs/Results';
import { CategoryMap } from './hooks/useImportAthletes';
import { useGenerateCategories } from './hooks/useGenerateCategory';

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

export type BracketMap = {
  [category: string]: [string, string][];
};
export default function JiujitsuTournamentUI() {
  // const [brackets, setBrackets] = useState<Array<string>>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedBelt, setSelectedBelt] = useState('');
  const [athletes, setAthletes] = useState<Array<Athlete>>([]);
  const { categories } = useGenerateCategories();

  useEffect(() => {
    localStorage.setItem('all-brackets', JSON.stringify(categories));
  }, [categories]);

  const [newAthlete, setNewAthlete] = useState<Athlete>({
    id: 0,
    name: '',
    belt: '',
    weight: 0,
    academy: '',
    category: {
      name: '',
      minWeight: 0,
      maxWeight: 0,
      maxAge: 0,
      minAge: 0,
      belt: '',
    },
    age: 0,
    isApto: false,
    status: 'Aguardando',
  });
  const [bracketsByCategory, setBracketsByCategory] = useState<{
    [key: string]: Array<[string, string]>;
  }>({});
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('athletes');
      if (stored) {
        setAthletes(JSON.parse(stored));
      }
    }
  }, []);

  useEffect(() => {
    console.log('Athletes updated:', athletes);
    localStorage.setItem('athletes', JSON.stringify(athletes));
  }, [athletes]);

  const generateBracketForCategory = (category: string) => {
    const filteredAthletes = athletes
      .filter((a) => a.category?.name === category)
      .map((a) => a.name);

    if (filteredAthletes.length < 2) {
      alert('Categoria precisa de pelo menos 2 atletas para gerar chave.');
      return;
    }

    const shuffled = [...filteredAthletes].sort(() => Math.random() - 0.5);

    const pairs: Array<[string, string]> = [];

    for (let i = 0; i < shuffled.length; i += 2) {
      const a = shuffled[i];
      const b = shuffled[i + 1] || 'W.O.';
      pairs.push([a, b]);
    }

    setBracketsByCategory((prev) => ({
      ...prev,
      [category]: pairs,
    }));
  };

  useEffect(() => {
    const age = newAthlete.age;
    const weight = Number(newAthlete.weight);
    if (!age || !weight) return;

    const ageDivision = getDivisionByAge(age);
    if (!ageDivision) return;

    const weightMap = CATEGORIES_BY_AGE_WEIGHT[ageDivision.division];
    if (!weightMap) return;

    const matchingCategory = Object.entries(weightMap).find(
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      ([_, maxWeight]) => typeof maxWeight === 'number' && weight <= maxWeight,
    );

    if (matchingCategory) {
      setNewAthlete((prev) => ({
        ...prev,
        category: {
          name: matchingCategory[0],
          minWeight: parseFloat(String(ageDivision.min)),
          maxWeight: parseFloat(String(ageDivision.max)),
          maxAge: ageDivision.max,
          minAge: ageDivision.min,
          belt: newAthlete.belt,
        },
      }));
    } else {
      setNewAthlete((prev) => ({
        ...prev,
        category: {
          name: 'Sem categoria',
          minWeight: 0,
          maxWeight: 0,
          maxAge: 0,
          minAge: 0,
          belt: newAthlete.belt,
        },
      }));
    }
  }, [newAthlete.age, newAthlete.weight]);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Painel do Campeonato de Jiu-Jitsu</h1>
      <Tabs defaultValue="atletas">
        <TabsList>
          <TabsTrigger value="atletas">Atletas</TabsTrigger>
          <TabsTrigger value="chaves">Chaves</TabsTrigger>
          <TabsTrigger value="pesagem">Pesagem</TabsTrigger>
          <TabsTrigger value="lutas">Lutas</TabsTrigger>
          <TabsTrigger value="resultados">Resultados</TabsTrigger>
        </TabsList>

        <AthleteTabs
          athletes={athletes}
          setAthletes={setAthletes}
          newAthlete={newAthlete}
          setNewAthlete={setNewAthlete}
        />

        <BracketTabs
          athletes={athletes}
          brackets={bracketsByCategory}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          selectedBelt={selectedBelt}
          setSelectedBelt={setSelectedBelt}
          generateBracket={generateBracketForCategory}
        />

        <WeighInTabs athletes={athletes} setAthletes={setAthletes} />
        <FightsTab />

        <ResultTab />
      </Tabs>
    </div>
  );
}
