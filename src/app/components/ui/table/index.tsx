import React from 'react';

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

export function Table({
  children,
  className,
  ...props
}: React.TableHTMLAttributes<HTMLTableElement>) {
  return (
    <table
      className={cx('w-full border rounded-lg', className)}
      role="table"
      {...props}
    >
      {children}
    </table>
  );
}

export function TableHeader({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead className={cx('bg-gray-200', className)} {...props}>
      {children}
    </thead>
  );
}

export function TableBody({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <tbody className={className} {...props}>
      {children}
    </tbody>
  );
}

export function TableRow({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={cx('even:bg-gray-100 hover:bg-gray-50', className)}
      {...props}
    >
      {children}
    </tr>
  );
}

type TableHeadProps = Omit<
  React.ThHTMLAttributes<HTMLTableCellElement>,
  'aria-sort'
> & {
  /** Aceita 'ascending' | 'descending' | 'none' | 'other' e também 'asc' | 'desc' */
  'aria-sort'?: React.AriaAttributes['aria-sort'] | 'asc' | 'desc';
};

export function TableHead({
  children,
  className,
  onClick,
  onKeyDown,
  tabIndex,
  ...rest
}: TableHeadProps) {
  // Normaliza aria-sort caso venha como 'asc' | 'desc'
  const ariaSortRaw = (rest as any)['aria-sort'];
  const ariaSortNormalized =
    ariaSortRaw === 'asc'
      ? 'ascending'
      : ariaSortRaw === 'desc'
      ? 'descending'
      : ariaSortRaw;

  // Permite ativar ordenação via teclado (Enter/Espaço)
  const clickable = typeof onClick === 'function';
  const handleKeyDown: React.KeyboardEventHandler<HTMLTableCellElement> = (
    e,
  ) => {
    if (!clickable) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      (onClick as any)?.(e);
    }
    onKeyDown?.(e);
  };

  const restWithoutAriaSort = { ...rest } as any;
  delete restWithoutAriaSort['aria-sort'];

  return (
    <th
      scope="col"
      role="columnheader"
      aria-sort={ariaSortNormalized as React.AriaAttributes['aria-sort']}
      className={cx(
        'px-4 py-2 text-left text-sm font-semibold text-gray-700',
        clickable &&
          'cursor-pointer select-none focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300 rounded-sm',
        className,
      )}
      tabIndex={clickable ? tabIndex ?? 0 : tabIndex}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      {...restWithoutAriaSort}
    >
      {children}
    </th>
  );
}

type TableCellProps = React.TdHTMLAttributes<HTMLTableCellElement> & {
  align?: 'left' | 'center' | 'right';
};

export function TableCell({
  children,
  className,
  align = 'left',
  ...props
}: TableCellProps) {
  return (
    <td
      className={cx(
        'px-4 py-2 text-sm text-gray-900 items-center',
        align === 'center' && 'text-center',
        align === 'right' && 'text-right',
        className,
      )}
      {...props}
    >
      {children}
    </td>
  );
}
