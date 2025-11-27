'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  useEffect,
} from 'react';
import { X, CheckCircle2, AlertTriangle, Info } from 'lucide-react';

type Variant = 'default' | 'success' | 'warning' | 'destructive' | 'info';

export type ToastOptions = {
  title?: string;
  description?: string;
  variant?: Variant;
  duration?: number; // ms (default 4000)
  action?: { label: string; onClick: () => void };
};

type ToastItem = ToastOptions & { id: string };

type ToastContextValue = {
  toast: (opts: ToastOptions) => string; // retorna o id
  dismiss: (id?: string) => void; // fecha um específico ou o último
  toasts: ToastItem[];
};

const ToastContext = createContext<ToastContextValue | null>(null);

function genId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

/** Provider global */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timersRef = useRef<Map<string, number>>(new Map());

  const dismiss = useCallback((id?: string) => {
    setToasts((prev) => {
      const list = [...prev];
      const targetId = id ?? list.at(-1)?.id;
      if (!targetId) return prev;
      // limpa timer
      const t = timersRef.current.get(targetId);
      if (t) {
        clearTimeout(t);
        timersRef.current.delete(targetId);
      }
      return list.filter((it) => it.id !== targetId);
    });
  }, []);

  const toast = useCallback(
    (opts: ToastOptions) => {
      const id = genId();
      const item: ToastItem = {
        id,
        variant: opts.variant ?? 'default',
        duration: opts.duration ?? 4000,
        title: opts.title,
        description: opts.description,
        action: opts.action,
      };
      setToasts((prev) => [...prev, item]);

      // auto dismiss
      const timer = window.setTimeout(() => dismiss(id), item.duration);
      timersRef.current.set(id, timer);

      return id;
    },
    [dismiss],
  );

  useEffect(() => {
    return () => {
      // cleanup on unmount
      timersRef.current.forEach((t) => clearTimeout(t));
      timersRef.current.clear();
    };
  }, []);

  const value = useMemo(
    () => ({ toast, dismiss, toasts }),
    [toast, dismiss, toasts],
  );

  return (
    <ToastContext.Provider value={value}>{children}</ToastContext.Provider>
  );
}

/** Hook para usar no app */
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast deve ser usado dentro de <ToastProvider>');
  }
  return ctx;
}

/** Container que renderiza os toasts (posicione no layout) */
export function Toaster({
  position = 'top-right',
}: {
  position?:
    | 'top-right'
    | 'top-left'
    | 'bottom-right'
    | 'bottom-left'
    | 'top-center'
    | 'bottom-center';
}) {
  const { toasts, dismiss } = useToast();

  const posClass = {
    'top-right': 'top-4 right-4 items-end',
    'top-left': 'top-4 left-4 items-start',
    'bottom-right': 'bottom-4 right-4 items-end',
    'bottom-left': 'bottom-4 left-4 items-start',
    'top-center': 'top-4 left-1/2 -translate-x-1/2 items-center',
    'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2 items-center',
  }[position];

  return (
    <div
      className={`pointer-events-none fixed z-[12000] flex w-full max-w-md flex-col gap-2 ${posClass}`}
    >
      {toasts.map((t) => (
        <ToastCard key={t.id} item={t} onClose={() => dismiss(t.id)} />
      ))}
    </div>
  );
}

function ToastCard({
  item,
  onClose,
}: {
  item: ToastItem;
  onClose: () => void;
}) {
  const variantStyles: Record<Variant, string> = {
    default: 'bg-white text-slate-900 border-slate-200',
    success: 'bg-emerald-50 text-emerald-900 border-emerald-200',
    warning: 'bg-amber-50 text-amber-900 border-amber-200',
    destructive: 'bg-red-50 text-red-900 border-red-200',
    info: 'bg-blue-50 text-blue-900 border-blue-200',
  };

  const icon =
    item.variant === 'success' ? (
      <CheckCircle2 className="h-5 w-5" />
    ) : item.variant === 'warning' ? (
      <AlertTriangle className="h-5 w-5" />
    ) : item.variant === 'destructive' ? (
      <X className="h-5 w-5" />
    ) : (
      <Info className="h-5 w-5" />
    );

  const role = item.variant === 'destructive' ? 'alert' : 'status';

  return (
    <div
      role={role}
      className={`pointer-events-auto relative flex w-full items-start gap-3 rounded-xl border p-3 shadow-md ring-1 ring-black/5 ${
        variantStyles[item.variant || 'default']
      }`}
    >
      <div className="mt-0.5">{icon}</div>

      <div className="flex-1">
        {item.title && <p className="text-sm font-semibold">{item.title}</p>}
        {item.description && (
          <p className="text-sm opacity-90">{item.description}</p>
        )}
        {item.action && (
          <button
            onClick={item.action.onClick}
            className="mt-2 rounded-md border px-2 py-1 text-xs hover:bg-black/5"
          >
            {item.action.label}
          </button>
        )}
      </div>

      <button
        onClick={onClose}
        className="rounded-md p-1 hover:bg-black/5"
        aria-label="Fechar"
        title="Fechar"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
