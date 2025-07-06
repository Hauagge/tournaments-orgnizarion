import React from 'react';

export function Card({
  children,
  className = '',
  onClick = () => {},
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <div
      className={`rounded-xl border bg-white p-4 shadow-sm ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

export function CardContent({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={`p-2 ${className}`}>{children}</div>;
}
