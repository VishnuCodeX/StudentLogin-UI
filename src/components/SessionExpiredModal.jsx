// Developed By: Vishnukarthick K

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Lock, LogIn } from "@/lib/icons";
import { registerSessionExpiredHandler } from "@/lib/sessionExpired";

// Raw window.location redirect (outside React Router) must be prefixed with the app's
// base path — mirrors the LOGIN_PATH helper in api.js.
const LOGIN_PATH = `${import.meta.env.BASE_URL}login`.replace(/\/{2,}/g, "/");

/* Blocking "your session has expired" dialog. Mounted once at the app root
   (App.jsx) and triggered from anywhere via notifySessionExpired() — in
   particular the axios response interceptor, which fires outside React and
   can't just setState. No backdrop-dismiss / close button: the token is
   already dead, so the only way out is to sign in again. */
export default function SessionExpiredModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    registerSessionExpiredHandler(() => setOpen(true));
  }, []);

  const goToLogin = () => {
    window.location.href = LOGIN_PATH;
  };

  const modal = (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-[#1c140b]/55 backdrop-blur-md" />

          <motion.div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="session-expired-title"
            className="relative w-full max-w-sm overflow-hidden rounded-[28px] border border-[#e4d4b6]/70 bg-card text-center shadow-pop"
            initial={{ scale: 0.9, y: 24, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.92, y: 16, opacity: 0 }}
            transition={{ type: "spring", stiffness: 340, damping: 26 }}
          >
            {/* top accent band */}
            <div
              className="h-1.5 w-full"
              style={{ backgroundImage: "linear-gradient(95deg, #5c4632 0%, #8a6d4a 60%, #a4855c 100%)" }}
            />

            <div className="px-8 pb-8 pt-9">
              {/* icon with a soft pulsing halo */}
              <div className="relative mx-auto mb-5 grid h-20 w-20 place-items-center">
                <motion.span
                  className="absolute inset-0 rounded-full"
                  style={{ backgroundImage: "linear-gradient(135deg, #8a6d4a, #6b4f3a)", opacity: 0.16 }}
                  animate={{ scale: [1, 1.18, 1], opacity: [0.16, 0.05, 0.16] }}
                  transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                />
                <span
                  className="relative grid h-16 w-16 place-items-center rounded-full text-[#fdf8ee] ring-1 ring-[#fffdf7]/50"
                  style={{ background: "linear-gradient(135deg, #8a6d4a, #6b4f3a)" }}
                >
                  <Lock className="h-8 w-8" />
                </span>
              </div>

              <h3 id="session-expired-title" className="font-display text-xl font-bold text-foreground">
                Session Expired
              </h3>
              <p className="mx-auto mt-2.5 max-w-[26ch] text-sm leading-relaxed text-muted-foreground">
                Dear Student, your session has expired.
                <br />
                Please login again to continue.
              </p>

              <button
                onClick={goToLogin}
                className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-2xl py-3 text-sm font-semibold text-[#fdf8ee] shadow-glow transition hover:brightness-105 active:scale-[0.98]"
                style={{ backgroundImage: "linear-gradient(95deg, #5c4632 0%, #8a6d4a 60%, #a4855c 100%)" }}
              >
                <LogIn className="h-4.5 w-4.5" />
                Login Again
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return createPortal(modal, document.getElementById("modal-root") || document.body);
}
