// Developed By: Vishnukarthick K

import { useEffect, useState } from "react";
import PageTitle from "@/components/PageTitle";
import { Loader2, AlertTriangle, RefreshCw, CreditCard, CheckCircle2, Download } from "@/lib/icons";
import api, { unwrap } from "@/lib/api";
import { toast } from "@/lib/toast";
import { goToGateway, handlePaymentReturn } from "@/lib/payments";
import { printPage } from "@/lib/print";
import logo from "@/assets/images/mcc-title-brown.png";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const boxTable = { width: "100%", borderCollapse: "collapse", border: "1.5px solid #1a1208" };
const boxLabel = { border: "1px solid #c9bda6", padding: "6px 10px", fontWeight: 700, width: "22%", verticalAlign: "top", background: "#f8f3ea" };
const boxValueWide = { border: "1px solid #c9bda6", padding: "6px 10px" };
const pth = (align = "center") => ({ border: "1px solid #6e5638", padding: "4px 8px", background: "#5c4632", color: "#fdf8ee", textAlign: align, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.4px" });
const ptd = (align = "center") => ({ border: "1px solid #c9bda6", padding: "3px 8px", textAlign: align });

// The formal printed receipt — hidden on screen, shown only inside .print-area during printing
// (the global print stylesheet hides everything else; see PrintCeeReceipt in CeeReceipts.jsx
// for the same pattern, and Fees.jsx's PrintFeeChallan for where it originates).
function PrintAttnShortageReceipt({ r }) {
  return (
    <div className="print-area" style={{ color: "#1a1208", fontFamily: "'Inter', Arial, sans-serif", fontSize: 12, padding: "0 4px" }}>
      <div style={{ textAlign: "center", borderBottom: "2px solid #800020", paddingBottom: 8, marginBottom: 14 }}>
        <img src={logo} alt="Mount Carmel University" style={{ height: 48, margin: "0 auto 6px", display: "block" }} />
        <div style={{ marginTop: 8, fontSize: 13, fontWeight: 700, letterSpacing: "0.5px" }}>ATTENDANCE SHORTAGE FINE — PAYMENT RECEIPT</div>
      </div>

      <table style={boxTable}>
        <tbody>
          <tr><td style={boxLabel}>Name of the Student</td><td style={boxValueWide}>{r.studentName || "—"}</td></tr>
          <tr><td style={boxLabel}>Register Number</td><td style={boxValueWide}>{r.registerNo || "—"}</td></tr>
          <tr><td style={boxLabel}>Course</td><td style={boxValueWide}>{r.course || "—"}</td></tr>
          <tr><td style={boxLabel}>Exam</td><td style={boxValueWide}>{r.examLabel || "—"}</td></tr>
        </tbody>
      </table>

      <table style={{ ...boxTable, marginTop: 12 }}>
        <thead>
          <tr>
            <th style={pth("left")}>Subject</th>
            <th style={pth("center")}>Paid On</th>
            <th style={pth("right")}>Amount</th>
          </tr>
        </thead>
        <tbody>
          {(r.items || []).map((it, i) => (
            <tr key={i}>
              <td style={ptd("left")}>{it.subjectName} ({it.subjectCode})</td>
              <td style={ptd("center")}>{it.paidDate}</td>
              <td style={ptd("right")}>₹{it.amount}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8, fontSize: 13, fontWeight: 700 }}>
        Total Paid: ₹{r.totalAmount}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 44, fontSize: 11, fontWeight: 600 }}>
        <div>Date :</div>
        <div>Signature / Seal</div>
      </div>
    </div>
  );
}

export default function AttendanceShortageFine() {
  const [exams, setExams] = useState([]);
  const [examId, setExamId] = useState("");
  const [subjects, setSubjects] = useState(null);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [error, setError] = useState("");
  const [paying, setPaying] = useState(false);
  const [receipt, setReceipt] = useState(null);

  function loadExams() {
    setLoading(true);
    setError("");
    unwrap(api.get("/attendance-shortage-fine/exams", { skipErrorToast: true }))
      .then((d) => {
        setExams(d || []);
        if (d?.length) setExamId(String(d[0].examId));
      })
      .catch((e) => setError(e?.response?.data?.message || "Could not load exams."))
      .finally(() => setLoading(false));
  }
  useEffect(loadExams, []);
  useEffect(() => { handlePaymentReturn(); }, []);

  function loadSubjects(id) {
    if (!id) return;
    setLoadingSubjects(true);
    setSelected([]);
    setReceipt(null);
    unwrap(api.get("/attendance-shortage-fine/subjects", { params: { examId: id }, skipErrorToast: true }))
      .then(setSubjects)
      .catch(() => setSubjects([]))
      .finally(() => setLoadingSubjects(false));
  }
  useEffect(() => { if (examId) loadSubjects(examId); }, [examId]);

  function toggle(subjectId) {
    setSelected((p) => (p.includes(subjectId) ? p.filter((x) => x !== subjectId) : [...p, subjectId]));
  }

  const payableSelected = selected
    .map((id) => (subjects || []).find((s) => s.subjectId === id))
    .filter(Boolean);
  const total = payableSelected.reduce((sum, s) => sum + (s.fineAmount || 0), 0);
  const hasPaid = (subjects || []).some((s) => s.paid);

  async function pay() {
    if (!selected.length) {
      toast.warning("Select at least one subject to pay for.");
      return;
    }
    setPaying(true);
    try {
      const res = await unwrap(api.post(
        "/attendance-shortage-fine/pay",
        { examId: Number(examId), subjectIds: selected },
        { skipErrorToast: true }
      ));
      goToGateway(res);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Could not start payment. Please try again.");
    } finally {
      setPaying(false);
    }
  }

  function viewReceipt() {
    unwrap(api.get("/attendance-shortage-fine/receipt", { params: { examId }, skipErrorToast: true }))
      .then(setReceipt)
      .catch(() => toast.error("Could not load the receipt."));
  }

  if (loading) {
    return <div className="flex h-64 items-center justify-center text-muted-foreground"><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading…</div>;
  }
  if (error) {
    return <Card><CardContent className="flex flex-col items-center gap-3 py-14 text-center">
      <AlertTriangle className="h-8 w-8 text-destructive" /><p className="font-medium">{error}</p>
      <Button variant="outline" onClick={loadExams}><RefreshCw className="h-4 w-4" /> Retry</Button>
    </CardContent></Card>;
  }

  if (receipt) {
    return (
      <div className="space-y-6">
        <button onClick={() => setReceipt(null)} className="text-sm font-semibold text-muted-foreground hover:text-foreground print:hidden">← Back</button>
        <Card className="print:hidden"><CardContent className="space-y-4 p-6 text-center">
          <p className="font-display text-lg font-bold">Attendance Shortage Fine — Receipt</p>
          <div className="grid gap-2 text-left text-sm sm:grid-cols-2">
            <p><span className="text-muted-foreground">Name:</span> <b>{receipt.studentName}</b></p>
            <p><span className="text-muted-foreground">Register No:</span> <b>{receipt.registerNo}</b></p>
            <p><span className="text-muted-foreground">Course:</span> <b>{receipt.course || "—"}</b></p>
            <p><span className="text-muted-foreground">Exam:</span> <b>{receipt.examLabel || "—"}</b></p>
          </div>
          <table className="w-full text-left text-sm">
            <thead><tr className="border-b border-border text-xs uppercase text-muted-foreground">
              <th className="py-2">Subject</th><th className="py-2 text-center">Paid On</th><th className="py-2 text-right">Amount</th>
            </tr></thead>
            <tbody>
              {(receipt.items || []).map((it, i) => (
                <tr key={i} className="border-b border-border last:border-0">
                  <td className="py-2">{it.subjectName} <span className="text-xs text-muted-foreground">({it.subjectCode})</span></td>
                  <td className="py-2 text-center">{it.paidDate}</td>
                  <td className="py-2 text-right font-semibold">₹{it.amount}</td>
                </tr>
              ))}
            </tbody>
            <tfoot><tr className="font-bold"><td className="pt-2" colSpan={2}>Total</td><td className="pt-2 text-right">₹{receipt.totalAmount}</td></tr></tfoot>
          </table>
          <Button variant="outline" onClick={printPage}><Download className="h-4 w-4" /> Print Receipt</Button>
        </CardContent></Card>

        <PrintAttnShortageReceipt r={receipt} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageTitle icon={AlertTriangle}>Attendance Shortage Fine</PageTitle>
      <p className="-mt-4 text-sm text-muted-foreground">
        Pay the condonation fine for subjects blocked due to attendance shortage to become exam-eligible.
      </p>

      {exams.length === 0 ? (
        <Card><CardContent className="py-16 text-center text-muted-foreground">
          No attendance shortage fine is currently applicable for you.
        </CardContent></Card>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <label className="text-sm font-semibold text-foreground/80">Exam</label>
            <select value={examId} onChange={(e) => setExamId(e.target.value)}
              className="rounded-xl border border-input bg-card px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring">
              {exams.map((e) => <option key={e.examId} value={e.examId}>{e.label}</option>)}
            </select>
            {hasPaid && (
              <Button variant="outline" size="sm" onClick={viewReceipt}><Download className="h-4 w-4" /> View Receipt</Button>
            )}
          </div>

          {loadingSubjects ? (
            <div className="flex h-32 items-center justify-center text-muted-foreground"><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading…</div>
          ) : (subjects || []).length === 0 ? (
            <Card><CardContent className="py-12 text-center text-sm text-muted-foreground">No shortage subjects for this exam.</CardContent></Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                        <th className="px-5 py-3 font-semibold" />
                        <th className="px-3 py-3 font-semibold">Subject</th>
                        <th className="px-3 py-3 text-center font-semibold">Attendance % (with CL)</th>
                        <th className="px-3 py-3 text-center font-semibold">Fine</th>
                        <th className="px-5 py-3 text-center font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {subjects.map((s) => (
                        <tr key={s.subjectId} className="border-b border-border last:border-0">
                          <td className="px-5 py-3">
                            {!s.paid && s.fineAmount != null && (
                              <input type="checkbox" className="h-4 w-4 accent-primary"
                                checked={selected.includes(s.subjectId)} onChange={() => toggle(s.subjectId)} />
                            )}
                          </td>
                          <td className="px-3 py-3">
                            <p className="font-medium">{s.subjectName}</p>
                            <p className="text-xs text-muted-foreground">{s.subjectCode}</p>
                          </td>
                          <td className="px-3 py-3 text-center tabular-nums">{s.attnPercentWithCl ?? "—"}%</td>
                          <td className="px-3 py-3 text-center font-bold tabular-nums">{s.fineAmount != null ? `₹${s.fineAmount}` : "—"}</td>
                          <td className="px-5 py-3 text-center">
                            {s.paid ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-2.5 py-1 text-xs font-bold text-success">
                                <CheckCircle2 className="h-3.5 w-3.5" /> Paid
                              </span>
                            ) : s.fineAmount == null ? (
                              <span className="text-xs text-muted-foreground">Not payable online</span>
                            ) : (
                              <span className="text-xs font-semibold text-amber-600">Pending</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {selected.length > 0 && (
            <Card><CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
              <p className="text-sm font-semibold">
                Total for {selected.length} subject{selected.length === 1 ? "" : "s"}:{" "}
                <span className="font-display text-lg font-extrabold text-primary">₹{total}</span>
              </p>
              <Button variant="gradient" onClick={pay} disabled={paying}>
                {paying ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
                Pay ₹{total}
              </Button>
            </CardContent></Card>
          )}
        </>
      )}
    </div>
  );
}
