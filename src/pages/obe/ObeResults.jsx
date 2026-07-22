// Developed By: Vishnukarthick K

import { useEffect, useState } from "react";
import PageTitle from "@/components/PageTitle";
import {
  Loader2, AlertTriangle, RefreshCw, Trophy, ListChecks, MessageSquareHeart, CheckCircle2,
} from "@/lib/icons";
import api, { unwrap } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

function gradeColor(pct) {
  if (pct >= 75) return "text-success";
  if (pct >= 40) return "text-amber-600 dark:text-amber-400";
  return "text-destructive";
}

export default function ObeResults() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  function load() {
    setLoading(true);
    setError("");
    unwrap(api.get("/obe/results", { skipErrorToast: true }))
      .then(setData)
      .catch((e) => setError(e?.response?.data?.message || "Could not load your results."))
      .finally(() => setLoading(false));
  }
  useEffect(load, []);

  const quizzes = data?.quizzes || [];
  const surveys = data?.surveys || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <PageTitle icon={Trophy}>My OBE Results</PageTitle>
          <p className="text-sm text-muted-foreground">Marks and percentage for the quizzes you've completed.</p>
        </div>
        <Button variant="outline" size="sm" onClick={load}><RefreshCw className="h-4 w-4" /> Refresh</Button>
      </div>

      {loading ? (
        <div className="flex h-48 items-center justify-center text-muted-foreground"><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading…</div>
      ) : error ? (
        <Card><CardContent className="flex flex-col items-center gap-3 py-14 text-center">
          <AlertTriangle className="h-8 w-8 text-destructive" /><p className="font-medium">{error}</p>
          <Button variant="outline" onClick={load}><RefreshCw className="h-4 w-4" /> Retry</Button>
        </CardContent></Card>
      ) : quizzes.length === 0 && surveys.length === 0 ? (
        <Card><CardContent className="flex flex-col items-center gap-3 py-16 text-center">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-amber-100 text-amber-600 dark:bg-amber-500/20"><Trophy className="h-7 w-7" /></span>
          <p className="font-display text-lg font-semibold">No results yet</p>
          <p className="max-w-sm text-sm text-muted-foreground">Complete a quiz or survey and your results will show up here.</p>
        </CardContent></Card>
      ) : (
        <>
          {quizzes.length > 0 && (
            <div>
              <p className="mb-2 flex items-center gap-1.5 text-sm font-bold uppercase tracking-wide text-muted-foreground"><ListChecks className="h-4 w-4" /> Quizzes</p>
              <div className="space-y-3">
                {quizzes.map((q) => (
                  <Card key={q.quizId}><CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                    <div className="min-w-0">
                      <p className="truncate font-display text-base font-bold">{q.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {q.correct}/{q.total} correct{q.submittedDate ? ` · ${q.submittedDate}` : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-4 text-right">
                      <div>
                        <p className="font-display text-lg font-bold">{q.score}<span className="text-sm text-muted-foreground">/{q.maxScore}</span></p>
                        <p className={`text-sm font-bold ${gradeColor(q.percentage)}`}>{q.percentage}%</p>
                      </div>
                      {/* mini progress ring-ish bar */}
                      <div className="h-12 w-12 shrink-0 rounded-full grid place-items-center"
                        style={{ background: `conic-gradient(currentColor ${q.percentage * 3.6}deg, var(--muted, #e5e5e5) 0deg)` }}>
                        <span className="grid h-9 w-9 place-items-center rounded-full bg-card text-[11px] font-bold">{q.percentage}%</span>
                      </div>
                    </div>
                  </CardContent></Card>
                ))}
              </div>
            </div>
          )}

          {surveys.length > 0 && (
            <div>
              <p className="mb-2 flex items-center gap-1.5 text-sm font-bold uppercase tracking-wide text-muted-foreground"><MessageSquareHeart className="h-4 w-4" /> Surveys</p>
              <div className="space-y-2">
                {surveys.map((s) => (
                  <Card key={s.surveyId}><CardContent className="flex items-center justify-between gap-3 p-4">
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{s.title}</p>
                      {s.submittedDate && <p className="text-xs text-muted-foreground">Submitted {s.submittedDate}</p>}
                    </div>
                    <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-success/15 px-3 py-1 text-sm font-bold text-success"><CheckCircle2 className="h-4 w-4" /> Submitted</span>
                  </CardContent></Card>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
