'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

type DialogContextValue = {
  open: boolean;
  setOpen: (v: boolean) => void;
  labelId: string;
  descId: string;
};

const DialogCtx = createContext<DialogContextValue | null>(null);

type ControlledProps =
  | { open: boolean; onOpenChange: (v: boolean) => void; defaultOpen?: never }
  | {
      defaultOpen?: boolean;
      open?: never;
      onOpenChange?: (v: boolean) => void;
    };

type RootProps = React.PropsWithChildren<
  ControlledProps & {
    /** Fecha ao apertar ESC (default: true) */
    closeOnEsc?: boolean;
    /** Fecha ao clicar fora (default: true) */
  }
>;

export function AlertDialog({
  children,
  defaultOpen = false,
  open: openProp,
  onOpenChange,
  closeOnEsc = true,
}: RootProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const isControlled = typeof openProp === 'boolean';
  const open = isControlled ? (openProp as boolean) : uncontrolledOpen;

  const setOpen = useCallback(
    (v: boolean) => {
      if (!isControlled) setUncontrolledOpen(v);
      onOpenChange?.(v);
    },
    [isControlled, onOpenChange],
  );

  const labelId = useId();
  const descId = useId();

  // Fechar com ESC
  useEffect(() => {
    if (!open || !closeOnEsc) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, closeOnEsc, setOpen]);

  const value = useMemo(
    () => ({ open, setOpen, labelId, descId }),
    [open, setOpen, labelId, descId],
  );

  return <DialogCtx.Provider value={value}>{children}</DialogCtx.Provider>;
}

function useDialogCtx() {
  const ctx = useContext(DialogCtx);
  if (!ctx)
    throw new Error('AlertDialog.* deve ser usado dentro de <AlertDialog>');
  return ctx;
}

/* Trigger --------------------------------------------------- */
type TriggerProps = React.PropsWithChildren<{ asChild?: boolean }>;

type ChildClickableProps = {
  onClick?: React.MouseEventHandler<HTMLElement>;
  className?: string;
};

export function AlertDialogTrigger({
  children,
  asChild = false,
}: TriggerProps) {
  const { setOpen } = useDialogCtx();

  if (asChild && React.isValidElement<ChildClickableProps>(children)) {
    const prevOnClick = children.props.onClick;
    const handleClick: React.MouseEventHandler<HTMLElement> = (e) => {
      // mantém o onClick original do filho
      prevOnClick?.(e);
      if (e.defaultPrevented) return;
      setOpen(true);
    };

    return React.cloneElement<ChildClickableProps>(children, {
      onClick: handleClick,
      className: children.props.className, // (ou mesclar com algo seu)
    });
  }
  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      className="rounded-md border px-3 py-2 text-sm hover:bg-black/5"
    >
      {children}
    </button>
  );
}

/* Portal ---------------------------------------------------- */
function Portal({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return createPortal(children, document.body);
}

/* Content --------------------------------------------------- */
type ContentProps = React.PropsWithChildren<{ className?: string }>;

export function AlertDialogContent({ className = '', children }: ContentProps) {
  const { open, setOpen, labelId, descId } = useDialogCtx();
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const prevFocus = useRef<Element | null>(null);

  // Gerenciar foco (focus trap básico + restaurar foco)
  useEffect(() => {
    if (open) {
      prevFocus.current = document.activeElement;
      // foca o conteúdo
      setTimeout(() => {
        contentRef.current?.focus();
      }, 0);
    } else if (prevFocus.current instanceof HTMLElement) {
      prevFocus.current.focus();
    }
  }, [open]);

  // Trap de tabulação básico
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== 'Tab') return;
    const root = contentRef.current;
    if (!root) return;

    const focusables = root.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    const arr = Array.from(focusables).filter(
      (el) => !el.hasAttribute('disabled'),
    );
    if (arr.length === 0) return;

    const first = arr[0];
    const last = arr[arr.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      last.focus();
      e.preventDefault();
    } else if (!e.shiftKey && document.activeElement === last) {
      first.focus();
      e.preventDefault();
    }
  };

  if (!open) return null;

  return (
    <Portal>
      {/* Overlay */}
      <div
        ref={overlayRef}
        onMouseDown={(e) => {
          // fecha ao clicar no overlay
          if (e.target === overlayRef.current) setOpen(false);
        }}
        className="fixed inset-0 z-[10000] bg-black/50 backdrop-blur-[1px]"
      >
        {/* Content */}
        <div
          role="alertdialog"
          aria-modal="true"
          aria-labelledby={labelId}
          aria-describedby={descId}
          tabIndex={-1}
          ref={contentRef}
          onKeyDown={handleKeyDown}
          className={`fixed left-1/2 top-1/2 z-[10001] w-[92vw] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-xl border bg-white p-0 shadow-xl ring-1 ring-black/5 ${className}`}
        >
          {/* Header padrão com botão fechar */}
          <div className="flex items-center justify-between border-b px-4 py-3">
            <div className="min-h-[24px]" />
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Fechar"
              className="rounded-md p-1 hover:bg-black/5"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Conteúdo custom */}
          <div className="px-4 py-3">{children}</div>
        </div>
      </div>
    </Portal>
  );
}

/* Struct helpers ------------------------------------------- */
export function AlertDialogHeader({ children }: React.PropsWithChildren) {
  return <div className="mb-2">{children}</div>;
}

export function AlertDialogTitle({ children }: React.PropsWithChildren) {
  const { labelId } = useDialogCtx();
  return (
    <h2 id={labelId} className="text-base font-semibold">
      {children}
    </h2>
  );
}

export function AlertDialogDescription({ children }: React.PropsWithChildren) {
  const { descId } = useDialogCtx();
  return (
    <p id={descId} className="mt-1 text-sm text-slate-600">
      {children}
    </p>
  );
}

export function AlertDialogFooter({ children }: React.PropsWithChildren) {
  return (
    <div className="mt-4 flex items-center justify-end gap-2">{children}</div>
  );
}

/* Buttons --------------------------------------------------- */
type BtnProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  /** Fecha o diálogo ao clicar (default: true no Cancel, false no Action) */
  closeOnClick?: boolean;
};

export function AlertDialogCancel({
  closeOnClick = true,
  className = '',
  ...props
}: BtnProps) {
  const { setOpen } = useDialogCtx();
  return (
    <button
      type="button"
      {...props}
      onClick={(e) => {
        props.onClick?.(e);
        if (closeOnClick) setOpen(false);
      }}
      className={`rounded-md border px-3 py-2 text-sm hover:bg-black/5 ${className}`}
    />
  );
}

export function AlertDialogAction({
  closeOnClick = false,
  className = '',
  ...props
}: BtnProps) {
  const { setOpen } = useDialogCtx();
  return (
    <button
      type="button"
      {...props}
      onClick={(e) => {
        props.onClick?.(e);
        if (closeOnClick) setOpen(false);
      }}
      className={`rounded-md bg-red-600 px-3 py-2 text-sm text-white hover:bg-red-700 ${className}`}
    />
  );
}

/* Re-export para API compatível com uso sugerido */
export { AlertDialog as default };
