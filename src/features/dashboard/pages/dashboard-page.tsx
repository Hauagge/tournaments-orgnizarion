'use client';

import React, { useState } from 'react';
import { Trophy, UsersRound, ArrowUpRight } from 'lucide-react';
import { Tabs, TabsContent } from '@/app/components/ui/tabs';
import { useAthleteStore } from './store/useAthleteStore';
import { useCategoryStore } from './store/useCategoryStore';

import AthleteTabs from './components/Tabs/Athletes';
import BracketTabs from './components/Tabs/Brackets';
import WeighInTabs from './components/Tabs/Weigh-in';
import FightsTab from './components/Tabs/Fights';
import ResultTab from './components/Tabs/Results';
import { Athlete } from './types';

export type BracketMap = {
  [category: string]: [string, string][];
};
export default function JiujitsuTournamentUI() {
  const { athletes } = useAthleteStore();
  const { categories } = useCategoryStore();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [createAthleteSignal, setCreateAthleteSignal] = useState(0);
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

  const averageByKey =
    categories.length > 0 ? (athletes.length / categories.length).toFixed(1) : '0';

  const navItems = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'atletas', label: 'Atletas' },
    { id: 'chaves', label: 'Chaves' },
    { id: 'pesagem', label: 'Importar' },
  ];

  const setupSteps = [
    {
      number: 1,
      title: 'Cadastre os Atletas',
      description: 'Individual ou em massa via CSV',
      color: 'bg-blue-600',
      onClick: openCreateAthlete,
    },
    {
      number: 2,
      title: 'Gere as Chaves',
      description: 'Automático por peso e idade',
      color: 'bg-emerald-600',
      onClick: () => setActiveTab('chaves'),
    },
    {
      number: 3,
      title: 'Exporte e Compete',
      description: 'PDF para impressão ou digital',
      color: 'bg-violet-600',
      onClick: () => setActiveTab('chaves'),
    },
  ];

  function openCreateAthlete() {
    setActiveTab('atletas');
    setCreateAthleteSignal((prev) => prev + 1);
  }

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <div className="flex min-h-screen bg-slate-100 text-slate-900">
        <aside className="hidden w-64 border-r border-slate-200 bg-white md:flex md:flex-col">
          <div className="px-6 py-8">
            <p className="text-3xl font-extrabold tracking-tight text-slate-900">TourneyPro</p>
            <p className="mt-1 text-sm text-slate-500">Gestao de Torneios</p>
          </div>
          <nav className="space-y-2 px-4">
            {navItems.map((item) => {
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex w-full items-center justify-between rounded-xl px-4 py-3 text-left text-base font-semibold transition ${
                    active ? 'bg-slate-950 text-white shadow' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span>{item.label}</span>
                  {active && <span className="h-2 w-2 rounded-full bg-blue-500" />}
                </button>
              );
            })}
          </nav>
        </aside>

        <main className="flex-1 p-5 md:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-5xl font-extrabold tracking-tight">Dashboard</h1>
              <p className="mt-3 text-xl text-slate-600">
                Gerencie seus atletas e organize competicoes automaticamente
              </p>
            </div>
          </div>

          <div className="mt-7 grid gap-4 lg:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-2xl text-slate-600">Total de Atletas</p>
              <div className="mt-2 flex items-end justify-between">
                <p className="text-6xl font-black">{athletes.length}</p>
                <div className="rounded-xl bg-blue-100 p-4 text-blue-600">
                  <UsersRound className="h-7 w-7" />
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-2xl text-slate-600">Chaves Criadas</p>
              <div className="mt-2 flex items-end justify-between">
                <p className="text-6xl font-black">{categories.length}</p>
                <div className="rounded-xl bg-emerald-100 p-4 text-emerald-600">
                  <Trophy className="h-7 w-7" />
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-2xl text-slate-600">Media por Chave</p>
              <div className="mt-2 flex items-end justify-between">
                <p className="text-6xl font-black">{averageByKey}</p>
                <div className="rounded-xl bg-violet-100 p-4 text-violet-600">
                  <ArrowUpRight className="h-7 w-7" />
                </div>
              </div>
            </div>
          </div>

          <TabsContent value="dashboard">
            <div className="mt-6 grid gap-6 xl:grid-cols-2">
              <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-5xl font-extrabold tracking-tight">Comece Agora</h2>
                <p className="mt-2 text-2xl text-slate-500">
                  Configure seu torneio em poucos passos simples
                </p>
                <div className="mt-6 space-y-4">
                  {setupSteps.map((step) => (
                    <button
                      key={step.number}
                      onClick={step.onClick}
                      className="flex w-full items-center gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-left transition hover:bg-slate-100"
                    >
                      <span
                        className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold text-white ${step.color}`}
                      >
                        {step.number}
                      </span>
                      <div>
                        <p className="text-2xl font-semibold">{step.title}</p>
                        <p className="text-xl text-slate-600">{step.description}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-5xl font-extrabold tracking-tight">Regras do Sistema</h2>
                <p className="mt-2 text-2xl text-slate-500">Como funcionam as chaves automaticas</p>
                <div className="mt-6 space-y-4">
                  <div className="rounded-xl border-l-4 border-blue-600 bg-blue-50 p-4">
                    <p className="text-2xl font-semibold">Categorias por Idade</p>
                    <ul className="mt-2 list-disc pl-5 text-xl text-slate-700">
                      <li>6-9 anos: diferenca maxima de 3kg</li>
                      <li>10-13 anos: diferenca maxima de 4kg</li>
                      <li>14-16 anos: diferenca maxima de 5kg</li>
                    </ul>
                  </div>
                  <div className="rounded-xl border-l-4 border-emerald-600 bg-emerald-50 p-4">
                    <p className="text-2xl font-semibold">Chaveamento Inteligente</p>
                    <ul className="mt-2 list-disc pl-5 text-xl text-slate-700">
                      <li>Grupos de ate 4 atletas</li>
                      <li>Atletas orfaos formam chaves de 2</li>
                      <li>Busca pelo peso mais proximo</li>
                    </ul>
                  </div>
                  <div className="rounded-xl border-l-4 border-violet-600 bg-violet-50 p-4">
                    <p className="text-2xl font-semibold">Exportacao e Filtros</p>
                    <ul className="mt-2 list-disc pl-5 text-xl text-slate-700">
                      <li>Chaves em formato PDF</li>
                      <li>Filtros por academia, peso, faixa</li>
                      <li>Busca por similaridade</li>
                    </ul>
                  </div>
                </div>
              </section>
            </div>
          </TabsContent>

          <div className="mt-6">
            <AthleteTabs
              newAthlete={newAthlete}
              setNewAthlete={setNewAthlete}
              createAthleteSignal={createAthleteSignal}
            />
            <BracketTabs />
            <WeighInTabs />
            <FightsTab />
            <ResultTab />
          </div>
        </main>
      </div>
    </Tabs>
  );
}
