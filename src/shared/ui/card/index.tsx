import React from 'react';

type CardProps = React.HTMLAttributes<HTMLDivElement> & {
  children: React.ReactNode;
};

export function Card({
  children,
  className = '',
  ...props
}: CardProps) {
  return (
    <div
      className={`rounded-xl border bg-white p-4 shadow-sm ${className}`}
      {...props}
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
