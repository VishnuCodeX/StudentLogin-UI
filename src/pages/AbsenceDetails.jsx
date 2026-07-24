// Developed By: Vishnukarthick K

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import PageTitle from "@/components/PageTitle";
import { AlertTriangle, RefreshCw, CalendarX, CheckCircle2 } from "@/lib/icons";
import api, { unwrap } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SkeletonList } from "@/components/ui/skeleton";

function tag(type) {
  if (type === "Co-curricular Leave") return "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300";
  if (type === "On Leave") return "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300";
  return "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300";
}

export default function AbsenceDetails() {
  const [rows, setRows] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [semFilter, setSemFilter] = useState("ALL"); // a semester number, or "ALL"

  function load() {
    setLoading(true);
    setError("");
    unwrap(api.get("/attendance/absence"))
      .then(setRows)
      .catch((e) => setError(e?.response?.data?.message || "Could not load absence details."))
      .finally(() => setLoading(false));
  }
  useEffect(load, []);

  // Absences span every semester a student has had classes in, so each row is tagged with a
  // semester (see backend findAbsenceDetails) and filterable here. These hooks must run on
  // every render (Rules of Hooks) — kept above the loading/error branches below, with
  // data-safe fallbacks so they're harmless before the fetch resolves.
  const allRows = rows || [];
  const semesters = useMemo(
    () => [...new Set(allRows.map((r) => r.semester).filter((n) => n != null))].sort((a, b) => a - b),
    [allRows]
  );
  const shownRows = useMemo(() => {
    if (semFilter === "ALL") return allRows;
    return allRows.filter((r) => r.semester === semFilter);
  }, [allRows, semFilter]);
  const chip = (on) => `rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${on ? "bg-joy text-white shadow-card" : "bg-muted text-muted-foreground hover:bg-muted/70"}`;

  // group by date
  const byDate = {};
  shownRows.forEach((r) => (byDate[r.date] = byDate[r.date] || []).push(r));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <PageTitle icon={CalendarX}>Absence Details</PageTitle>
          <p className="text-sm text-muted-foreground">Classes you missed, with the leave type.</p>
        </div>
        <Button variant="outline" size="sm" onClick={load}><RefreshCw className="h-4 w-4" /> Refresh</Button>
      </div>

      {!loading && !error && semesters.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Semester</span>
          {semesters.map((n) => (
            <motion.button key={n} onClick={() => setSemFilter(n)} whileTap={{ scale: 0.95 }} transition={{ type: "spring", stiffness: 500, damping: 30 }} className={chip(semFilter === n)}>Sem {n}</motion.button>
          ))}
          <motion.button onClick={() => setSemFilter("ALL")} whileTap={{ scale: 0.95 }} transition={{ type: "spring", stiffness: 500, damping: 30 }} className={chip(semFilter === "ALL")}>All</motion.button>
        </div>
      )}

      <AnimatePresence mode="wait">
      {loading ? (
        <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
        <div className="space-y-4">
          <SkeletonList rows={3} />
          <SkeletonList rows={3} />
        </div>
        </motion.div>
      ) : error ? (
        <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
        <Card><CardContent className="flex flex-col items-center gap-3 py-14 text-center">
          <AlertTriangle className="h-8 w-8 text-destructive" /><p className="font-medium">{error}</p>
          <Button variant="outline" onClick={load}><RefreshCw className="h-4 w-4" /> Retry</Button>
        </CardContent></Card>
        </motion.div>
      ) : allRows.length === 0 ? (
        <motion.div key="empty-none" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
        <Card><CardContent className="flex flex-col items-center gap-3 py-16 text-center">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20">
            <CheckCircle2 className="h-7 w-7" />
          </span>
          <p className="font-display text-lg font-semibold">Perfect attendance! 🎉</p>
          <p className="max-w-sm text-sm text-muted-foreground">You have no recorded absences. Keep it up!</p>
        </CardContent></Card>
        </motion.div>
      ) : shownRows.length === 0 ? (
        <motion.div key="empty-filtered" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
        <Card><CardContent className="py-14 text-center text-muted-foreground">No absences in this semester.</CardContent></Card>
        </motion.div>
      ) : (
        <motion.div key="content" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
        <div className="space-y-4">
          {Object.entries(byDate).map(([date, items]) => (
            <Card key={date}>
              <CardContent className="p-5">
                <div className="mb-3 flex items-center gap-2">
                  <span className="grid h-9 w-9 place-items-center rounded-xl bg-rose-100 text-rose-600 dark:bg-rose-500/20">
                    <CalendarX className="h-4 w-4" />
                  </span>
                  <p className="font-display text-base font-bold">{date}</p>
                  <span className="ml-auto text-xs text-muted-foreground">{items.length} class{items.length > 1 ? "es" : ""}</span>
                </div>
                <div className="space-y-2">
                  {items.map((r, i) => (
                    <div key={i} className="flex items-center justify-between gap-3 rounded-2xl border border-border p-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">{r.subjectName}</p>
                        <p className="text-xs text-muted-foreground">{r.subjectCode}</p>
                      </div>
                      <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${tag(r.leaveType)}`}>{r.leaveType}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        </motion.div>
      )}
      </AnimatePresence>
    </div>
  );
}
