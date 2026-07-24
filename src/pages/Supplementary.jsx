// Developed By: Vishnukarthick K

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import PageTitle from "@/components/PageTitle";
import { Loader2, AlertTriangle, RefreshCw, ClipboardList, CheckCircle2, Receipt, Printer, ArrowLeft, Send, Info } from "@/lib/icons";
import api, { unwrap } from "@/lib/api";
import { toast } from "@/lib/toast";
import { goToGateway, handlePaymentReturn } from "@/lib/payments";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SkeletonTable, SkeletonList } from "@/components/ui/skeleton";
import { printPage } from "@/lib/print";
import logo from "@/assets/images/mcc-title-brown.png";

function rupee(n) {
  if (n === null || n === undefined) return "-";
  return "₹" + Number(n).toLocaleString("en-IN");
}

const NOTE_LINES = [
  "The green check marks under \"ESE Failed\" / \"CIA Failed\" show which parts — Theory (T) or Practical (P) — you failed or haven't cleared yet.",
  "Tick the matching box under \"ESE Apply For\" to apply for a supplementary exam in that part.",
  "If you'd rather apply through Continuous Internal Assessment (CIA) instead of the End Semester Exam, check \"Is CIA\" for that subject — the row switches to the CIA columns and you tick the boxes under \"CIA Apply For\" instead.",
  "A subject can be applied for via ESE or CIA, never both at the same time.",
  "Once a part shows \"Applied\", it has already been submitted and paid for — it will not appear again in a future application.",
];

const boxTable = { width: "100%", borderCollapse: "collapse", border: "1.5px solid #1a1208" };
const boxLabel = { border: "1px solid #c9bda6", padding: "6px 10px", fontWeight: 700, width: "22%", verticalAlign: "top", background: "#f8f3ea" };
const boxValue = { border: "1px solid #c9bda6", padding: "6px 10px", width: "28%" };
const boxValueWide = { border: "1px solid #c9bda6", padding: "6px 10px" };

