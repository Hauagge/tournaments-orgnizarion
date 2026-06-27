'use client';

import { ChampionAcademiesReport } from '@/features/reports/components/champion-academies-report';
import ReportButtons from '@/features/reports/components/ReportButtons';

export default function ResultTab() {
  return (
    <section className="space-y-6">
      <ReportButtons />
      <ChampionAcademiesReport />
    </section>
  );
}
