// Developed By: Vishnukarthick K

import { useEffect, useState } from "react";
import PageTitle from "@/components/PageTitle";
import { Loader2, AlertTriangle, RefreshCw, CalendarClock, CalendarDays } from "@/lib/icons";
import api, { unwrap } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <PageTitle icon={CalendarDays}>Exam Time Table</PageTitle>
          <p className="text-sm text-muted-foreground">Your upcoming exam schedule.</p>
        </div>
        <Button variant="outline" size="sm" onClick={load}><RefreshCw className="h-4 w-4" /> Refresh</Button>
      </div>

      {loading ? (
        <div className="flex h-48 items-center justify-center text-muted-foreground">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading…
        </div>
      ) : error ? (
        <Card><CardContent className="flex flex-col items-center gap-3 py-14 text-center">
          <AlertTriangle className="h-8 w-8 text-destructive" /><p className="font-medium">{error}</p>
          <Button variant="outline" onClick={load}><RefreshCw className="h-4 w-4" /> Retry</Button>
        </CardContent></Card>
      ) : (slots || []).length === 0 ? (
        <Card><CardContent className="flex flex-col items-center gap-3 py-16 text-center">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-pink-100 text-pink-600 dark:bg-pink-500/20">
            <CalendarClock className="h-7 w-7" />
          </span>
          <p className="font-display text-lg font-semibold">No exam schedule yet</p>
          <p className="max-w-sm text-sm text-muted-foreground">Your exam timetable will appear here once it&apos;s published.</p>
        </CardContent></Card>
      ) : (
        <div className="space-y-5">
          {Object.entries(byExam).map(([exam, items]) => (
            <Card key={exam}>
              <CardContent className="p-5">
                <p className="mb-3 font-display text-base font-bold text-primary">{exam}</p>
                <div className="space-y-2">
                  {items.map((s, i) => (
                    <div key={i} className="flex items-center gap-3 rounded-2xl border border-border p-3">
                      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-pink-400 to-rose-500 text-white text-xs font-bold text-center leading-tight">
                        {s.date?.slice(5) || "—"}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{s.subjectName}</p>
                        <p className="text-xs text-muted-foreground">{s.subjectCode}</p>
                      </div>
                      <div className="shrink-0 text-right text-xs text-muted-foreground">
                        <p className="font-semibold text-foreground">{s.date}</p>
                        <p>{s.startTime}{s.endTime ? ` – ${s.endTime}` : ""}</p>
                      </div>
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
