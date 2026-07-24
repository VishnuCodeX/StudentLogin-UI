// Developed By: Vishnukarthick K

import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2 } from "@/lib/icons";

// A brief "fetching your records" overlay card — shown while a slow initial load is in flight,
// closes itself (via AnimatePresence) the instant `open` goes false, revealing whatever the page
// already rendered underneath. Portals to #modal-root, same pattern as AbsenceModal/ConfirmHost.
export default function LoadingCardModal({ open, label = "Fetching your records" }) {
  const modal = (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[120] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <motion.div
            role="status"
            aria-live="polite"
            className="relative w-full max-w-xs rounded-3xl border border-border bg-card p-7 text-center shadow-pop"
            initial={{ opacity: 0, scale: 0.9, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 10 }}
            transition={{ type: "spring", stiffness: 320, damping: 26 }}
          >
            <div className="relative mx-auto grid h-16 w-16 place-items-center">
              <motion.span
                className="absolute inset-0 rounded-full bg-primary/15"
                animate={{ scale: [1, 1.35, 1], opacity: [0.5, 0.1, 0.5] }}
                transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
              />
              <span className="relative grid h-11 w-11 place-items-center rounded-full bg-primary text-primary-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
              </span>
            </div>
            <p className="mt-4 flex items-baseline justify-center font-display text-base font-bold">
              {label}
              <span className="ml-0.5 inline-flex w-5">
                {[0, 1, 2].map((i) => (
                  <motion.span
                    key={i}
                    animate={{ opacity: [0, 1, 0] }}
                    transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2, ease: "easeInOut" }}
                  >
                    .
                  </motion.span>
                ))}
              </span>
            </p>
            <p className="mt-1.5 text-sm text-muted-foreground">Please hold on a moment…</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
  return createPortal(modal, document.getElementById("modal-root") || document.body);
}
