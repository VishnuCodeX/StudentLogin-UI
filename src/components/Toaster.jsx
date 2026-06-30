import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, AlertTriangle, Info, XCircle, X } from "@/lib/icons";
import { registerToastHandler } from "@/lib/toast";

const VARIANTS = {
  success: { icon: CheckCircle2, bar: "#3f7a4b", chipBg: "#e6f0e6", accent: "#3f7a4b", ring: "#cfe6d5" },
  error: { icon: XCircle, bar: "#c5552f", chipBg: "#f7e7df", accent: "#c5552f", ring: "#edcab9" },
  warning: { icon: AlertTriangle, bar: "#b5891f", chipBg: "#f6edd5", accent: "#a87c12", ring: "#ecdca6" },
  info: { icon: Info, bar: "#8a6d4a", chipBg: "#f0e7d3", accent: "#6b4f3a", ring: "#e3d6bd" },
};

let counter = 0;

export default function Toaster() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    registerToastHandler(({ message, type = "info", duration = 4500 }) => {
      const id = ++counter;
      setToasts((t) => [...t, { id, message, type }]);
      setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), duration);
    });
  }, []);

  const remove = (id) => setToasts((t) => t.filter((x) => x.id !== id));

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[100] flex w-[min(92vw,390px)] flex-col gap-2.5">
      <AnimatePresence initial={false}>
        {toasts.map((t) => {
          const v = VARIANTS[t.type] || VARIANTS.info;
          const Icon = v.icon;
          return (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, x: 70, scale: 0.96 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 70, scale: 0.9 }}
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
              className="pointer-events-auto flex items-start gap-3 overflow-hidden rounded-2xl border bg-card p-3.5 pr-2.5 shadow-card"
              style={{ borderColor: v.ring }}
            >
              <span className="w-1 self-stretch rounded-full" style={{ background: v.bar }} />
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl" style={{ background: v.chipBg, color: v.accent }}>
                <Icon className="h-5 w-5" />
              </span>
              <p className="flex-1 self-center text-sm font-medium text-foreground">{t.message}</p>
              <button
                onClick={() => remove(t.id)}
                className="shrink-0 self-start rounded-lg p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                aria-label="Dismiss"
              >
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
