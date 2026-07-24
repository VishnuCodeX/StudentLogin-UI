// Developed By: Vishnukarthick K

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { LogOut, AlertTriangle } from "@/lib/icons";
import { registerConfirmHandler } from "@/lib/confirm";

export default function ConfirmHost() {
  const [state, setState] = useState(null);

  useEffect(() => {
    registerConfirmHandler((opts) => setState(opts));
  }, []);

  const close = (value) => {
    state?.resolve?.(value);
    setState(null);
  };

  const danger = state?.danger;
  const Icon = state?.icon || (danger ? LogOut : AlertTriangle);

  return (
    <AnimatePresence>
      {state && (
        <motion.div
          className="fixed inset-0 z-[110] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => close(false)} />
          <motion.div
            role="dialog"
            aria-modal="true"
            className="relative w-full max-w-sm rounded-3xl border border-border bg-card p-6 shadow-pop"
            initial={{ scale: 0.95, y: 12, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, y: 12, opacity: 0 }}
            transition={{ type: "spring", stiffness: 360, damping: 28 }}
          >
            <span
              className={`grid h-12 w-12 place-items-center rounded-2xl ${
                danger ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"
              }`}
            >
              <Icon className="h-6 w-6" />
            </span>
            <h3 className="mt-4 font-display text-lg font-bold">{state.title || "Are you sure?"}</h3>
            {state.message && <p className="mt-1.5 text-sm text-muted-foreground">{state.message}</p>}

            <div className="mt-6 flex gap-3">
              <motion.button
                onClick={() => close(false)}
                whileTap={{ scale: 0.96 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                className="flex-1 rounded-xl border border-border bg-background py-2.5 text-sm font-semibold transition-colors hover:bg-muted"
              >
                {state.cancelText || "Cancel"}
              </motion.button>
              <motion.button
                onClick={() => close(true)}
                whileTap={{ scale: 0.96 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                className={`flex-1 rounded-xl py-2.5 text-sm font-semibold text-white transition-colors hover:opacity-90 ${
                  danger ? "bg-destructive" : "bg-primary"
                }`}
              >
                {state.confirmText || "Confirm"}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
