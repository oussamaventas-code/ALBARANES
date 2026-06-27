/**
 * Contexto de notificaciones (toasts) para GS AUTOBAT - Albaranes Inteligentes
 *
 * Sistema ligero de notificaciones flotantes, sin dependencias adicionales.
 */

import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { CheckCircle2, XCircle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';

type ToastVariant = 'success' | 'error' | 'info';

interface Toast {
  id: number;
  title: string;
  description?: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  toast: (title: string, options?: { description?: string; variant?: ToastVariant }) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

const VARIANT_STYLES: Record<ToastVariant, string> = {
  success: 'border-emerald-500/40 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-300',
  error: 'border-red-500/40 bg-red-50 text-red-900 dark:bg-red-950/60 dark:text-red-300',
  info: 'border-blue-500/40 bg-blue-50 text-blue-900 dark:bg-blue-950/60 dark:text-blue-300',
};

const VARIANT_ICONS: Record<ToastVariant, typeof CheckCircle2> = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback(
    (title: string, options?: { description?: string; variant?: ToastVariant }) => {
      const id = Date.now() + Math.random();
      const newToast: Toast = {
        id,
        title,
        description: options?.description,
        variant: options?.variant ?? 'info',
      };
      setToasts((prev) => [...prev, newToast]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4000);
    },
    []
  );

  const dismiss = (id: number) => setToasts((prev) => prev.filter((t) => t.id !== id));

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 right-4 left-4 sm:left-auto z-50 flex flex-col gap-2 sm:w-96">
        {toasts.map((t) => {
          const Icon = VARIANT_ICONS[t.variant];
          return (
            <div
              key={t.id}
              className={cn(
                'animate-slide-in-bottom flex items-start gap-3 rounded-lg border p-3 shadow-lg backdrop-blur-sm',
                VARIANT_STYLES[t.variant]
              )}
            >
              <Icon className="mt-0.5 size-5 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{t.title}</p>
                {t.description && <p className="text-xs opacity-80 mt-0.5">{t.description}</p>}
              </div>
              <button onClick={() => dismiss(t.id)} className="shrink-0 opacity-60 hover:opacity-100">
                <X className="size-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

/** Hook para disparar notificaciones desde cualquier componente */
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast debe usarse dentro de un ToastProvider');
  return ctx;
}
