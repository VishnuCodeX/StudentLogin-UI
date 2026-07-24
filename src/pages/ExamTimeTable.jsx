// Developed By: Vishnukarthick K

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import PageTitle from "@/components/PageTitle";
import { AlertTriangle, RefreshCw, CalendarClock, CalendarDays } from "@/lib/icons";
import api, { unwrap } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton, SkeletonList } from "@/components/ui/skeleton";

export default function ExamTimeTable() {
  const [slots, setSlots] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  function load() {
    setLoading(true);
    setError("");
    unwrap(api.get("/timetable/exam"))
      .then(setSlots)
      .catch((e) => setError(e?.response?.data?.message || "Could not load exam timetable."))
      .finally(() => setLoading(false));
  }
  useEffect(load, []);

  const byExam = {};
  (slots || []).forEach((s) => (byExam[s.examCode || "Exam"] = byExam[s.examCode || "Exam"] || []).push(s));

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let nextSlot = null;
  let nextDiff = Infinity;
  (slots || []).forEach((s) => {
    if (!s.date) return;
    const d = new Date(s.date);
    if (isNaN(d.getTime())) return;
    d.setHours(0, 0, 0, 0);
    const diff = d - today;
    if (diff >= 0 && diff < nextDiff) {
      nextDiff = diff;
      nextSlot = s;
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <PageTitle icon={CalendarDays}>Exam Time Table</PageTitle>
          <p className="text-sm text-muted-foreground">Your upcoming exam schedule.</p>
        </div>
        <Button variant="outline" size="sm" onClick={load}><RefreshCw className="h-4 w-4" /> Refresh</Button>
      </div>

      <AnimatePresence mode="wait">
      {loading ? (
        <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
        <div className="space-y-5">
          <Card>
            <CardContent className="p-5">
              <Skeleton className="mb-3 h-4 w-24" />
              <SkeletonList rows={3} />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <Skeleton className="mb-3 h-4 w-24" />
              <SkeletonList rows={2} />
            </CardContent>
          </Card>
        </div>
        </motion.div>
      ) : error ? (
        <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
        <Card><CardContent className="flex flex-col items-center gap-3 py-14 text-center">
          <AlertTriangle className="h-8 w-8 text-destructive" /><p className="font-medium">{error}</p>
          <Button variant="outline" onClick={load}><RefreshCw className="h-4 w-4" /> Retry</Button>
        </CardContent></Card>
        </motion.div>
      ) : (slots || []).length === 0 ? (
        <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
        <Card><CardContent className="flex flex-col items-center gap-3 py-16 text-center">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-pink-100 text-pink-600 dark:bg-pink-500/20">
            <CalendarClock className="h-7 w-7" />
          </span>
          <p className="font-display text-lg font-semibold">No exam schedule yet</p>
          <p className="max-w-sm text-sm text-muted-foreground">Your exam timetable will appear here once it&apos;s published.</p>
        </CardContent></Card>
        </motion.div>
      ) : (
        <motion.div key="content" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
        <div className="space-y-5">
          {Object.entries(byExam).map(([exam, items]) => (
            <Card key={exam}>
              <CardContent className="p-5">
                <p className="mb-3 font-display text-base font-bold text-primary">{exam}</p>
                <div className="space-y-2">
                  {items.map((s, i) => {
                    const isNext = s === nextSlot;
                    return (
                      <div
                        key={i}
                        className={`flex items-center gap-3 rounded-2xl border p-3 transition-colors ${isNext ? "border-primary" : "border-border"}`}
                      >
                        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-pink-400 to-rose-500 text-white text-xs font-bold text-center leading-tight">
                          {s.date?.slice(5) || "—"}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold">{s.subjectName}</p>
                          <p className="text-xs text-muted-foreground">{s.subjectCode}</p>
                        </div>
                        <div className="shrink-0 text-right text-xs text-muted-foreground">
                          <div className="flex items-center justify-end gap-1.5">
                            {isNext && (
                              <motion.span
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground"
                              >
                                Next
                              </motion.span>
                            )}
                            <p className="font-semibold text-foreground">{s.date}</p>
                          </div>
                          <p>{s.startTime}{s.endTime ? ` – ${s.endTime}` : ""}</p>
                        </div>
                      </div>
                    );
                  })}
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
