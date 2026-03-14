import React, { createContext, useContext, useState } from 'react';

type SelectProps = {
  value?: string;
  initialValue?: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
};

type SelectContextType = {
  currentValue: string;
  onChange: (value: string) => void;
  isOpen: boolean;
  toggleOpen: () => void;
  close: () => void;
};

const SelectContext = createContext<SelectContextType | null>(null);

export function Select({
  children,
  onValueChange,
  initialValue = '',
  value,
}: SelectProps) {
  const [internalValue, setInternalValue] = useState(initialValue);
  const [isOpen, setIsOpen] = useState(false);

  const handleChange = (val: string) => {
    setInternalValue(val);
    onValueChange(val);
    setIsOpen(false); // fecha após seleção
  };

  const currentValue = value ?? internalValue;

  return (
    <SelectContext.Provider
      value={{
        currentValue,
        onChange: handleChange,
        isOpen,
        toggleOpen: () => setIsOpen((prev) => !prev),
        close: () => setIsOpen(false),
      }}
    >
      <div className="relative inline-block w-full">{children}</div>
    </SelectContext.Provider>
  );
}

export function SelectTrigger({ children }: { children: React.ReactNode }) {
  const ctx = useContext(SelectContext);
  if (!ctx) return null;

  return (
    <button
      type="button"
      className="w-full border rounded px-4 py-2 text-left bg-white shadow-sm"
      onClick={ctx.toggleOpen}
    >
      {children}
    </button>
  );
}

export function SelectContent({ children }: { children: React.ReactNode }) {
  const ctx = useContext(SelectContext);
  if (!ctx || !ctx.isOpen) return null;

  return (
    <ul className="absolute mt-1 w-full border rounded bg-white shadow-lg z-10 max-h-60 overflow-y-auto">
      {children}
    </ul>
  );
}

export function SelectItem({
  children,
  value,
}: {
  children: React.ReactNode;
  value: string;
}) {
  const ctx = useContext(SelectContext);
  if (!ctx) return null;

  return (
    <li
      onClick={() => ctx.onChange(value)}
      className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
    >
      {children}
    </li>
  );
}
