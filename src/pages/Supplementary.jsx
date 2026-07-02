import { useEffect, useMemo, useState } from "react";
import PageTitle from "@/components/PageTitle";
import { Loader2, AlertTriangle, RefreshCw, FileWarning, CheckCircle2 } from "@/lib/icons";
import api, { unwrap } from "@/lib/api";
import { toast } from "@/lib/toast";
import { goToGateway, handlePaymentReturn } from "@/lib/payments";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Supplementary() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sel, setSel] = useState({}); // subjectId -> {theory, practical, examId, classId}
  const [submitting, setSubmitting] = useState(false);

  function load() {
    setLoading(true);
    setError("");
    unwrap(api.get("/supplementary", { skipErrorToast: true }))
      .then((d) => { setData(d); setSel({}); })
      .catch((e) => setError(e?.response?.data?.message || "Could not load supplementary eligibility."))
      .finally(() => setLoading(false));
  }
  useEffect(load, []);
  useEffect(() => { handlePaymentReturn(); }, []);

  const theoryFee = data?.theoryFee ?? 0;
  const practicalFee = data?.practicalFee ?? 0;

  function toggle(s, kind) {
    setSel((prev) => {
      const cur = prev[s.subjectId] || { theory: false, practical: false, examId: s.examId, classId: s.classId };
      const next = { ...cur, [kind]: !cur[kind] };
      const copy = { ...prev };
      if (!next.theory && !next.practical) delete copy[s.subjectId];
      else copy[s.subjectId] = next;
      return copy;
    });
  }

  const total = useMemo(() => {
    return Object.values(sel).reduce(
      (sum, v) => sum + (v.theory ? theoryFee : 0) + (v.practical ? practicalFee : 0), 0
    );
  }, [sel, theoryFee, practicalFee]);

  async function submit() {
    const selections = Object.entries(sel).map(([subjectId, v]) => ({
      subjectId: Number(subjectId), examId: v.examId, classId: v.classId, theory: v.theory, practical: v.practical,
    }));
    if (selections.length === 0) { toast.warning("Please select at least one subject."); return; }
    setSubmitting(true);
    try {
      // Apply + pay in one step: records the rows and hands off to UCO Bank.
      const res = await unwrap(api.post("/supplementary/apply-and-pay", { selections }));
      if (!goToGateway(res)) load();
    } catch {
      // error snackbar shown globally
    } finally {
      setSubmitting(false);
    }
  }

  const subjects = data?.failedSubjects || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <PageTitle icon={FileWarning}>Supplementary Application</PageTitle>
          <p className="text-sm text-muted-foreground">Apply to re-attempt subjects you didn't clear.</p>
        </div>
        <Button variant="outline" size="sm" onClick={load}><RefreshCw className="h-4 w-4" /> Refresh</Button>
      </div>

      {(theoryFee > 0 || practicalFee > 0) && (
        <div className="rounded-2xl border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
          Fees per subject — Theory: <b className="text-foreground">₹{theoryFee}</b> · Practical: <b className="text-foreground">₹{practicalFee}</b>
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
      ) : subjects.length === 0 ? (
        <Card><CardContent className="flex flex-col items-center gap-3 py-16 text-center">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20">
            <CheckCircle2 className="h-7 w-7" />
          </span>
          <p className="font-display text-lg font-semibold">Nothing to apply for 🎉</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            You have no subjects pending a supplementary attempt. Keep it up!
          </p>
        </CardContent></Card>
      ) : (
        <>
          <Card className="hidden md:block">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
                      <th className="px-5 py-3 text-left font-semibold">Exam / Subject</th>
                      <th className="px-3 py-3 text-center font-semibold">Status</th>
                      <th className="px-3 py-3 text-center font-semibold">Apply Theory</th>
                      <th className="px-5 py-3 text-center font-semibold">Apply Practical</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subjects.map((s) => {
                      const cur = sel[s.subjectId] || {};
                      return (
                        <tr key={s.subjectId} className="border-b border-border last:border-0 hover:bg-muted/40">
                          <td className="px-5 py-3">
                            <p className="font-medium">{s.subjectName}</p>
                            <p className="text-xs text-muted-foreground">
                              {s.subjectCode} · {s.examCode} {s.month} {s.year}
                            </p>
                          </td>
                          <td className="px-3 py-3 text-center">
                            <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-bold text-rose-700 dark:bg-rose-500/20 dark:text-rose-300">
                              {s.failStatus || "Failed"}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-center">
                            <input type="checkbox" className="h-4 w-4 accent-amber-600" checked={!!cur.theory} onChange={() => toggle(s, "theory")} />
                          </td>
                          <td className="px-5 py-3 text-center">
                            <input type="checkbox" className="h-4 w-4 accent-amber-600" checked={!!cur.practical} onChange={() => toggle(s, "practical")} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* mobile */}
          <div className="space-y-3 md:hidden">
            {subjects.map((s) => {
              const cur = sel[s.subjectId] || {};
              return (
                <Card key={s.subjectId}>
                  <CardContent className="p-4">
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold">{s.subjectName}</p>
                        <p className="text-xs text-muted-foreground">{s.subjectCode} · {s.examCode} {s.year}</p>
                      </div>
                      <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-bold text-rose-700 dark:bg-rose-500/20 dark:text-rose-300">
                        {s.failStatus || "Failed"}
                      </span>
                    </div>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 text-sm">
                        <input type="checkbox" className="h-4 w-4 accent-amber-600" checked={!!cur.theory} onChange={() => toggle(s, "theory")} /> Theory
                      </label>
                      <label className="flex items-center gap-2 text-sm">
                        <input type="checkbox" className="h-4 w-4 accent-amber-600" checked={!!cur.practical} onChange={() => toggle(s, "practical")} /> Practical
                      </label>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="sticky bottom-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4 shadow-lg">
            <p className="font-display text-lg font-bold">Total: ₹{total}</p>
            <Button onClick={submit} disabled={submitting || total === 0} className="bg-joy text-white">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileWarning className="h-4 w-4" />}
              Submit Application
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
