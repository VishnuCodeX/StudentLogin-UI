// Developed By: Vishnukarthick K

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import PageTitle from "@/components/PageTitle";
import {
  AlertTriangle, Loader2, RefreshCw, Printer, ArrowLeft,
  CheckCircle2, Clock, Receipt, CreditCard, ExternalLink, X,
} from "@/lib/icons";
import api, { unwrap } from "@/lib/api";
import { toast } from "@/lib/toast";
import { Card, CardContent } from "@/components/ui/card";
import { SkeletonCard, SkeletonList, SkeletonTable } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import logo from "@/assets/images/mcc-title-brown.png";
import { printPage } from "@/lib/print";

function rupee(n) {
  if (n === null || n === undefined) return "-";
  return "₹" + Number(n).toLocaleString("en-IN");
}

const CIPHER_POOL = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
function randomCipher(length) {
  let out = "";
  for (let i = 0; i < length; i++) out += CIPHER_POOL[Math.floor(Math.random() * CIPHER_POOL.length)];
  return out;
}

// Animates a credential's first appearance: scrambles random characters for a beat, then
// resolves them into the real value left-to-right, one character at a time, and stops.
function CipherReveal({ value }) {
  const [display, setDisplay] = useState(() => (value ? randomCipher(value.length) : ""));

  useEffect(() => {
    if (!value) return;
    const length = value.length;
    setDisplay(randomCipher(length));
    const scrambleTimer = setInterval(() => setDisplay(randomCipher(length)), 45);

    let resolveTimer;
    const scrambleTimeout = setTimeout(() => {
      clearInterval(scrambleTimer);
      let revealedCount = 0;
      resolveTimer = setInterval(() => {
        revealedCount += 1;
        setDisplay(revealedCount >= length ? value : value.slice(0, revealedCount) + randomCipher(length - revealedCount));
        if (revealedCount >= length) clearInterval(resolveTimer);
      }, 40);
    }, 620);

    return () => {
      clearInterval(scrambleTimer);
      clearTimeout(scrambleTimeout);
      if (resolveTimer) clearInterval(resolveTimer);
    };
  }, [value]);

  return <>{display || "—"}</>;
}

/* "Fee Payment Details" dialog — shows the external Fee Payment Portal credentials
   (mirrors the legacy popup: userName = application no, password = DOB ddMMyyyy). */
function PayDialog({ creds, onClose }) {
  const body = (
    <div className="fixed inset-0 z-[95] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={onClose} />
      <div role="dialog" aria-modal="true" aria-labelledby="pay-dialog-title" className="relative w-full max-w-md overflow-hidden rounded-3xl border border-border bg-card shadow-pop">
        <div className="flex items-center justify-between gap-3 bg-joy px-5 py-4 text-white">
          <h3 id="pay-dialog-title" className="font-display text-lg font-bold">Fee Payment Details</h3>
          <motion.button onClick={onClose} aria-label="Close" whileTap={{ scale: 0.9 }} transition={{ type: "spring", stiffness: 500, damping: 30 }} className="grid h-8 w-8 place-items-center rounded-lg text-white/85 hover:bg-white/15"><X className="h-4 w-4" /></motion.button>
        </div>
        <div className="p-6">
          <table className="w-full overflow-hidden rounded-xl border border-border text-sm">
            <tbody>
              <tr className="border-b border-border">
                <td className="w-2/5 border-r border-border bg-muted/50 px-4 py-3 text-center font-bold text-primary">User Name</td>
                <td className="px-4 py-3 text-center font-bold text-success"><CipherReveal value={creds?.userName} /></td>
              </tr>
              <tr>
                <td className="border-r border-border bg-muted/50 px-4 py-3 text-center font-bold text-primary">Password</td>
                <td className="px-4 py-3 text-center font-bold text-success"><CipherReveal value={creds?.password} /></td>
              </tr>
            </tbody>
          </table>

          <div className="mt-5 text-center">
            <a href={creds?.paymentUrl} target="_blank" rel="noreferrer"
              className="inline-flex items-center gap-1.5 font-semibold text-primary underline underline-offset-2 hover:opacity-80">
              <ExternalLink className="h-4 w-4" /> Fee payment link (click here)
            </a>
          </div>
          <p className="mt-3 text-center text-xs font-bold italic text-destructive">
            You will be redirected to Fee Payment Portal. Use the above credentials to login.
          </p>

          <div className="mt-5 flex justify-center">
            <Button variant="outline" onClick={onClose} className="min-w-28">Close</Button>
          </div>
        </div>
      </div>
    </div>
  );
  return createPortal(body, document.getElementById("modal-root") || document.body);
}

