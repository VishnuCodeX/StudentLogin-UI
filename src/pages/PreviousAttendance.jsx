import { useEffect, useState } from "react";
import PageTitle from "@/components/PageTitle";
import { Loader2, AlertTriangle, RefreshCw, History } from "@/lib/icons";
import api, { unwrap } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import AbsenceModal from "@/components/AbsenceModal";

const pctTone = (p) => (p < 75 ? "text-[#c5552f]" : p < 85 ? "text-[#a87c12]" : "text-[#3f7a4b]");

export default function PreviousAttendance() {
  const [classes, setClasses] = useState(null);
  const [classId, setClassId] = useState("");
  const [rows, setRows] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingRows, setLoadingRows] = useState(false);
  const [error, setError] = useState("");
  const [popup, setPopup] = useState(null);

  function loadClasses() {
    setLoading(true);
    setError("");
    unwrap(api.get("/attendance/previous-classes"))
      .then((c) => {
        setClasses(c);
        if (c?.length) { setClassId(String(c[0].id)); loadRows(c[0].id); }
      })
      .catch((e) => setError(e?.response?.data?.message || "Could not load previous classes."))
      .finally(() => setLoading(false));
  }
  useEffect(loadClasses, []);

  function loadRows(id) {
    if (!id) return;
    setLoadingRows(true);
    unwrap(api.get(`/attendance/previous-class/${id}`))
      .then(setRows)
      .catch(() => setRows([]))
      .finally(() => setLoadingRows(false));
  }

  function onPick(e) {
    const id = e.target.value;
    setClassId(id);
    loadRows(id);
  }

  const total = (rows || []).reduce(
    (a, r) => ({ conducted: a.conducted + r.conducted, present: a.present + r.present, absent: a.absent + r.absent }),
    { conducted: 0, present: 0, absent: 0 }
  );
  const totalPct = total.conducted ? Math.round((total.present / total.conducted) * 10000) / 100 : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <PageTitle icon={History}>Previous Class Attendance</PageTitle>
          <p className="text-sm text-muted-foreground">Subject-wise attendance for a class you've completed.</p>
        </div>
        <Button variant="outline" size="sm" onClick={loadClasses}><RefreshCw className="h-4 w-4" /> Refresh</Button>
      </div>

      {loading ? (
        <div className="flex h-48 items-center justify-center text-muted-foreground">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading…
        </div>
      ) : error ? (
        <Card><CardContent className="flex flex-col items-center gap-3 py-14 text-center">
          <AlertTriangle className="h-8 w-8 text-destructive" /><p className="font-medium">{error}</p>
          <Button variant="outline" onClick={loadClasses}><RefreshCw className="h-4 w-4" /> Retry</Button>
        </CardContent></Card>
      ) : (classes || []).length === 0 ? (
        <Card><CardContent className="flex flex-col items-center gap-3 py-16 text-center">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary"><History className="h-7 w-7" /></span>
          <p className="font-display text-lg font-semibold">No previous classes</p>
          <p className="max-w-sm text-sm text-muted-foreground">Your earlier class attendance will appear here once you move to a higher semester.</p>
        </CardContent></Card>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <label className="text-sm font-semibold text-foreground/80">Class</label>
            <select value={classId} onChange={onPick}
              className="rounded-xl border border-input bg-card px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring">
              {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          {loadingRows ? (
            <div className="flex h-32 items-center justify-center text-muted-foreground"><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading…</div>
          ) : (rows || []).length === 0 ? (
            <Card><CardContent className="py-12 text-center text-sm text-muted-foreground">No attendance recorded for this class.</CardContent></Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                        <th className="px-5 py-3 font-semibold">Subject</th>
                        <th className="px-3 py-3 font-semibold">Type</th>
                        <th className="px-3 py-3 text-center font-semibold">Conducted</th>
                        <th className="px-3 py-3 text-center font-semibold">Present</th>
                        <th className="px-3 py-3 text-center font-semibold">Absent</th>
                        <th className="px-5 py-3 text-center font-semibold">%</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((r, i) => (
                        <tr key={i} className="border-b border-border last:border-0 hover:bg-muted/40">
                          <td className="px-5 py-3">
                            <p className="font-medium">{r.subjectName}</p>
                            <p className="text-xs text-muted-foreground">{r.subjectCode}</p>
                          </td>
                          <td className="px-3 py-3 text-muted-foreground">{r.attendanceType || "—"}</td>
                          <td className="px-3 py-3 text-center tabular-nums">{r.conducted}</td>
                          <td className="px-3 py-3 text-center tabular-nums text-[#3f7a4b]">{r.present}</td>
                          <td className="px-3 py-3 text-center">
                            {r.absent > 0 && r.subjectId ? (
                              <button onClick={() => setPopup(r)} className="font-bold text-[#c5552f] underline decoration-dotted underline-offset-2 hover:opacity-80 tabular-nums">{r.absent}</button>
                            ) : (
                              <span className="tabular-nums text-[#c5552f]">{r.absent}</span>
                            )}
                          </td>
                          <td className={`px-5 py-3 text-center font-bold tabular-nums ${pctTone(r.percentage)}`}>{r.percentage}%</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-border bg-muted/40 font-bold">
                        <td className="px-5 py-3" colSpan={2}>Total</td>
                        <td className="px-3 py-3 text-center tabular-nums">{total.conducted}</td>
                        <td className="px-3 py-3 text-center tabular-nums text-[#3f7a4b]">{total.present}</td>
                        <td className="px-3 py-3 text-center tabular-nums text-[#c5552f]">{total.absent}</td>
                        <td className={`px-5 py-3 text-center tabular-nums ${pctTone(totalPct)}`}>{totalPct}%</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {(rows || []).length > 0 && (
            <p className="rounded-2xl border border-border bg-muted/40 px-4 py-3 text-xs text-muted-foreground">
              Click an <b>Absent</b> count to see the dates, periods &amp; teacher for that subject.
            </p>
          )}
        </>
      )}

      {popup && <AbsenceModal subject={{ subjectId: popup.subjectId, subjectName: popup.subjectName, subjectCode: popup.subjectCode }} onClose={() => setPopup(null)} />}
    </div>
  );
}
