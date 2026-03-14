'use client';

import Link from 'next/link';
import { ArrowUpRight, Swords, Trophy, UsersRound } from 'lucide-react';
import { useAthleteStore } from '@/shared/stores/useAthleteStore';
import { useCategoryStore } from '@/shared/stores/useCategoryStore';

export default function DashboardPage() {
  const { athletes } = useAthleteStore();
  const { categories } = useCategoryStore();
  const averageByKey =
    categories.length > 0 ? (athletes.length / categories.length).toFixed(1) : '0';
  const fightsCount = categories.reduce(
    (total, category) => total + Math.floor((category.athletes?.length ?? 0) / 2),
    0,
  );

  const quickLinks = [
    {
      href: '/athletes',
      title: 'Cadastre os atletas',
      description: 'Gerencie atletas manualmente ou por importacao.',
    },
    {
      href: '/weigh-in',
      title: 'Execute a pesagem',
      description: 'Importe CSV e valide aptidao para competir.',
    },
    {
      href: '/categories',
      title: 'Monte as chaves',
      description: 'Organize categorias e exporte os PDFs.',
    },
  ];

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-5xl font-extrabold tracking-tight">Dashboard</h1>
          <p className="mt-3 text-xl text-slate-600">
            Visao geral do torneio e atalhos para as areas administrativas.
          </p>
        </div>
      </header>

      <section className="grid gap-4 lg:grid-cols-3">
        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-2xl text-slate-600">Total de Atletas</p>
          <div className="mt-2 flex items-end justify-between">
            <p className="text-6xl font-black">{athletes.length}</p>
            <div className="rounded-xl bg-blue-100 p-4 text-blue-600">
              <UsersRound className="h-7 w-7" />
            </div>
          </div>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-2xl text-slate-600">Categorias Criadas</p>
          <div className="mt-2 flex items-end justify-between">
            <p className="text-6xl font-black">{categories.length}</p>
            <div className="rounded-xl bg-emerald-100 p-4 text-emerald-600">
              <Trophy className="h-7 w-7" />
            </div>
          </div>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-2xl text-slate-600">Media por Chave</p>
          <div className="mt-2 flex items-end justify-between">
            <p className="text-6xl font-black">{averageByKey}</p>
            <div className="rounded-xl bg-violet-100 p-4 text-violet-600">
              <ArrowUpRight className="h-7 w-7" />
            </div>
          </div>
        </article>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-3xl font-bold tracking-tight">Fluxo operacional</h2>
          <div className="mt-6 grid gap-4">
            {quickLinks.map((link, index) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-xl border border-slate-200 bg-slate-50 p-4 transition hover:bg-slate-100"
              >
                <p className="text-sm font-semibold text-slate-500">Passo {index + 1}</p>
                <p className="mt-1 text-xl font-semibold">{link.title}</p>
                <p className="mt-1 text-slate-600">{link.description}</p>
              </Link>
            ))}
          </div>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-3xl font-bold tracking-tight">Operacao atual</h2>
          <div className="mt-6 grid gap-4">
            <div className="rounded-xl bg-slate-50 p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-slate-900 p-2 text-white">
                  <Swords className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">Estimativa de lutas</p>
                  <p className="text-2xl font-bold">{fightsCount}</p>
                </div>
              </div>
            </div>
            <div className="rounded-xl border-l-4 border-blue-600 bg-blue-50 p-4">
              <p className="text-lg font-semibold">Separacao recomendada</p>
              <p className="mt-2 text-slate-700">
                Use `weigh-in` para homologacao dos atletas antes de gerar as categorias.
              </p>
            </div>
            <div className="rounded-xl border-l-4 border-emerald-600 bg-emerald-50 p-4">
              <p className="text-lg font-semibold">Proximo passo</p>
              <p className="mt-2 text-slate-700">
                Gere ou revise as chaves em `categories` antes de publicar a ordem das lutas.
              </p>
            </div>
          </div>
        </article>
      </section>
    </div>
  );
}
