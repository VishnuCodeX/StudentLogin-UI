// Developed By: Vishnukarthick K

import { useEffect, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { X, ChevronDown, LogOut } from "@/lib/icons";
import { motion, AnimatePresence } from "framer-motion";
import { NAV_SECTIONS } from "@/config/nav";
import { cn } from "@/lib/utils";
import Logo from "@/components/Logo";
import PoweredByBadge from "@/components/PoweredByBadge";
import { getStudent, clearSession, getAvatar } from "@/lib/auth";
import { confirm } from "@/lib/confirm";

// Literal class strings so Tailwind keeps them; one cheerful color per menu.
const TILES = [
  "bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-300",
  "bg-pink-100 text-pink-600 dark:bg-pink-500/20 dark:text-pink-300",
  "bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-300",
  "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-300",
  "bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-300",
  "bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-300",
  "bg-cyan-100 text-cyan-600 dark:bg-cyan-500/20 dark:text-cyan-300",
  "bg-fuchsia-100 text-fuchsia-600 dark:bg-fuchsia-500/20 dark:text-fuchsia-300",
  "bg-orange-100 text-orange-600 dark:bg-orange-500/20 dark:text-orange-300",
  "bg-teal-100 text-teal-600 dark:bg-teal-500/20 dark:text-teal-300",
  "bg-sky-100 text-sky-600 dark:bg-sky-500/20 dark:text-sky-300",
  "bg-lime-100 text-lime-600 dark:bg-lime-500/20 dark:text-lime-300",
  "bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-300",
];

function StudentBadge() {
  const student = getStudent();
  const name = [student?.firstName, student?.lastName].filter(Boolean).join(" ") || "Student";
  const initials = name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  const klass = [student?.programme, student?.semester && `Sem ${student.semester}`].filter(Boolean).join(" · ");
  const [avatar, setAvatar] = useState(getAvatar());
  useEffect(() => {
    const h = () => setAvatar(getAvatar());
    window.addEventListener("mcc-avatar", h);
    return () => window.removeEventListener("mcc-avatar", h);
  }, []);

  return (
    <div className="flex flex-col items-center px-4 pb-4 pt-3 text-center">
      <div className="bg-joy rounded-full p-[3px] shadow-pop">
        {avatar ? (
          <img src={avatar} alt={name} className="h-20 w-20 rounded-full border-4 border-card object-cover object-top" />
        ) : (
          <div className="grid h-20 w-20 place-items-center rounded-full border-4 border-card bg-card text-2xl font-extrabold text-primary">
            {initials}
          </div>
        )}
      </div>
      <p className="mt-3 font-display text-base font-bold leading-tight">{name}</p>
      <p className="text-xs text-muted-foreground">{student?.registerNo}</p>
      {klass && <p className="mt-0.5 text-[11px] text-muted-foreground">{klass}</p>}
    </div>
  );
}

function Section({ section, tile, onNavigate }) {
  const location = useLocation();
  const Icon = section.icon;
  const single = section.items.length === 1 && !section.alwaysExpand;
  const hasActiveChild = section.items.some((i) => location.pathname === i.to);
  const [open, setOpen] = useState(hasActiveChild);

  const IconTile = ({ active }) => (
    <span
      className={cn(
        "grid h-8 w-8 shrink-0 place-items-center rounded-xl transition-colors",
        active ? "bg-white/25 text-white" : tile
      )}
    >
      <Icon className="h-[17px] w-[17px]" />
    </span>
  );

  if (single) {
    const item = section.items[0];
    return (
      <NavLink to={item.to} onClick={onNavigate}>
        {({ isActive }) => (
          <motion.div
            whileHover={{ x: isActive ? 0 : 3 }}
            whileTap={{ scale: 0.97 }}
            className={cn(
              "relative flex items-center gap-3 rounded-2xl px-2.5 py-2 text-sm font-bold transition-colors",
              // Apply the highlight directly (not via a shared layoutId span, which
              // could glitch across route changes and leave white text on a light bg).
              isActive ? "bg-joy text-white shadow-pop" : "text-foreground/75 hover:bg-muted hover:text-foreground"
            )}
          >
            <IconTile active={isActive} />
            {section.label}
          </motion.div>
        )}
      </NavLink>
    );
  }

  return (
    <div>
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex w-full items-center gap-3 rounded-2xl px-2.5 py-2 text-sm font-bold transition-colors",
          hasActiveChild ? "text-foreground" : "text-foreground/75 hover:bg-muted hover:text-foreground"
        )}
      >
        <IconTile active={false} />
        <span className="flex-1 text-left">{section.label}</span>
        <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform duration-300", open && "rotate-180")} />
      </motion.button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.ul
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
            className="ml-[26px] mt-0.5 space-y-0.5 overflow-hidden border-l-2 border-border pl-3"
          >
            {section.items.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    cn(
                      "relative block rounded-xl px-3 py-2 text-[12.5px] font-semibold transition-all hover:translate-x-0.5",
                      isActive ? "bg-secondary text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )
                  }
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

function SidebarInner({ onNavigate }) {
  const navigate = useNavigate();
  async function logout() {
    const ok = await confirm({
      title: "Log out?",
      message: "Are you sure you want to logout?",
      confirmText: "Yes, Logout",
      cancelText: "No, Stay here",
      danger: true,
    });
    if (!ok) return;
    clearSession();
    navigate("/login");
  }
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center justify-center border-b border-border px-4">
        <Logo className="h-10" />
      </div>
      <StudentBadge />
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 pb-4 no-scrollbar">
        {NAV_SECTIONS.map((section, i) => (
          <Section key={section.label} section={section} tile={TILES[i % TILES.length]} onNavigate={onNavigate} />
        ))}
      </nav>
      <div className="border-t border-border p-3">
        <button
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-2xl px-2.5 py-2 text-sm font-bold text-destructive transition-colors hover:bg-destructive/10"
        >
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-destructive/10 text-destructive">
            <LogOut className="h-[17px] w-[17px]" />
          </span>
          Logout
        </button>
      </div>
      {/* footer bar */}
      <div className="border-t border-border bg-muted/50 px-3 py-3 flex justify-center">
        <PoweredByBadge />
      </div>
    </div>
  );
}

export default function Sidebar({ open, onClose }) {
  return (
    <>
      <aside className="sticky top-0 hidden h-screen w-72 shrink-0 border-r border-border bg-card lg:block">
        <SidebarInner />
      </aside>

      <div className={cn("fixed inset-0 z-50 lg:hidden", open ? "pointer-events-auto" : "pointer-events-none")}>
        <div
          onClick={onClose}
          className={cn("absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity", open ? "opacity-100" : "opacity-0")}
        />
        <aside
          className={cn(
            "absolute left-0 top-0 h-full w-72 bg-card shadow-card transition-transform duration-300",
            open ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <button
            onClick={onClose}
            className="absolute right-3 top-4 z-10 grid h-9 w-9 place-items-center rounded-lg text-muted-foreground hover:bg-muted"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
          <SidebarInner onNavigate={onClose} />
        </aside>
      </div>
    </>
  );
}
