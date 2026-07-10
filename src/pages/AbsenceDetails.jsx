import { useEffect, useMemo, useState } from "react";
import PageTitle from "@/components/PageTitle";
import { Loader2, AlertTriangle, RefreshCw, CalendarX, CheckCircle2 } from "@/lib/icons";
import api, { unwrap } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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
  const chip = (on) => `rounded-full px-4 py-1.5 text-sm font-semibold transition ${on ? "bg-joy text-white shadow-card" : "bg-muted text-muted-foreground hover:bg-muted/70"}`;

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
            <button key={n} onClick={() => setSemFilter(n)} className={chip(semFilter === n)}>Sem {n}</button>
          ))}
          <button onClick={() => setSemFilter("ALL")} className={chip(semFilter === "ALL")}>All</button>
        </div>
      )}

      {loading ? (
        <div className="flex h-48 items-center justify-center text-muted-foreground">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading…
        </div>
      ) : error ? (
        <Card><CardContent className="flex flex-col items-center gap-3 py-14 text-center">
          <AlertTriangle className="h-8 w-8 text-destructive" /><p className="font-medium">{error}</p>
          <Button variant="outline" onClick={load}><RefreshCw className="h-4 w-4" /> Retry</Button>
        </CardContent></Card>
      ) : allRows.length === 0 ? (
        <Card><CardContent className="flex flex-col items-center gap-3 py-16 text-center">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20">
            <CheckCircle2 className="h-7 w-7" />
          </span>
          <p className="font-display text-lg font-semibold">Perfect attendance! 🎉</p>
          <p className="max-w-sm text-sm text-muted-foreground">You have no recorded absences. Keep it up!</p>
        </CardContent></Card>
      ) : shownRows.length === 0 ? (
        <Card><CardContent className="py-14 text-center text-muted-foreground">No absences in this semester.</CardContent></Card>
      ) : (
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
      )}
    </div>
  );
}
