"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from "lucide-react";

export type Tone = "neutral" | "success" | "warning" | "danger" | "info";

export function statusTone(status: string): Tone {
  switch (status) {
    case "Available":
    case "Returned":
    case "Approved":
    case "Active":
    case "Excellent":
    case "Good":
      return "success";
    case "Pending":
    case "Under-maintenance":
    case "Fair":
      return "warning";
    case "Issued":
      return "info";
    case "Damaged":
    case "Rejected":
    case "Missing":
    case "Inactive":
    case "Overdue":
      return "danger";
    default:
      return "neutral";
  }
}

export function Badge({
  tone = "neutral",
  children,
}: {
  tone?: Tone;
  children: React.ReactNode;
}) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}

type Toast = { id: number; kind: "success" | "error" | "info"; text: string };

const ToastContext = createContext<(text: string, kind?: Toast["kind"]) => void>(
  () => {},
);

export function useToast() {
  return useContext(ToastContext);
}

const toastIcons = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const push = useCallback((text: string, kind: Toast["kind"] = "success") => {
    const id = Date.now() + Math.random();
    setToasts((current) => [...current, { id, kind, text }]);
    setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 3500);
  }, []);

  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="no-print pointer-events-none fixed bottom-4 right-4 z-[60] flex w-full max-w-sm flex-col gap-2">
        {toasts.map((toast) => {
          const Icon = toastIcons[toast.kind];
          return (
            <div
              key={toast.id}
              role="status"
              className={`pointer-events-auto flex items-start gap-3 rounded-lg border border-border bg-surface p-4 shadow-xl ${
                toast.kind === "success"
                  ? "text-success"
                  : toast.kind === "error"
                    ? "text-danger"
                    : "text-info"
              }`}
            >
              <Icon className="mt-0.5 h-5 w-5 shrink-0" />
              <span className="flex-1 text-sm font-medium text-foreground">
                {toast.text}
              </span>
              <button
                type="button"
                aria-label="Dismiss"
                onClick={() =>
                  setToasts((current) =>
                    current.filter((item) => item.id !== toast.id),
                  )
                }
                className="rounded p-1 text-muted hover:bg-surface-hover"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Delete",
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onCancel();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-surface p-6 shadow-2xl">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-danger-bg text-danger">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <h2 className="mt-4 text-lg font-bold text-foreground">{title}</h2>
        <p className="mt-1 text-sm text-muted">{message}</p>
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-border px-4 py-2 text-sm font-semibold text-foreground hover:bg-surface-hover"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-md bg-danger px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
