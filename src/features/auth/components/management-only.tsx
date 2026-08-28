'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { RoleGuard } from '@/features/auth/components/role-guard';
import { Card, CardContent } from '@/shared/ui/card';

function AccessDeniedCard() {
  return (
    <Card className="border-4 border-slate-900 p-0 shadow-[6px_6px_0_0_rgba(15,23,42,0.95)]">
      <CardContent className="space-y-3 p-6">
        <p className="text-sm font-black uppercase tracking-[0.18em] text-slate-500">
          Acesso restrito
        </p>
        <h1 className="text-2xl font-black text-slate-950">
          Esta tela é da mesa e da organização
        </h1>
        <p className="text-sm text-slate-600">
          Seu perfil acompanha a competição pelas telas de áreas e de lutas.
        </p>
        <div className="flex flex-wrap gap-3 pt-2">
          <Link
            href="/areas"
            className="inline-flex rounded-xl border-2 border-slate-900 bg-white px-4 py-2 text-sm font-black uppercase tracking-[0.12em] text-slate-900"
          >
            Áreas
          </Link>
          <Link
            href="/fights"
            className="inline-flex rounded-xl border-2 border-slate-900 bg-slate-900 px-4 py-2 text-sm font-black uppercase tracking-[0.12em] text-white"
          >
            Lutas
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

/** Telas de preparacao e operacao: fora do alcance do perfil staff. */
export function ManagementOnly({ children }: { children: ReactNode }) {
  return (
    <RoleGuard allow={['DESK', 'ORGANIZATION']} fallback={<AccessDeniedCard />}>
      {children}
    </RoleGuard>
  );
}
