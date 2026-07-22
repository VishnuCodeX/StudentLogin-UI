// Developed By: Vishnukarthick K

import { useEffect, useState } from "react";
import PageTitle from "@/components/PageTitle";
import { Loader2, AlertTriangle, RefreshCw, ClipboardList, FileBarChart } from "@/lib/icons";
import api, { unwrap } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const num = (v) => (v == null ? "—" : v);

export default function CiaResults() {
  const [exams, setExams] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  function load() {
    setLoading(true);
    setError("");
    unwrap(api.get("/results/cia"))
      .then(setExams)
      .catch((e) => setError(e?.response?.data?.message || "Could not load CIA results."))
      .finally(() => setLoading(false));
  }
  useEffect(load, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <PageTitle icon={ClipboardList}>CIA Results</PageTitle>
          <p className="text-sm text-muted-foreground">
            Continuous Internal Assessment — theory & practical components per subject.
          </p>
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
      ) : (exams || []).length === 0 ? (
        <Card><CardContent className="flex flex-col items-center gap-3 py-16 text-center">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-amber-100 text-amber-600 dark:bg-amber-500/20">
            <ClipboardList className="h-7 w-7" />
          </span>
          <p className="font-display text-lg font-semibold">No CIA results published yet</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Your internal assessment marks will appear here once the college publishes them.
          </p>
        </CardContent></Card>
      ) : (
        <div className="space-y-6">
          {exams.map((ex) => (
            <Card key={ex.examId}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-500/20">
                    <FileBarChart className="h-5 w-5" />
                  </span>
                  <div>
                    <CardTitle>{ex.examCode || "CIA"}</CardTitle>
                    <p className="text-xs text-muted-foreground">
                      {ex.className} {ex.semester ? `· Sem ${ex.semester}` : ""} {ex.month ? `· ${ex.month} ${ex.year || ""}` : ""}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-y border-border bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
                        <th rowSpan={2} className="px-4 py-2 text-left font-semibold align-bottom">Subject</th>
                        <th colSpan={4} className="px-3 py-2 text-center font-semibold border-l border-border">Theory</th>
                        <th colSpan={4} className="px-3 py-2 text-center font-semibold border-l border-border">Practical</th>
                        <th rowSpan={2} className="px-3 py-2 text-center font-semibold border-l border-border align-bottom">Total</th>
                        <th rowSpan={2} className="px-3 py-2 text-center font-semibold align-bottom">Result</th>
                      </tr>
                      <tr className="border-b border-border bg-muted/30 text-[11px] uppercase text-muted-foreground">
                        <th className="px-2 py-1.5 font-medium border-l border-border">Int</th>
                        <th className="px-2 py-1.5 font-medium">Att</th>
                        <th className="px-2 py-1.5 font-medium">Asg</th>
                        <th className="px-2 py-1.5 font-medium">Tot</th>
                        <th className="px-2 py-1.5 font-medium border-l border-border">Int</th>
                        <th className="px-2 py-1.5 font-medium">Att</th>
                        <th className="px-2 py-1.5 font-medium">Asg</th>
                        <th className="px-2 py-1.5 font-medium">Tot</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ex.subjects.map((s, i) => (
                        <tr key={i} className="border-b border-border last:border-0 hover:bg-muted/40">
                          <td className="px-4 py-2.5">
                            <p className="font-medium">{s.subjectName}</p>
                            <p className="text-xs text-muted-foreground">{s.subjectCode}</p>
                          </td>
                          <td className="px-2 py-2.5 text-center tabular-nums border-l border-border">{num(s.theoryInternal)}</td>
                          <td className="px-2 py-2.5 text-center tabular-nums">{num(s.theoryAttendance)}</td>
                          <td className="px-2 py-2.5 text-center tabular-nums">{num(s.theoryAssignment)}</td>
                          <td className="px-2 py-2.5 text-center tabular-nums font-semibold">{num(s.theoryTotal)}</td>
                          <td className="px-2 py-2.5 text-center tabular-nums border-l border-border">{num(s.practicalInternal)}</td>
                          <td className="px-2 py-2.5 text-center tabular-nums">{num(s.practicalAttendance)}</td>
                          <td className="px-2 py-2.5 text-center tabular-nums">{num(s.practicalAssignment)}</td>
                          <td className="px-2 py-2.5 text-center tabular-nums font-semibold">{num(s.practicalTotal)}</td>
                          <td className="px-3 py-2.5 text-center tabular-nums font-bold border-l border-border">{num(s.grandTotal)}</td>
                          <td className="px-3 py-2.5 text-center">
                            {s.result && (
                              <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                                /pass/i.test(s.result)
                                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300"
                                  : "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300"
                              }`}>{s.result}</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="px-4 py-2 text-[11px] text-muted-foreground">Int = Internal · Att = Attendance · Asg = Assignment · Tot = Total</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
