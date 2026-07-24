// Developed By: Vishnukarthick K

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import PageTitle from "@/components/PageTitle";
import { AlertTriangle, RefreshCw, Receipt, Download } from "@/lib/icons";
import api, { unwrap } from "@/lib/api";
import { toast } from "@/lib/toast";
import { printPage } from "@/lib/print";
import logo from "@/assets/images/mcc-title-brown.png";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SkeletonList } from "@/components/ui/skeleton";

const boxTable = { width: "100%", borderCollapse: "collapse", border: "1.5px solid #1a1208" };
const boxLabel = { border: "1px solid #c9bda6", padding: "6px 10px", fontWeight: 700, width: "22%", verticalAlign: "top", background: "#f8f3ea" };
const boxValue = { border: "1px solid #c9bda6", padding: "6px 10px", width: "28%" };
const boxValueWide = { border: "1px solid #c9bda6", padding: "6px 10px" };

// The formal printed "Payment Acknowledgement" — hidden on screen (like every other formal
// document in this app, e.g. PrintFeeChallan in Fees.jsx), shown only inside .print-area during
// printing. The global print stylesheet (index.css) hides everything else, so a receipt that
// isn't wrapped in .print-area prints a blank page — that was the bug here.
function PrintCeeReceipt({ d }) {
  return (
    <div className="print-area" style={{ color: "#1a1208", fontFamily: "'Inter', Arial, sans-serif", fontSize: 12, padding: "0 4px" }}>
      <div style={{ textAlign: "center", borderBottom: "2px solid #800020", paddingBottom: 8, marginBottom: 14 }}>
        <img src={logo} alt="Mount Carmel University" style={{ height: 48, margin: "0 auto 6px", display: "block" }} />
        {/* <div style={{ fontSize: 11, color: "#6b5840" }}>Affiliated to Bangalore University</div> */}
        <div style={{ marginTop: 8, fontSize: 13, fontWeight: 700, letterSpacing: "0.5px" }}>PAYMENT ACKNOWLEDGEMENT FOR CEE COURSE</div>
      </div>

      <table style={boxTable}>
        <tbody>
          <tr>
            <td style={boxLabel}>Name of the applicant</td>
            <td style={boxValueWide} colSpan={3}>{d.studentName || "—"}</td>
          </tr>
          <tr>
            <td style={boxLabel}>Register Number</td>
            <td style={boxValue}>{d.registerNo || "—"}</td>
            <td style={boxLabel}>Combination</td>
            <td style={boxValue}>{d.course || "—"}</td>
          </tr>
          <tr>
            <td style={boxLabel}>Date of Birth</td>
            <td style={boxValue}>{d.dateOfBirth || "—"}</td>
            <td style={boxLabel}>Class</td>
            <td style={boxValue}>{d.className || "—"}</td>
          </tr>
        </tbody>
      </table>

      <table style={{ ...boxTable, marginTop: 12 }}>
        <tbody>
          <tr>
            <td style={boxLabel}>Telephone</td>
            <td style={boxValue}>—</td>
            <td style={boxLabel}>Mobile</td>
            <td style={boxValue}>{d.mobile || "—"}</td>
          </tr>
          <tr>
            <td style={boxLabel}>Email</td>
            <td style={boxValueWide} colSpan={3}>{d.email || "—"}</td>
          </tr>
        </tbody>
      </table>

      <table style={{ ...boxTable, marginTop: 12 }}>
        <tbody>
          <tr><td style={boxLabel}>Name of the Course</td><td style={boxValueWide} colSpan={3}>{d.courseName || "—"}</td></tr>
          <tr><td style={boxLabel}>Description</td><td style={boxValueWide} colSpan={3}>{d.description || "—"}</td></tr>
          <tr><td style={boxLabel}>Course Hours</td><td style={boxValueWide} colSpan={3}>{d.hours || "—"}</td></tr>
          <tr><td style={boxLabel}>Course Fee</td><td style={boxValueWide} colSpan={3}>{d.amount != null ? Number(d.amount).toFixed(2) : "—"}</td></tr>
          <tr><td style={boxLabel}>Fee Payment Date</td><td style={boxValueWide} colSpan={3}>{d.paidDate || "—"}</td></tr>
          <tr><td style={boxLabel}>Payment Mode</td><td style={boxValueWide} colSpan={3}>Online</td></tr>
          <tr><td style={boxLabel}>Venue</td><td style={boxValueWide} colSpan={3}>{d.venue || "—"}</td></tr>
        </tbody>
      </table>

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

// A dedicated top-level "CEE Receipts" screen (list already existed as a tab inside the CEE
// Application page — this mirrors the legacy Struts app's own separate menu entry for it) plus
// the per-receipt printable "Payment Acknowledgement" detail view that was previously missing.
export default function CeeReceipts() {
  const [receipts, setReceipts] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [detail, setDetail] = useState(null);

  function load() {
    setLoading(true);
    setError("");
    unwrap(api.get("/cee/receipts", { skipErrorToast: true }))
      .then(setReceipts)
      .catch((e) => setError(e?.response?.data?.message || "Could not load receipts."))
      .finally(() => setLoading(false));
  }
  useEffect(load, []);

  function openDetail(id) {
    unwrap(api.get(`/cee/receipts/${id}`, { skipErrorToast: true }))
      .then(setDetail)
      .catch(() => toast.error("Could not load the receipt."));
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <PageTitle icon={Receipt}>CEE Receipts</PageTitle>
            <p className="text-sm text-muted-foreground">Your paid CEE / SEC course receipts.</p>
          </div>
          <Button variant="outline" size="sm" onClick={load}><RefreshCw className="h-4 w-4" /> Refresh</Button>
        </div>
        <SkeletonList rows={4} />
      </div>
    );
  }
  if (error) {
    return <Card><CardContent className="flex flex-col items-center gap-3 py-14 text-center">
      <AlertTriangle className="h-8 w-8 text-destructive" /><p className="font-medium">{error}</p>
      <Button variant="outline" onClick={load}><RefreshCw className="h-4 w-4" /> Retry</Button>
    </CardContent></Card>;
  }

  if (detail) {
    return (
      <div className="space-y-6">
        <motion.button
          onClick={() => setDetail(null)}
          whileTap={{ scale: 0.95 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          className="text-sm font-semibold text-muted-foreground hover:text-foreground print:hidden"
        >
          ← Back
        </motion.button>

        {/* on-screen preview */}
        <Card className="mx-auto max-w-2xl print:hidden">
          <CardContent className="space-y-4 p-6 text-center">
            <p className="font-display text-lg font-bold">Payment Acknowledgement for CEE Course</p>
            <div className="grid gap-2 text-left text-sm sm:grid-cols-2">
              <p><span className="text-muted-foreground">Name:</span> <b>{detail.studentName}</b></p>
              <p><span className="text-muted-foreground">Register No:</span> <b>{detail.registerNo}</b></p>
              <p><span className="text-muted-foreground">Combination:</span> <b>{detail.course || "—"}</b></p>
              <p><span className="text-muted-foreground">Date of Birth:</span> <b>{detail.dateOfBirth || "—"}</b></p>
              <p><span className="text-muted-foreground">Class:</span> <b>{detail.className || "—"}</b></p>
              <p><span className="text-muted-foreground">Mobile:</span> <b>{detail.mobile || "—"}</b></p>
              <p><span className="text-muted-foreground">Email:</span> <b>{detail.email || "—"}</b></p>
            </div>
            <div className="rounded-2xl border border-border p-4 text-left">
              <p className="font-display text-base font-bold text-primary">{detail.courseName}</p>
              {detail.description && <p className="text-sm text-muted-foreground">{detail.description}</p>}
              <div className="mt-2 grid gap-1 text-sm sm:grid-cols-2">
                {detail.hours && <p><span className="text-muted-foreground">Hours:</span> {detail.hours}</p>}
                {detail.venue && <p><span className="text-muted-foreground">Venue:</span> {detail.venue}</p>}
                <p><span className="text-muted-foreground">Fee Paid:</span> <b>₹{detail.amount}</b></p>
                <p><span className="text-muted-foreground">Payment Date:</span> {detail.paidDate}</p>
                <p><span className="text-muted-foreground">Payment Mode:</span> Online</p>
              </div>
            </div>
            <Button variant="outline" onClick={printPage}><Download className="h-4 w-4" /> Print Receipt</Button>
          </CardContent>
        </Card>

        {/* formal document — invisible on screen, only rendered when printing */}
        <PrintCeeReceipt d={detail} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <PageTitle icon={Receipt}>CEE Receipts</PageTitle>
          <p className="text-sm text-muted-foreground">Your paid CEE / SEC course receipts.</p>
        </div>
        <Button variant="outline" size="sm" onClick={load}><RefreshCw className="h-4 w-4" /> Refresh</Button>
      </div>

      {(receipts || []).length === 0 ? (
        <Card><CardContent className="flex flex-col items-center gap-3 py-16 text-center">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary"><Receipt className="h-7 w-7" /></span>
          <p className="font-display text-lg font-semibold">No receipts</p>
          <p className="max-w-sm text-sm text-muted-foreground">Your paid CEE/SEC course receipts will appear here.</p>
        </CardContent></Card>
      ) : (
        <div className="space-y-3">
          {receipts.map((r) => (
            <motion.button
              key={r.id}
              onClick={() => openDetail(r.id)}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
              className="block w-full text-left"
            >
              <Card className="transition hover:border-primary/40 hover:shadow-card">
                <CardContent className="flex items-center justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-emerald-700 dark:text-emerald-300">{r.courseName}</p>
                    <p className="text-xs text-muted-foreground">
                      {r.paidDate ? `Paid ${r.paidDate}` : ""}{r.bankTransactionId ? ` · Txn ${r.bankTransactionId}` : ""}
                      {r.challanNo ? ` · Challan ${r.challanNo}` : ""}
                    </p>
                  </div>
                  {r.amount != null && <span className="shrink-0 font-display text-lg font-bold">₹{r.amount}</span>}
                </CardContent>
              </Card>
            </motion.button>
          ))}
        </div>
      )}
    </div>
  );
}
