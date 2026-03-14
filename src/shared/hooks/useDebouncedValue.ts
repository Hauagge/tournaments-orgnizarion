'use client';

import { useEffect, useState } from 'react';

export function useDebouncedValue<T>(value: T, delay = 400) {
  const [debounced, setDebounced] = useState<T>(value);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay); // só dispara ao parar
    return () => clearTimeout(id); // cancela enquanto digita
  }, [value, delay]);

  return debounced;
}
