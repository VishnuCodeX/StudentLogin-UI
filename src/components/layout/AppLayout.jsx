import { useEffect, useState } from "react";
import { Outlet, Navigate, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { isAuthenticated, setAvatar } from "@/lib/auth";
import api, { unwrap } from "@/lib/api";
import { pageVariants } from "@/components/motion";
import { ArrowUp } from "@/lib/icons";
import CarmelNexusBrand from "@/components/CarmelNexusBrand";

export default function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  // Load the real student photo from the DB once per session; only set it when one
  // exists so a manual upload (or initials fallback) isn't wiped for students whose
  // photo is stored off-DB.
  useEffect(() => {
    if (!isAuthenticated()) return;
    unwrap(api.get("/profile/photo", { skipErrorToast: true }))
      .then((photo) => { if (photo) setAvatar(photo); })
      .catch(() => {});
  }, []);

  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  return (
    <div className="relative flex min-h-screen bg-background">
      {/* Soft, cheerful confetti backdrop. */}
      <div className="bg-confetti pointer-events-none fixed inset-0 -z-10 opacity-70" />
      <Sidebar open={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onMenu={() => setMobileOpen(true)} />
        <main className="flex-1 px-4 py-6 lg:px-8 lg:py-8">
          <div className="mx-auto w-full max-w-6xl">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
        {/* Footer bar — matches the sidebar's "Powered By MCC(IT)" band. */}
        <footer className="bg-joy px-4 py-1.5 text-white/85 lg:px-8">
          <div className="mx-auto grid w-full max-w-6xl grid-cols-3 items-center gap-3 text-[12px] font-semibold">
            <span className="justify-self-start">
              <CarmelNexusBrand size={16} textSize={12} light />
            </span>
            <span className="justify-self-center text-center text-white/80">
              © {new Date().getFullYear()} MCC. All Rights Reserved.
            </span>
            <span className="flex items-center gap-1.5 justify-self-end tracking-wide">
              <ArrowUp className="h-4 w-4 text-emerald-400" />
              Version <span className="font-bold text-white">v1.0.1</span>
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
}