// The formal printed "Payment Acknowledgement" — hidden on screen, shown only inside .print-area
// during printing (same pattern as PrintCeeReceipt in CeeReceipts.jsx). Kept separate from the
// on-screen preview Card below so the preview itself is never wrapped in print-area — the global
// print stylesheet (index.css) hides anything with that class by default outside of @media print.
function PrintSupplementaryReceipt({ d }) {
  return (
    <div className="print-area" style={{ color: "#1a1208", fontFamily: "'Inter', Arial, sans-serif", fontSize: 12, padding: "0 4px" }}>
      <div style={{ textAlign: "center", borderBottom: "2px solid #800020", paddingBottom: 8, marginBottom: 14 }}>
        <img src={logo} alt="Mount Carmel University" style={{ height: 48, margin: "0 auto 6px", display: "block" }} />
        <div style={{ marginTop: 8, fontSize: 13, fontWeight: 700, letterSpacing: "0.5px" }}>SUPPLEMENTARY EXAM — PAYMENT ACKNOWLEDGEMENT</div>
        <div style={{ fontSize: 11, color: "#6b5840" }}>{d.examName}</div>
      </div>

      {!d.status && !d.refNo && (
        <div style={{ border: "1px solid #e0b04a", background: "#fdf6e3", padding: "6px 10px", marginBottom: 12, fontSize: 10.5 }}>
          Payment confirmation details aren't available for this submission — it was likely recorded before this
          receipt could capture full payment info. The subject(s) below are confirmed as applied.
        </div>
      )}

      <table style={boxTable}>
        <tbody>
          <tr>
            <td style={boxLabel}>Name of the applicant</td>
            <td style={boxValueWide} colSpan={3}>{d.studentName || "—"}</td>
          </tr>
          <tr>
            <td style={boxLabel}>Register Number</td>
            <td style={boxValue}>{d.registerNo || "—"}</td>
            <td style={boxLabel}>Class</td>
            <td style={boxValue}>{d.className || "—"}</td>
          </tr>
          <tr>
            <td style={boxLabel}>Status</td>
            <td style={boxValue}>{d.status || "—"}</td>
            <td style={boxLabel}>Bank Ref</td>
            <td style={boxValue}>{d.bankConfirmationId || "—"}</td>
          </tr>
          <tr>
            <td style={boxLabel}>Paid On</td>
            <td style={boxValueWide} colSpan={3}>{d.transactionDate || "—"}</td>
          </tr>
        </tbody>
      </table>

      <table style={{ ...boxTable, marginTop: 12 }}>
        <thead>
          <tr>
            <td style={{ ...boxLabel, width: "auto" }}>Subject</td>
            <td style={{ ...boxLabel, width: "18%", textAlign: "center" }}>Theory</td>
            <td style={{ ...boxLabel, width: "18%", textAlign: "center" }}>Practical</td>
            <td style={{ ...boxLabel, width: "18%", textAlign: "right" }}>Fees</td>
          </tr>
        </thead>
        <tbody>
          {(d.subjects || []).map((it, i) => (
            <tr key={i}>
              <td style={boxValueWide}>{it.subjectCode} — {it.subjectName}</td>
              <td style={{ ...boxValue, textAlign: "center" }}>{it.appearedTheory ? "ESE" : it.ciaAppearedTheory ? "CIA" : "—"}</td>
              <td style={{ ...boxValue, textAlign: "center" }}>{it.appearedPractical ? "ESE" : it.ciaAppearedPractical ? "CIA" : "—"}</td>
              <td style={{ ...boxValue, textAlign: "right" }}>{it.fees}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 24, fontWeight: 700 }}>
        <div>Total Paid</div>
        <div>{rupee(d.totalAmount)}</div>
      </div>

      <div style={{ marginTop: 16, fontSize: 10, color: "#6b5840" }}>
        This receipt was generated automatically. Please check all the details carefully because accidental errors may occur.
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 28, fontSize: 11, fontWeight: 600 }}>
        <div>Date :</div>
        <div style={{ textAlign: "right" }}>
          <div>Signature of the student</div>
          <div style={{ marginTop: 26 }}>Coordinator</div>
        </div>
      </div>
    </div>
  );
}

// A single ESE/CIA "T"/"P" cell: green check for read-only Failed columns, an interactive
// checkbox or "Applied" text for Apply-For columns, blank when not applicable — mirrors the
// legacy initSupplImpAppStudentResult.jsp grid exactly.
function GridCell({ mode, failed, appeared, checked, onToggle }) {
  if (mode === "failed") {
    return failed ? (
      <CheckCircle2 className="mx-auto h-4 w-4 text-emerald-600" />
    ) : (
      <span className="mx-auto block h-4 w-4 rounded-sm bg-muted" />
    );
  }
  // mode === "apply"
  if (!failed) return <span className="mx-auto block h-4 w-4 rounded-sm bg-muted" />;
  if (appeared) return <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Applied</span>;
  return <input type="checkbox" className="h-4 w-4 accent-amber-600" checked={checked} onChange={onToggle} />;
}

