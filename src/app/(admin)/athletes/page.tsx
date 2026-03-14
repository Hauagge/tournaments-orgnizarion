'use client';

import { useState } from 'react';
import AthletesTab from '@/features/athletes/components/athletes-tab';
import { Athlete } from '@/shared/lib/types';

function createEmptyAthlete(): Athlete {
  return {
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
  };
}

export default function AthletesRoute() {
  const [newAthlete, setNewAthlete] = useState<Athlete>(createEmptyAthlete);

  return (
    <AthletesTab
      newAthlete={newAthlete}
      setNewAthlete={setNewAthlete}
    />
  );
}
