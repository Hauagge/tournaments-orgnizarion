import React from 'react';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'default' | 'outline' | 'ghost' | 'secondary' | 'destructive';
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'xs';
};

export function Button({
  className = '',
  variant = 'default',
  size = 'md',
  ...props
}: ButtonProps) {
  const baseStyles = `inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 btn-${size} px-4 py-2 cursor-pointer disabled:opacity-50 disabled:pointer-events-none`;
  const variants = {
    default: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    outline: 'border border-gray-300 text-gray-800 hover:bg-gray-100',
    ghost: 'text-gray-700 hover:bg-gray-100',
    secondary: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500',
    destructive: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${className} `}
      {...props}
    />
  );
}
