'use client';

import React, { useState, useEffect } from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/app/components/ui/tabs';

import AthleteTabs from './components/Tabs/Athletes';
import BracketTabs from './components/Tabs/Brackets';
import WeighInTabs from './components/Tabs/Weigh-in';
import FightsTab from './components/Tabs/Fights';
import ResultTab from './components/Tabs/Results';
import { useGenerateCategories } from './hooks/useGenerateCategory';
import { useCategoryStore } from './store/useCategoryStore';
import { Athlete } from './types';

export type BracketMap = {
  [category: string]: [string, string][];
};
export default function JiujitsuTournamentUI() {
  const { categories } = useGenerateCategories();
  // const { athletes } = useAthleteStore();
  const { setCategories } = useCategoryStore();

  const [newAthlete, setNewAthlete] = useState<Athlete>({
    id: 0,
    name: '',
    belt: '',
    weight: 0,
    academy: '',
    gender: '',
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

  useEffect(() => {
    setCategories(categories);
  }, [categories, setCategories]);

  return (
    <div className="container p-6 space-y-6 max-w-screen">
      <h1 className="text-3xl font-bold">Painel do Campeonato de Jiu-Jitsu</h1>
      <Tabs defaultValue="atletas">
        <TabsList>
          <TabsTrigger value="atletas">Atletas</TabsTrigger>
          <TabsTrigger value="chaves">Chaves</TabsTrigger>
          <TabsTrigger value="pesagem">Pesagem</TabsTrigger>
          {/* <TabsTrigger value="lutas">Lutas</TabsTrigger> */}
          {/* <TabsTrigger value="resultados">Resultados</TabsTrigger> */}
        </TabsList>

        <AthleteTabs newAthlete={newAthlete} setNewAthlete={setNewAthlete} />

        <BracketTabs />

        <WeighInTabs />
        <FightsTab />

        <ResultTab />
      </Tabs>
    </div>
  );
}