// Print document styles (formal fee receipt)
const tableStyle = { width: "100%", borderCollapse: "collapse" };
const labelCell = { border: "1px solid #c9bda6", padding: "3px 8px", fontWeight: 700, background: "#f3ece0", whiteSpace: "nowrap", width: "14%" };
const valueCell = { border: "1px solid #c9bda6", padding: "3px 8px", width: "36%" };
const pth = (align = "center") => ({ border: "1px solid #6e5638", padding: "4px 8px", background: "#5c4632", color: "#fdf8ee", textAlign: align, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.4px" });
const ptd = (align = "center") => ({ border: "1px solid #c9bda6", padding: "2.5px 8px", textAlign: align });

function StatusBadge({ status }) {
  const map = {
    PAID: "bg-success/15 text-success",
    PARTIAL: "bg-primary/15 text-primary",
    PENDING: "bg-destructive/15 text-destructive",
  };
  const Icon = status === "PAID" ? CheckCircle2 : Clock;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${map[status] || "bg-muted"}`}>
      <Icon className="h-3 w-3" /> {status}
    </span>
  );
}

// "Current Year" screen — skips the bill list entirely and goes straight to the external Fee
// Payment Portal credentials (same content as PayDialog above, just shown inline instead of as
// a modal triggered from a list). Matches the legacy flow, which never showed a bill breakdown
// here — it took the student straight to "here's your login for the payment portal."
function CurrentYearPay() {
  const [creds, setCreds] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    unwrap(api.get("/fees/payment-credentials", { skipErrorToast: true }))
      .then(setCreds)
      .catch((e) => setError(e?.response?.data?.message || "Could not load payment details."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <PageTitle icon={CreditCard}>Fee Payment</PageTitle>
        <SkeletonCard className="mx-auto max-w-md" lines={4} />
      </div>
    );
  }
  if (error) {
    return <Card><CardContent className="flex flex-col items-center gap-3 py-14 text-center">
      <AlertTriangle className="h-8 w-8 text-destructive" /><p className="font-medium">{error}</p>
    </CardContent></Card>;
  }

  return (
    <div className="space-y-6">
      <PageTitle icon={CreditCard}>Fee Payment</PageTitle>
      <Card className="mx-auto max-w-md overflow-hidden">
        <div className="bg-joy px-5 py-4 text-white">
          <h3 className="font-display text-lg font-bold">Fee Payment Details</h3>
        </div>
        <CardContent className="p-6">
          <table className="w-full overflow-hidden rounded-xl border border-border text-sm">
            <tbody>
              <tr className="border-b border-border">
                <td className="w-2/5 border-r border-border bg-muted/50 px-4 py-3 text-center font-bold text-primary">User Name</td>
                <td className="px-4 py-3 text-center font-bold text-success"><CipherReveal value={creds?.userName} /></td>
              </tr>
              <tr>
                <td className="border-r border-border bg-muted/50 px-4 py-3 text-center font-bold text-primary">Password</td>
                <td className="px-4 py-3 text-center font-bold text-success"><CipherReveal value={creds?.password} /></td>
              </tr>
            </tbody>
          </table>

          <div className="mt-5 text-center">
            <a href={creds?.paymentUrl} target="_blank" rel="noreferrer"
              className="inline-flex items-center gap-1.5 font-semibold text-primary underline underline-offset-2 hover:opacity-80">
              <ExternalLink className="h-4 w-4" /> Fee payment link (click here)
            </a>
          </div>
          <p className="mt-3 text-center text-xs font-bold italic text-destructive">
            You will be redirected to Fee Payment Portal. Use the above credentials to login.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

// Dispatcher only — deliberately calls no hooks itself, so branching here never risks an
// inconsistent hook count between renders (each branch is its own self-contained component).
export default function Fees({ mode }) {
  if (mode === "current") return <CurrentYearPay />;
  return <FeeChallanList />;
}

function FeeChallanList() {
  const [list, setList] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [creds, setCreds] = useState(null);
  const [payLoading, setPayLoading] = useState(false);
  const [tab, setTab] = useState("challans");

  async function openPay() {
    setPayLoading(true);
    try {
      setCreds(await unwrap(api.get("/fees/payment-credentials", { skipErrorToast: true })));
    } catch (e) {
      toast.error(e?.response?.data?.message || "Could not load payment details.");
    } finally {
      setPayLoading(false);
    }
  }

  function loadList() {
    setLoading(true);
    setError("");
    unwrap(api.get("/fees"))
      .then(setList)
      .catch((e) => setError(e?.response?.data?.message || "Could not load fee challans."))
      .finally(() => setLoading(false));
  }
  useEffect(loadList, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <PageTitle icon={Receipt}>Fee Challan</PageTitle>
            <p className="text-sm text-muted-foreground">View, print and pay your fee challans.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="gradient" size="sm" onClick={openPay} disabled={payLoading}>
              {payLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />} Pay Online
            </Button>
            <Button variant="outline" size="sm" onClick={loadList}><RefreshCw className="h-4 w-4" /> Refresh</Button>
          </div>
        </div>
        <SkeletonList rows={4} />
      </div>
    );
  }
  if (error) {
    return <Card><CardContent className="flex flex-col items-center gap-3 py-14 text-center">
      <AlertTriangle className="h-8 w-8 text-destructive" /><p className="font-medium">{error}</p>
      <Button variant="outline" onClick={loadList}><RefreshCw className="h-4 w-4" /> Retry</Button>
    </CardContent></Card>;
  }
  if (selectedId) return <ChallanDetail id={selectedId} onBack={() => setSelectedId(null)} />;

  const challans = list || [];
  const totalBalance = challans.reduce((a, c) => a + (c.balance || 0), 0);
  const receipts = challans
    .filter((c) => (c.totalFeePaid || 0) > 0)
    .slice()
    .sort((a, b) => (a.feePaidDate || "").localeCompare(b.feePaidDate || ""));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <PageTitle icon={Receipt}>Fee Challan</PageTitle>
          <p className="text-sm text-muted-foreground">View, print and pay your fee challans.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="gradient" size="sm" onClick={openPay} disabled={payLoading}>
            {payLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />} Pay Online
          </Button>
          <Button variant="outline" size="sm" onClick={loadList}><RefreshCw className="h-4 w-4" /> Refresh</Button>
        </div>
      </div>

      <div className="flex gap-2">
        {[["challans", "Challans", Receipt], ["receipts", "Receipts", CheckCircle2]].map(([id, label, Icon]) => (
          <motion.button key={id} onClick={() => setTab(id)}
            whileTap={{ scale: 0.96 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
              tab === id ? "bg-joy text-white" : "bg-muted text-muted-foreground hover:bg-muted/70"}`}>
            <Icon className="h-4 w-4" /> {label}
          </motion.button>
        ))}
      </div>

      {tab === "challans" ? (
        <>
          {totalBalance > 0 && (
            <div className="bg-joy flex items-center gap-3 rounded-3xl px-5 py-4 text-white shadow-soft">
              <span className="grid h-10 w-10 place-items-center rounded-2xl bg-white/20"><Clock className="h-5 w-5" /></span>
              <div><p className="font-bold">{rupee(totalBalance)} balance due</p><p className="text-sm text-white/85">across your challans</p></div>
            </div>
          )}

          {challans.length === 0 ? (
            <Card><CardContent className="flex flex-col items-center gap-3 py-16 text-center">
              <span className="grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary"><Receipt className="h-7 w-7" /></span>
              <p className="text-muted-foreground">No fee challans found.</p>
            </CardContent></Card>
          ) : (
            <div className="space-y-2">
              {challans.map((c) => (
                <motion.button key={c.id} onClick={() => setSelectedId(c.id)}
                  whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }} transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  className="flex w-full items-center gap-4 rounded-3xl border border-border bg-card p-4 text-left shadow-soft transition-[color,background-color,border-color,box-shadow,filter] hover:shadow-pop">
                  <span className="bg-joy grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-white"><Receipt className="h-6 w-6" /></span>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold">Bill #{c.billNo}</p>
                    <p className="text-xs text-muted-foreground">Academic Year {c.academicYear} · Paid {rupee(c.totalFeePaid)} of {rupee(c.totalAmount)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-display text-lg font-bold">{rupee(c.balance > 0 ? c.balance : c.totalAmount)}</p>
                    <StatusBadge status={c.status} />
                  </div>
                </motion.button>
              ))}
            </div>
          )}
        </>
      ) : (
        <Card>
          {receipts.length === 0 ? (
            <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
              <span className="grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary"><CheckCircle2 className="h-7 w-7" /></span>
              <p className="text-muted-foreground">No receipts yet.</p>
            </CardContent>
          ) : (
            <CardContent className="overflow-x-auto p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="px-5 py-3 text-left font-semibold">Challan No</th>
                    <th className="px-5 py-3 text-left font-semibold">Paid Date</th>
                    <th className="px-5 py-3 text-right font-semibold">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {receipts.map((c) => (
                    <tr key={c.id} className="border-b border-border last:border-0">
                      <td className="px-5 py-3 font-medium">{c.challanNo || c.billNo}</td>
                      <td className="px-5 py-3 text-muted-foreground">{c.feePaidDate ? new Date(c.feePaidDate).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) : "-"}</td>
                      <td className="px-5 py-3 text-right tabular-nums text-success">{rupee(c.totalFeePaid)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          )}
        </Card>
      )}

      {creds && <PayDialog creds={creds} onClose={() => setCreds(null)} />}
    </div>
  );
}

