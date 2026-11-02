"use client";

import { CheckCircle2, XCircle } from "lucide-react";
import { createContext, use, useCallback, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";

type Toast = { id: number; tone: "success" | "error"; message: string };

const ToastContext = createContext<((tone: Toast["tone"], message: string) => void) | null>(
  null
);

let nextId = 1;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const push = useCallback((tone: Toast["tone"], message: string) => {
    const id = nextId++;
    setToasts((list) => [...list, { id, tone, message }]);
    setTimeout(() => setToasts((list) => list.filter((t) => t.id !== id)), 4500);
  }, []);

  return (
    <ToastContext value={push}>
      {children}
      <div
        className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-[min(20rem,calc(100vw-2rem))] flex-col gap-2"
        aria-live="polite"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={cn(
              "animate-pop-in pointer-events-auto flex items-start gap-2.5 rounded-xl border border-l-4 bg-surface px-4 py-3 text-sm shadow-[var(--shadow-md)]",
              t.tone === "success" ? "border-emerald-200/80 border-l-emerald-500" : "border-red-200/80 border-l-red-500"
            )}
          >
            {t.tone === "success" ? (
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
            ) : (
              <XCircle className="mt-0.5 size-4 shrink-0 text-danger" aria-hidden />
            )}
            <p className="text-foreground">{t.message}</p>
          </div>
        ))}
      </div>
    </ToastContext>
  );
}

export function useToast() {
  const push = use(ToastContext);
  if (!push) throw new Error("useToast must be used within ToastProvider");
  return {
    success: (message: string) => push("success", message),
    error: (message: string) => push("error", message),
  };
}
