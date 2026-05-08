'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { CompetitionSwitcher } from '@/features/competitions/components/competition-switcher';
import { CompetitionSectionNav } from '@/features/competitions/components/competition-section-nav';
import { AUTH_TOKEN_STORAGE_KEY, useAuthStore } from '@/features/auth/stores/useAuthStore';
import { Button } from '@/shared/ui/button';

const navItems = [
  { href: '/dashboard', label: 'Painel' },
  { href: '/competitions', label: 'Competições' },
];

export default function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const router = useRouter();
  const pathname = usePathname();
  const token = useAuthStore((state) => state.token);
  const username = useAuthStore((state) => state.username);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const clearSession = useAuthStore((state) => state.clearSession);

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }

    if (!token && pathname !== '/login') {
      router.replace('/login');
    }
  }, [hasHydrated, pathname, router, token]);

  useEffect(() => {
    if (!hasHydrated || typeof window === 'undefined') {
      return;
    }

    if (token) {
      localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
      return;
    }

    localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
  }, [hasHydrated, token]);

  function handleLogout() {
    clearSession();
    if (typeof window !== 'undefined') {
      localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
    }
    router.replace('/login');
  }

  if (!hasHydrated || !token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
        <div className="rounded-2xl border-2 border-slate-300 bg-white px-6 py-4 text-slate-600">
          Validando sessão...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <div className="mx-auto flex min-h-screen max-w-[1600px] flex-col md:flex-row">
        <aside className="border-b border-slate-200 bg-white md:min-h-screen md:w-72 md:border-b-0 md:border-r">
          <div className="px-6 py-8">
            <p className="text-3xl font-extrabold tracking-tight">TourneyPro</p>
            <p className="mt-1 text-sm text-slate-500">
              Gestao administrativa do torneio
            </p>
          </div>
          <nav className="grid gap-2 px-4 pb-6">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-xl px-4 py-3 text-base font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-950"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="px-4 pb-6">
            <p className="mb-3 px-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
              {username || 'Usuário autenticado'}
            </p>
            <Button type="button" variant="outline" className="w-full" onClick={handleLogout}>
              Sair
            </Button>
          </div>
        </aside>
        <main className="flex-1 p-5 md:p-8">
          <div className="mb-6 flex justify-end">
            <CompetitionSwitcher />
          </div>
          <CompetitionSectionNav />
          {children}
        </main>
      </div>
    </div>
  );
}