// One-time shine + scale pulse for the final total-payable figure, played once the moment the
// challan data finishes loading (this component only ever mounts after that point).
function TotalSweep({ children }) {
  const [phase, setPhase] = useState("idle");

  useEffect(() => {
    setPhase("active");
  }, []);

  return (
    <motion.span
      className="relative inline-block overflow-hidden rounded-md px-1"
      animate={phase === "active" ? { scale: [1, 1.03, 1] } : { scale: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      {children}
      {phase === "active" && (
        <motion.span
          className="pointer-events-none absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-transparent via-white/70 to-transparent"
          initial={{ x: "-120%", skewX: -20 }}
          animate={{ x: "220%", skewX: -20 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          onAnimationComplete={() => setPhase("done")}
        />
      )}
    </motion.span>
  );
}

function ChallanDetail({ id, onBack }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    unwrap(api.get(`/fees/${id}`))
      .then(setData)
      .catch((e) => setError(e?.response?.data?.message || "Could not load challan."))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between print:hidden">
          <Button variant="ghost" size="sm" onClick={onBack}><ArrowLeft className="h-4 w-4" /> Back to challans</Button>
        </div>
        <SkeletonTable rows={4} cols={2} />
      </div>
    );
  }
  if (error || !data) return <Card><CardContent className="flex flex-col items-center gap-3 py-14 text-center">
    <AlertTriangle className="h-8 w-8 text-destructive" /><p className="font-medium">{error}</p>
    <Button variant="outline" onClick={onBack}><ArrowLeft className="h-4 w-4" /> Back</Button></CardContent></Card>;

  const c = data.challan;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between print:hidden">
        <Button variant="ghost" size="sm" onClick={onBack}><ArrowLeft className="h-4 w-4" /> Back to challans</Button>
        <Button variant="outline" size="sm" onClick={printPage}><Printer className="h-4 w-4" /> Print</Button>
      </div>

      <Card className="mx-auto max-w-2xl print:hidden">
        <CardContent className="p-6 sm:p-8">
          <div className="mb-6 border-b border-border pb-4 text-center">
            <h2 className="font-display text-xl font-bold">Mount Carmel (Deemed to be University), Bengaluru</h2>
            <p className="text-sm text-muted-foreground">Fee Challan / Pay-in Slip</p>
            <div className="mt-2 flex items-center justify-center gap-2">
              <StatusBadge status={c.status} />
              <span className="text-xs text-muted-foreground">Bill No: {c.billNo}</span>
            </div>
          </div>

          <div className="mb-6 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
            <Meta label="Student" value={data.studentName} />
            <Meta label="Register No" value={data.registerNo} />
            <Meta label="Class" value={data.className} />
            <Meta label="Academic Year" value={c.academicYear} />
          </div>

          <table className="mb-4 w-full text-sm">
            <thead><tr className="border-y border-border text-xs uppercase tracking-wide text-muted-foreground">
              <th className="py-2 text-left font-semibold">Particulars</th>
              <th className="py-2 text-right font-semibold">Amount</th>
            </tr></thead>
            <tbody>
              {(data.particulars || []).map((p, i) => (
                <tr key={i} className="border-b border-border last:border-0">
                  <td className="py-2.5">{p.head}</td>
                  <td className="py-2.5 text-right tabular-nums">{rupee(p.amount)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              {c.concession > 0 && (
                <>
                  <tr className="border-t border-border"><td className="py-2 text-right text-muted-foreground">Total Fee</td><td className="py-2 text-right tabular-nums text-muted-foreground">{rupee(data.grossAmount)}</td></tr>
                  <tr><td className="py-1 text-right text-muted-foreground">Concession/Scholarship</td><td className="py-1 text-right tabular-nums text-destructive">-{rupee(c.concession)}</td></tr>
                </>
              )}
              <tr className={c.concession > 0 ? "" : "border-t border-border"}><td className="py-2 text-right font-medium">{c.concession > 0 ? "Net Payable" : "Total"}</td><td className="py-2 text-right tabular-nums">{rupee(c.totalAmount)}</td></tr>
              <tr><td className="py-1 text-right font-medium text-success">Paid</td><td className="py-1 text-right tabular-nums text-success">{rupee(c.totalFeePaid)}</td></tr>
              <tr className="border-t-2 border-foreground/20"><td className="py-2.5 text-right font-bold">Balance Payable</td><td className="py-2.5 text-right font-display text-lg font-bold"><TotalSweep>{rupee(c.balance)}</TotalSweep></td></tr>
            </tfoot>
          </table>

          <div className="rounded-2xl bg-muted/60 px-4 py-3 text-sm">
            <span className="font-semibold">Amount in words: </span>{data.amountInWords}
          </div>
        </CardContent>
      </Card>

      <PrintFeeChallan data={data} />
    </div>
  );
}

/* ── Formal printed fee receipt (hidden on screen, shown only when printing) ── */
function PrintFeeChallan({ data }) {
  const c = data.challan;
  const today = new Date().toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" });
  return (
    <div className="print-area" style={{ color: "#1a1208", fontFamily: "'Inter', Arial, sans-serif", fontSize: 11.5, padding: "0 4px" }}>
      {/* letterhead */}
      <div style={{ textAlign: "center", borderBottom: "2px solid #800020", paddingBottom: 6, marginBottom: 10 }}>
        <img src={logo} alt="Mount Carmel (Deemed to be University)" style={{ height: 44, margin: "0 auto 3px", display: "block" }} />
        <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "3px", textTransform: "uppercase", color: "#800020" }}>Fee Receipt</div>
      </div>

      {/* student details */}
      <table style={{ ...tableStyle, marginBottom: 10 }}>
        <tbody>
          <tr>
            <td style={labelCell}>Student</td><td style={valueCell}>{data.studentName || "—"}</td>
            <td style={labelCell}>Register No</td><td style={valueCell}>{data.registerNo || "—"}</td>
          </tr>
          <tr>
            <td style={labelCell}>Class</td><td style={valueCell}>{data.className || "—"}</td>
            <td style={labelCell}>Academic Year</td><td style={valueCell}>{c.academicYear || "—"}</td>
          </tr>
          <tr>
            <td style={labelCell}>Bill No</td><td style={valueCell}>{c.billNo || "—"}</td>
            <td style={labelCell}>Status</td><td style={valueCell}>{c.status || "—"}</td>
          </tr>
        </tbody>
      </table>

      {/* particulars — NO tfoot (browsers repeat tfoot on every page) */}
      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={pth("left")}>Particulars</th>
            <th style={pth("right")}>Amount</th>
          </tr>
        </thead>
        <tbody>
          {(data.particulars || []).map((p, i) => (
            <tr key={i} style={{ breakInside: "avoid" }}>
              <td style={ptd("left")}>{p.head}</td>
              <td style={ptd("right")}>{rupee(p.amount)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* single compact row: notes/amount-in-words on the left, totals + signature on the right */}
      <div style={{ display: "flex", justifyContent: "space-between", gap: 24, marginTop: 10, alignItems: "flex-start", breakInside: "avoid" }}>
        {/* left — fills the space beside the totals */}
        <div style={{ flex: 1, fontSize: 10.5 }}>
          <div style={{ padding: "6px 10px", background: "#f8f3ea", border: "1px solid #c9bda6", borderRadius: 4, marginBottom: 10 }}>
            <b>Amount in words: </b>{data.amountInWords}
          </div>
          <div style={{ color: "#6b5840", lineHeight: 1.6 }}>
            <div>Generated on {today}.</div>
            <div>This receipt was generated automatically. Please check all the details carefully because accidental errors may occur.</div>
            <div style={{ marginTop: 8, fontStyle: "italic" }}>
              Please retain this receipt for your records. For any discrepancy in the fee details,
              kindly contact the College Accounts Office within 7 days.
            </div>
          </div>
        </div>

        {/* right — totals (once) + signature */}
        <div style={{ width: "42%", minWidth: 220 }}>
          {c.concession > 0 && (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "5px 10px", borderBottom: "1px solid #c9bda6", color: "#6b5840" }}>
                <span>Total Fee</span><b>{rupee(data.grossAmount)}</b>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "5px 10px", borderBottom: "1px solid #c9bda6", color: "#800020" }}>
                <span>Concession/Scholarship</span><b>-{rupee(c.concession)}</b>
              </div>
            </>
          )}
          <div style={{ display: "flex", justifyContent: "space-between", padding: "5px 10px", borderBottom: "1px solid #c9bda6" }}>
            <span>{c.concession > 0 ? "Net Payable" : "Total"}</span><b>{rupee(c.totalAmount)}</b>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "5px 10px", borderBottom: "1px solid #c9bda6" }}>
            <span>Paid</span><b>{rupee(c.totalFeePaid)}</b>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "7px 10px", marginTop: 4, background: "#f3ece0", border: "1.5px solid #800020", fontWeight: 700 }}>
            <span>Balance Payable</span><span style={{ color: "#800020" }}>{rupee(c.balance)}</span>
          </div>
          <div style={{ marginTop: 26, textAlign: "center" }}>
            <div style={{ borderTop: "1px solid #1a1208", paddingTop: 4, fontWeight: 600, fontSize: 11 }}>Authorised Signatory</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Meta({ label, value }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="font-medium">{value || "-"}</p>
    </div>
  );
}