export default function Supplementary() {
  const [screen, setScreen] = useState("apply"); // apply | review | receipts | receipt-detail
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sel, setSel] = useState({}); // subjectId -> {examId, classId, subjectCode, theory, practical, cia}
  const [submitting, setSubmitting] = useState(false);
  const [review, setReview] = useState(null);

  const [receipts, setReceipts] = useState(null);
  const [receiptsLoading, setReceiptsLoading] = useState(false);
  const [receiptDetail, setReceiptDetail] = useState(null);

  function load() {
    setLoading(true);
    setError("");
    unwrap(api.get("/supplementary", { skipErrorToast: true }))
      .then((d) => { setData(d); setSel({}); })
      .catch((e) => setError(e?.response?.data?.message || "Could not load supplementary eligibility."))
      .finally(() => setLoading(false));
  }
  useEffect(load, []);
  useEffect(() => { handlePaymentReturn() === "success" && load(); }, []);

  const theoryFee = data?.theoryFee ?? 0;
  const practicalFee = data?.practicalFee ?? 0;
  const marksCardFee = data?.marksCardFee ?? 0;

  function ensureRow(s) {
    return sel[s.subjectId] || {
      examId: s.examId, classId: s.classId, subjectCode: s.subjectCode,
      theory: false, practical: false, cia: false,
    };
  }

  function toggle(s, kind) {
    setSel((prev) => {
      const cur = ensureRow(s);
      const next = { ...cur, [kind]: !cur[kind] };
      const copy = { ...prev };
      if (!next.theory && !next.practical) delete copy[s.subjectId];
      else copy[s.subjectId] = next;
      return copy;
    });
  }

  // "Is CIA" mutual-exclusion toggle — switches whichever parts are already selected for this
  // subject from the ESE-apply path to the CIA-apply path (mirrors the legacy checkCia() JS,
  // which force-checks the CIA checkbox and force-unchecks the ESE one for the same row).
  function toggleCia(s) {
    setSel((prev) => {
      const cur = prev[s.subjectId];
      if (!cur) return prev;
      return { ...prev, [s.subjectId]: { ...cur, cia: !cur.cia } };
    });
  }

  function buildSelections() {
    return Object.entries(sel).map(([subjectId, v]) => ({
      subjectId: Number(subjectId), examId: v.examId, classId: v.classId, subjectCode: v.subjectCode,
      theory: v.theory, practical: v.practical, cia: v.cia,
    }));
  }

  async function submit() {
    const selections = buildSelections();
    if (selections.length === 0) { toast.warning("Please select at least one subject."); return; }
    setSubmitting(true);
    try {
      const res = await unwrap(api.post("/supplementary/review", { selections }));
      setReview(res);
      setScreen("review");
    } catch {
      // error snackbar shown globally
    } finally {
      setSubmitting(false);
    }
  }

  async function proceed() {
    const selections = buildSelections();
    setSubmitting(true);
    try {
      const res = await unwrap(api.post("/supplementary/apply-and-pay", { selections }));
      if (!goToGateway(res)) load();
    } catch {
      // error snackbar shown globally
    } finally {
      setSubmitting(false);
    }
  }

  function openReceipts() {
    setScreen("receipts");
    setReceiptsLoading(true);
    unwrap(api.get("/supplementary/receipts", { skipErrorToast: true }))
      .then(setReceipts)
      .catch(() => toast.error("Could not load receipts."))
      .finally(() => setReceiptsLoading(false));
  }

  function openReceiptDetail(examId) {
    unwrap(api.get(`/supplementary/receipts/${examId}`, { skipErrorToast: true }))
      .then((d) => { setReceiptDetail(d); setScreen("receipt-detail"); })
      .catch(() => toast.error("Could not load the receipt."));
  }

  const subjects = data?.failedSubjects || [];

  // ── Review / confirm screen (legacy calls this "Smart Card Verification" — it's just a
  //    confirmation step; no real smart-card check happens) ──
  if (screen === "review" && review) {
    return (
      <div className="space-y-6">
        <motion.button onClick={() => setScreen("apply")} whileTap={{ scale: 0.95 }} transition={{ type: "spring", stiffness: 500, damping: 30 }} className="flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back
        </motion.button>
        <Card className="mx-auto max-w-md">
          <CardContent className="space-y-4 p-6 text-center">
            <p className="font-display text-lg font-bold">Confirm Your Application</p>
            <div className="grid gap-2 text-left text-sm">
              <p><span className="text-muted-foreground">Name:</span> <b className="float-right">{review.studentName || "—"}</b></p>
              <p><span className="text-muted-foreground">Register No:</span> <b className="float-right">{review.registerNo || "—"}</b></p>
              <p><span className="text-muted-foreground">Class:</span> <b className="float-right">{review.className || "—"}</b></p>
              <p className="border-t border-border pt-2"><span className="font-semibold">Total Amount:</span> <b className="float-right font-display text-lg">{rupee(review.totalAmount)}</b></p>
            </div>
            <p className="text-xs text-muted-foreground">You will be redirected to an external site for payment. Please click Proceed to confirm.</p>
            <div className="flex justify-center gap-3">
              <Button variant="outline" onClick={() => setScreen("apply")} disabled={submitting}>Cancel</Button>
              <Button onClick={proceed} disabled={submitting} className="bg-joy text-white">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Proceed
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Receipts list ──
  if (screen === "receipts") {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <motion.button onClick={() => setScreen("apply")} whileTap={{ scale: 0.95 }} transition={{ type: "spring", stiffness: 500, damping: 30 }} className="flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Back
          </motion.button>
          <PageTitle icon={Receipt}>Supplementary Receipts</PageTitle>
          <span />
        </div>
        {receiptsLoading ? (
          <SkeletonList rows={4} />
        ) : (receipts || []).length === 0 ? (
          <Card><CardContent className="py-16 text-center text-muted-foreground">No receipts found.</CardContent></Card>
        ) : (
          <div className="space-y-2">
            {receipts.map((r) => (
              <motion.button key={r.examId} onClick={() => openReceiptDetail(r.examId)}
                whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }} transition={{ type: "spring", stiffness: 500, damping: 30 }}
                className="flex w-full items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4 text-left shadow-soft transition-[box-shadow] hover:shadow-pop">
                <div>
                  <p className="font-semibold">{r.examName}</p>
                  <p className="text-xs text-muted-foreground">{r.examCode} · {r.year}</p>
                </div>
                <Printer className="h-4 w-4 text-muted-foreground" />
              </motion.button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── Printable receipt detail ──
  if (screen === "receipt-detail" && receiptDetail) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between print:hidden">
          <motion.button onClick={() => setScreen("receipts")} whileTap={{ scale: 0.95 }} transition={{ type: "spring", stiffness: 500, damping: 30 }} className="flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Back
          </motion.button>
          <Button variant="outline" size="sm" onClick={printPage}><Printer className="h-4 w-4" /> Print</Button>
        </div>
        <Card className="mx-auto max-w-2xl print:hidden">
          <CardContent className="space-y-4 p-6">
            <div className="text-center">
              <p className="font-display text-lg font-bold">Supplementary Exam — Payment Acknowledgement</p>
              <p className="text-sm text-muted-foreground">{receiptDetail.examName}</p>
            </div>
            {!receiptDetail.status && !receiptDetail.refNo && (
              <p className="flex items-start gap-2 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">
                <Info className="mt-0.5 h-4 w-4 shrink-0" />
                Payment confirmation details (ref no., bank reference, amount, date) aren't available for this
                submission — it was likely recorded before this receipt could capture full payment info. The
                subject(s) below are confirmed as applied.
              </p>
            )}
            <div className="grid gap-2 text-sm sm:grid-cols-2">
              <p><span className="text-muted-foreground">Name:</span> <b>{receiptDetail.studentName}</b></p>
              <p><span className="text-muted-foreground">Register No:</span> <b>{receiptDetail.registerNo}</b></p>
              <p><span className="text-muted-foreground">Class:</span> <b>{receiptDetail.className}</b></p>
              <p><span className="text-muted-foreground">Status:</span> <b>{receiptDetail.status || "—"}</b></p>
              <p><span className="text-muted-foreground">Bank Ref:</span> <b>{receiptDetail.bankConfirmationId || "—"}</b></p>
              <p><span className="text-muted-foreground">Paid On:</span> <b>{receiptDetail.transactionDate || "—"}</b></p>
            </div>
            <table className="w-full text-sm">
              <thead><tr className="border-y border-border text-xs uppercase text-muted-foreground">
                <th className="py-2 text-left">Subject</th><th className="py-2 text-center">Theory</th><th className="py-2 text-center">Practical</th><th className="py-2 text-right">Fees</th>
              </tr></thead>
              <tbody>
                {(receiptDetail.subjects || []).map((it, i) => (
                  <tr key={i} className="border-b border-border last:border-0">
                    <td className="py-2">{it.subjectCode} — {it.subjectName}</td>
                    <td className="py-2 text-center">{it.appearedTheory ? "ESE" : it.ciaAppearedTheory ? "CIA" : "—"}</td>
                    <td className="py-2 text-center">{it.appearedPractical ? "ESE" : it.ciaAppearedPractical ? "CIA" : "—"}</td>
                    <td className="py-2 text-right">{it.fees}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="border-t border-border pt-3 text-right">
              <span className="font-semibold">Total Paid: </span><span className="font-display text-lg font-bold">{rupee(receiptDetail.totalAmount)}</span>
            </div>
          </CardContent>
        </Card>

        {/* formal document — invisible on screen, only rendered when printing */}
        <PrintSupplementaryReceipt d={receiptDetail} />
      </div>
    );
  }

  // ── Main "Apply" screen ──
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <PageTitle icon={ClipboardList}>Apply for Supplementary Exams</PageTitle>
          <p className="text-sm text-muted-foreground">Failed subjects are displayed below. Tick the subject you wish to apply for.</p>
        </div>
        <Button variant="outline" size="sm" onClick={load}><RefreshCw className="h-4 w-4" /> Refresh</Button>
      </div>

      {(theoryFee > 0 || practicalFee > 0 || marksCardFee > 0) && (
        <div className="rounded-2xl border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
          <p>Theory Fees - {theoryFee}/-</p>
          <p>Practical Fees - {practicalFee}/-</p>
          <p>MarksCard per semester - {marksCardFee}/-</p>
        </div>
      )}

      <AnimatePresence mode="wait">
      {loading ? (
        <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
        <SkeletonTable rows={5} cols={11} />
        </motion.div>
      ) : error ? (
        <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
        <Card><CardContent className="flex flex-col items-center gap-3 py-14 text-center">
          <AlertTriangle className="h-8 w-8 text-destructive" /><p className="font-medium">{error}</p>
          <Button variant="outline" onClick={load}><RefreshCw className="h-4 w-4" /> Retry</Button>
        </CardContent></Card>
        </motion.div>
      ) : subjects.length === 0 ? (
        <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
        <Card><CardContent className="flex flex-col items-center gap-3 py-16 text-center">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20">
            <CheckCircle2 className="h-7 w-7" />
          </span>
          <p className="font-display text-lg font-semibold">Nothing to apply for 🎉</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Either you have no failed subjects, or there's no supplementary application window open right now.
          </p>
          <Button variant="outline" size="sm" onClick={openReceipts}><Receipt className="h-4 w-4" /> View Receipts</Button>
        </CardContent></Card>
        </motion.div>
      ) : (
        <motion.div key="content" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
          <div className="rounded-2xl border-2 border-amber-300 bg-amber-50/50 p-4 dark:border-amber-500/30 dark:bg-amber-500/5">
            <p className="font-display text-base font-bold text-amber-800 dark:text-amber-300">
              {data.className}&nbsp;&nbsp;{data.examName}
            </p>
            <p className="mt-1 text-sm">
              {data.extended ? (
                <span className="font-semibold text-destructive">The application is extended with fine till: {data.extendedDate}</span>
              ) : (
                <>
                  <span className="font-semibold text-destructive">Last Date without fine :</span> {data.lastDateWithoutFine}
                  &nbsp;&nbsp;<span className="font-semibold text-destructive">With fine :</span> {data.lastDateWithFine}
                </>
              )}
            </p>
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

          <Card>
            <CardContent className="overflow-x-auto p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
                    <th rowSpan={2} className="px-3 py-2 text-left font-semibold align-bottom">Sl</th>
                    <th rowSpan={2} className="px-3 py-2 text-left font-semibold align-bottom">Subject</th>
                    <th colSpan={2} className="px-3 py-2 text-center font-semibold">ESE Failed</th>
                    <th colSpan={2} className="px-3 py-2 text-center font-semibold">ESE Apply For</th>
                    <th colSpan={2} className="px-3 py-2 text-center font-semibold">CIA Failed</th>
                    <th colSpan={2} className="px-3 py-2 text-center font-semibold">CIA Apply For</th>
                    <th rowSpan={2} className="px-3 py-2 text-center font-semibold align-bottom">Is CIA</th>
                  </tr>
                  <tr className="border-b border-border bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="px-2 py-1 text-center font-semibold">T</th>
                    <th className="px-2 py-1 text-center font-semibold">P</th>
                    <th className="px-2 py-1 text-center font-semibold">T</th>
                    <th className="px-2 py-1 text-center font-semibold">P</th>
                    <th className="px-2 py-1 text-center font-semibold">T</th>
                    <th className="px-2 py-1 text-center font-semibold">P</th>
                    <th className="px-2 py-1 text-center font-semibold">T</th>
                    <th className="px-2 py-1 text-center font-semibold">P</th>
                  </tr>
                </thead>
                <tbody>
                  {subjects.map((s, i) => {
                    const cur = ensureRow(s);
                    const ciaMode = cur.cia;
                    return (
                      <tr key={s.subjectId} className="border-b border-border last:border-0 hover:bg-muted/40">
                        <td className="px-3 py-2">{i + 1}</td>
                        <td className="px-3 py-2">
                          <p className="font-medium">{s.subjectName}</p>
                          <p className="text-xs text-muted-foreground">{s.subjectCode}</p>
                        </td>
                        <td className="px-2 py-2 text-center"><GridCell mode="failed" failed={s.failedTheory} /></td>
                        <td className="px-2 py-2 text-center"><GridCell mode="failed" failed={s.failedPractical} /></td>
                        <td className="px-2 py-2 text-center">
                          {ciaMode ? (
                            <span className="mx-auto block h-4 w-4 rounded-sm bg-muted" />
                          ) : (
                            <GridCell mode="apply" failed={s.failedTheory} appeared={s.appearedTheory}
                              checked={!!cur.theory} onToggle={() => toggle(s, "theory")} />
                          )}
                        </td>
                        <td className="px-2 py-2 text-center">
                          {ciaMode ? (
                            <span className="mx-auto block h-4 w-4 rounded-sm bg-muted" />
                          ) : (
                            <GridCell mode="apply" failed={s.failedPractical} appeared={s.appearedPractical}
                              checked={!!cur.practical} onToggle={() => toggle(s, "practical")} />
                          )}
                        </td>
                        <td className="px-2 py-2 text-center"><GridCell mode="failed" failed={s.ciaFailedTheory} /></td>
                        <td className="px-2 py-2 text-center"><GridCell mode="failed" failed={s.ciaFailedPractical} /></td>
                        <td className="px-2 py-2 text-center">
                          {ciaMode ? (
                            <GridCell mode="apply" failed={s.failedTheory || s.ciaFailedTheory} appeared={s.ciaAppearedTheory}
                              checked={!!cur.theory} onToggle={() => toggle(s, "theory")} />
                          ) : (
                            <span className="mx-auto block h-4 w-4 rounded-sm bg-muted" />
                          )}
                        </td>
                        <td className="px-2 py-2 text-center">
                          {ciaMode ? (
                            <GridCell mode="apply" failed={s.failedPractical || s.ciaFailedPractical} appeared={s.ciaAppearedPractical}
                              checked={!!cur.practical} onToggle={() => toggle(s, "practical")} />
                          ) : (
                            <span className="mx-auto block h-4 w-4 rounded-sm bg-muted" />
                          )}
                        </td>
                        <td className="px-2 py-2 text-center">
                          {s.ciaExam ? (
                            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Yes</span>
                          ) : (
                            <input type="checkbox" className="h-4 w-4 accent-amber-600"
                              checked={!!cur.cia} onChange={() => toggleCia(s)} disabled={!sel[s.subjectId]} />
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </CardContent>
          </Card>

          <div className="sticky bottom-4 flex flex-wrap items-center justify-end gap-3 rounded-2xl border border-border bg-card p-4 shadow-lg">
            <Button variant="outline" onClick={openReceipts}><Receipt className="h-4 w-4" /> Receipts</Button>
            <Button onClick={submit} disabled={submitting} className="bg-joy text-white">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Submit
            </Button>
          </div>
        </motion.div>
      )}
      </AnimatePresence>
    </div>
  );
}
