// Developed By: Vishnukarthick K

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import PageTitle from "@/components/PageTitle";
import { Loader2, AlertTriangle, RefreshCw, Trophy, CalendarCheck, CheckCircle2, Info } from "@/lib/icons";
import api, { unwrap } from "@/lib/api";
import { toast } from "@/lib/toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SkeletonCard } from "@/components/ui/skeleton";
import LoadingCardModal from "@/components/LoadingCardModal";

const STATUS_STYLE = {
  Pending: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  Approved: "bg-success/15 text-success",
  Rejected: "bg-destructive/15 text-destructive",
};

const NOTE_LINES = [
  "Please Check the box (✔) and select the activity to give co-curricular Attendance",
  "For applying extra curricular attendance, click on check box and Select the corresponding activities",
  "Type of activity can be selected only once and you cannot change the activity once it is applied",
];

export default function CocurricularLeave() {
  const [view, setView] = useState(null); // { activities, days }
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [rows, setRows] = useState({}); // key -> { checked, activityId }
  const [submitting, setSubmitting] = useState(false);
  const [justApplied, setJustApplied] = useState(() => new Set());

  function load() {
    setLoading(true);
    setError("");
    setRows({});
    setJustApplied(new Set());
    unwrap(api.get("/attendance/cocurricular/applicable"))
      .then(setView)
      .catch((e) => setError(e?.response?.data?.message || "Could not load co-curricular leave."))
      .finally(() => setLoading(false));
  }
  useEffect(load, []);

  const activities = view?.activities || [];
  const days = view?.days || [];
  const hasOpen = useMemo(
    () => days.some((d) => (d.periods || []).some((p) => !p.applied)),
    [days]
  );

  const keyOf = (date, p) => `${date}|${p.periodId}`;

  function toggle(key, checked) {
    setRows((r) => ({ ...r, [key]: { ...(r[key] || {}), checked } }));
  }
  function setActivity(key, activityId) {
    setRows((r) => ({ ...r, [key]: { ...(r[key] || {}), activityId } }));
  }

  async function submit() {
    const items = [];
    for (const d of days) {
      for (const p of d.periods || []) {
        if (p.applied) continue;
        const row = rows[keyOf(d.date, p)];
        if (row?.checked) {
          if (!row.activityId) {
            toast.error("Select an activity for every checked period.");
            return;
          }
          items.push({ date: d.date, periodId: p.periodId, activityId: Number(row.activityId) });
        }
      }
    }
    if (items.length === 0) {
      toast.error("Check at least one period and select its activity.");
      return;
    }
    setSubmitting(true);
    try {
      const updated = await unwrap(
        api.post("/attendance/cocurricular/apply", { items }, { skipErrorToast: true })
      );
      setView(updated);
      setRows({});
      setJustApplied(new Set(items.map((it) => `${it.date}|${it.periodId}`)));
      toast.success(`Applied co-curricular leave for ${items.length} period${items.length > 1 ? "s" : ""}.`);
    } catch (e) {
      toast.error(e?.response?.data?.message || "Could not submit. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <LoadingCardModal open={loading} label="Fetching your records" />

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <PageTitle icon={Trophy}>Co-curricular Leave Application</PageTitle>
          <p className="text-sm text-muted-foreground">
            Claim co-curricular attendance for sessions you missed for an approved activity.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={load}><RefreshCw className="h-4 w-4" /> Refresh</Button>
      </div>

      {/* status legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs">
        <span className="flex items-center gap-1.5"><i className="h-3 w-3 rounded-full bg-amber-400" /> Pending / Applied</span>
        <span className="flex items-center gap-1.5"><i className="h-3 w-3 rounded-full bg-emerald-500" /> Approved</span>
        <span className="flex items-center gap-1.5"><i className="h-3 w-3 rounded-full bg-rose-500" /> Rejected</span>
      </div>

      <AnimatePresence mode="wait">
      {loading ? (
        <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
        <div className="space-y-4">
          <SkeletonCard lines={4} />
          <SkeletonCard lines={3} />
        </div>
        </motion.div>
      ) : error ? (
        <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
        <Card><CardContent className="flex flex-col items-center gap-3 py-14 text-center">
          <AlertTriangle className="h-8 w-8 text-destructive" /><p className="font-medium">{error}</p>
          <Button variant="outline" onClick={load}><RefreshCw className="h-4 w-4" /> Retry</Button>
        </CardContent></Card>
        </motion.div>
      ) : days.length === 0 ? (
        <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
        <Card><CardContent className="flex flex-col items-center gap-3 py-16 text-center">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-amber-100 text-amber-600">
            <Trophy className="h-7 w-7" />
          </span>
          <p className="font-display text-lg font-semibold">Nothing to apply</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            You have no recent absent sessions available for a co-curricular leave application.
          </p>
        </CardContent></Card>
        </motion.div>
      ) : (
        <motion.div key="content" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
          <div className="space-y-4">
            {days.map((d) => (
              <Card key={d.date}>
                <CardContent className="p-5">
                  <div className="mb-3 flex items-center gap-2">
                    <span className="grid h-9 w-9 place-items-center rounded-xl bg-amber-100 text-amber-600">
                      <CalendarCheck className="h-4 w-4" />
                    </span>
                    <p className="font-display text-base font-bold">{d.date}</p>
                    <span className="ml-auto text-xs text-muted-foreground">
                      {(d.periods || []).length} session{(d.periods || []).length > 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {(d.periods || []).map((p) => {
                      const key = keyOf(d.date, p);
                      const row = rows[key] || {};
                      const isFreshlyApplied = p.applied && justApplied.has(key);
                      return (
                        <div
                          key={key}
                          className={`relative overflow-hidden flex flex-col gap-3 rounded-2xl border p-3 sm:flex-row sm:items-center ${
                            p.applied ? "border-border bg-muted/40" : "border-border"
                          }`}
                        >
                          {isFreshlyApplied && (
                            <motion.div
                              aria-hidden="true"
                              className="pointer-events-none absolute inset-0 rounded-2xl"
                              initial={{ backgroundColor: "rgba(251,191,36,0.35)" }}
                              animate={{ backgroundColor: "rgba(251,191,36,0)" }}
                              transition={{ duration: 0.8, ease: "easeOut" }}
                              onAnimationComplete={() => {
                                setJustApplied((prev) => {
                                  if (!prev.has(key)) return prev;
                                  const next = new Set(prev);
                                  next.delete(key);
                                  return next;
                                });
                              }}
                            />
                          )}
                          {/* checkbox + period/subject */}
                          <label className="flex min-w-0 flex-1 items-start gap-3">
                            <input
                              type="checkbox"
                              className="mt-0.5 h-4 w-4 shrink-0 accent-[#7a1f1f]"
                              checked={p.applied || !!row.checked}
                              disabled={p.applied}
                              onChange={(e) => toggle(key, e.target.checked)}
                            />
                            <span className="min-w-0">
                              <span className="block text-sm font-semibold">{p.subjectName || p.subjectCode}</span>
                              <span className="text-xs text-muted-foreground">{p.periodName} · {p.subjectCode}</span>
                            </span>
                          </label>

                          {/* activity + status */}
                          <div className="flex items-center gap-2 sm:w-80 sm:shrink-0">
                            {p.applied ? (
                              <>
                                <span className="flex-1 truncate rounded-xl border border-border bg-card px-3 py-2 text-sm text-muted-foreground">
                                  {p.activityName || "Activity selected"}
                                </span>
                                <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${STATUS_STYLE[p.status] || "bg-muted text-foreground"}`}>
                                  {p.status || "Applied"}
                                </span>
                              </>
                            ) : (
                              <AnimatePresence initial={false}>
                                {row.checked && (
                                  <motion.div
                                    key="activity-select"
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="w-full overflow-hidden"
                                  >
                                    <select
                                      value={row.activityId || ""}
                                      onChange={(e) => setActivity(key, e.target.value)}
                                      className="w-full rounded-xl border border-input bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                                    >
                                      <option value="">— Select activity —</option>
                                      {activities.map((a) => (
                                        <option key={a.id} value={a.id}>{a.name}</option>
                                      ))}
                                    </select>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* NOTE */}
          <div className="rounded-2xl border border-border border-l-4 border-l-[#7a1f1f] bg-[#7a1f1f]/[0.04] p-4">
            <p className="mb-2 flex items-center gap-1.5 font-bold text-[#7a1f1f]">
              <Info className="h-4 w-4" /> Note :-
            </p>
            <ul className="space-y-1.5">
              {NOTE_LINES.map((line, i) => (
                <li key={i} className="flex gap-2 text-sm text-foreground/80">
                  <span className="font-bold text-[#7a1f1f]">#</span>
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* apply */}
          <div className="flex justify-center">
            <Button onClick={submit} disabled={submitting || !hasOpen} className="min-w-40">
              {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Applying…</> : <><CheckCircle2 className="h-4 w-4" /> Apply Now</>}
            </Button>
          </div>
        </motion.div>
      )}
      </AnimatePresence>
    </div>
  );
}
