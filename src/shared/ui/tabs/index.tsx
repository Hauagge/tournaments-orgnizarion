import React, { useState, createContext, useContext } from 'react';

type TabsContextType = {
  value: string;
  setValue: (v: string) => void;
};

const TabsContext = createContext<TabsContextType | null>(null);

export function Tabs({
  defaultValue,
  value,
  onValueChange,
  className = '',
  children,
}: {
  defaultValue?: string;
  value?: string;
  onValueChange?: (v: string) => void;
  className?: string;
  children: React.ReactNode;
}) {
  const [internalValue, setInternalValue] = useState(defaultValue ?? '');
  const selectedValue = value ?? internalValue;

  function setValue(nextValue: string) {
    if (onValueChange) onValueChange(nextValue);
    if (value === undefined) setInternalValue(nextValue);
  }

  return (
    <TabsContext.Provider value={{ value: selectedValue, setValue }}>
      <div className={`w-full ${className}`}>{children}</div>
    </TabsContext.Provider>
  );
}

export function TabsList({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={`flex w-full gap-2 border-b mb-4 ${className}`}>{children}</div>;
}

export function TabsTrigger({
  value,
  className = '',
  activeClassName = '',
  inactiveClassName = '',
  children,
}: {
  value: string;
  className?: string;
  activeClassName?: string;
  inactiveClassName?: string;
  children: React.ReactNode;
}) {
  const context = useContext(TabsContext);
  if (!context) throw new Error('TabsTrigger must be used within Tabs');

  const isActive = context.value === value;

  return (
    <button
      onClick={() => context.setValue(value)}
      className={`px-4 py-2 text-sm font-medium rounded-t-md border-b-2 transition-colors ${
        isActive
          ? 'border-blue-600 text-blue-600'
          : 'border-transparent text-gray-500 hover:text-gray-800'
      } ${isActive ? activeClassName : inactiveClassName} ${className}`}
    >
      {children}
    </button>
  );
}

export function TabsContent({
  value,
  children,
}: {
  value: string;
  children: React.ReactNode;
}) {
  const context = useContext(TabsContext);
  if (!context) throw new Error('TabsContent must be used within Tabs');

  return context.value === value ? (
    <div className=" mt-2">{children}</div>
  ) : null;
}
