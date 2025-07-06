import React from 'react';

export function Table({ children }: { children: React.ReactNode }) {
  return (
    <table className="w-full overflow-x-auto border rounded-lg">
      {children}
    </table>
  );
}

export function TableHeader({ children }: { children: React.ReactNode }) {
  return <thead className="bg-gray-200">{children}</thead>;
}

export function TableBody({ children }: { children: React.ReactNode }) {
  return <tbody>{children}</tbody>;
}

export function TableRow({ children }: { children: React.ReactNode }) {
  return <tr className="even:bg-gray-100 hover:bg-gray-50">{children}</tr>;
}

export function TableHead({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">
      {children}
    </th>
  );
}

export function TableCell({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <td className={`px-4 py-2 text-sm text-gray-900 items-center ${className}`}>
      {children}
    </td>
  );
}
