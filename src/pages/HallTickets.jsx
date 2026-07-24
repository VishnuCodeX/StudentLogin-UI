// Developed By: Vishnukarthick K

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import PageTitle from "@/components/PageTitle";
import { AlertTriangle, RefreshCw, Ticket, Download } from "@/lib/icons";
import api, { unwrap } from "@/lib/api";
import { getStudent } from "@/lib/auth";
import { printPage } from "@/lib/print";
import logo from "@/assets/images/mcc-title-brown.png";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SkeletonGrid } from "@/components/ui/skeleton";

const boxTable = { width: "100%", borderCollapse: "collapse", border: "1.5px solid #1a1208" };
const boxLabel = { border: "1px solid #c9bda6", padding: "6px 10px", fontWeight: 700, width: "22%", verticalAlign: "top", background: "#f8f3ea" };
const boxValue = { border: "1px solid #c9bda6", padding: "6px 10px", width: "28%" };

// The formal printed hall ticket — hidden on screen, shown only inside .print-area during
// printing (the global print stylesheet hides everything else; see PrintCeeReceipt in
// CeeReceipts.jsx / PrintAttnShortageReceipt in AttendanceShortageFine.jsx for the same pattern).
function PrintHallTicket({ exam, student }) {
  const name = [student?.firstName, student?.lastName].filter(Boolean).join(" ") || "—";
  return (
    <div className="print-area" style={{ color: "#1a1208", fontFamily: "'Inter', Arial, sans-serif", fontSize: 12, padding: "0 4px" }}>
      <div style={{ textAlign: "center", borderBottom: "2px solid #800020", paddingBottom: 8, marginBottom: 14 }}>
        <img src={logo} alt="Mount Carmel University" style={{ height: 48, margin: "0 auto 6px", display: "block" }} />
        <div style={{ marginTop: 8, fontSize: 13, fontWeight: 700, letterSpacing: "0.5px" }}>EXAMINATION HALL TICKET</div>
      </div>

      <table style={boxTable}>
        <tbody>
          <tr>
            <td style={boxLabel}>Name of Candidate</td>
            <td style={boxValue}>{name}</td>
            <td style={boxLabel}>Register Number</td>
            <td style={boxValue}>{student?.registerNo || "—"}</td>
          </tr>
          <tr>
            <td style={boxLabel}>Class</td>
            <td style={boxValue}>{exam?.className || "—"}</td>
            <td style={boxLabel}>Semester</td>
            <td style={boxValue}>{exam?.semester ?? "—"}</td>
          </tr>
          <tr>
            <td style={boxLabel}>Examination</td>
            <td style={boxValue}>{exam?.examCode || "—"}</td>
            <td style={boxLabel}>Month &amp; Year</td>
            <td style={boxValue}>{[exam?.month, exam?.year].filter(Boolean).join(" ") || "—"}</td>
          </tr>
        </tbody>
      </table>

      <div style={{ marginTop: 16, fontSize: 10, color: "#6b5840" }}>
        This receipt was generated automatically. Please check all the details carefully because accidental errors may occur.
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 28, fontSize: 11, fontWeight: 600 }}>
        <div>Date :</div>
        <div style={{ textAlign: "right" }}>
          <div>Signature of the Candidate</div>
          <div style={{ marginTop: 26 }}>Controller of Examinations</div>
        </div>
      </div>
    </div>
  );
}

export default function HallTickets() {
  const [exams, setExams] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [printExam, setPrintExam] = useState(null);
  const student = getStudent();

  function load() {
    setLoading(true);
    setError("");
    unwrap(api.get("/hallticket/download"))
      .then(setExams)
      .catch((e) => setError(e?.response?.data?.message || "Could not load hall tickets."))
      .finally(() => setLoading(false));
  }
  useEffect(load, []);

  // The print-area only reflects `printExam` after this component re-renders, so printPage()
  // is fired from an effect (post-commit) rather than inline in the click handler — that way
  // the DOM the browser prints always matches the hall ticket the user actually clicked.
  useEffect(() => {
    if (printExam) printPage();
  }, [printExam]);

  function handleDownload(exam) {
    setPrintExam({ ...exam, _printedAt: Date.now() });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <PageTitle icon={Ticket}>Hall Tickets</PageTitle>
          <p className="text-sm text-muted-foreground">Download hall tickets for your exams.</p>
        </div>
        <Button variant="outline" size="sm" onClick={load}>
          <RefreshCw className="h-4 w-4" /> Refresh
        </Button>
      </div>

      <AnimatePresence mode="wait">
      {loading ? (
        <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
        <SkeletonGrid items={4} className="sm:grid-cols-2 lg:grid-cols-2" />
        </motion.div>
      ) : error ? (
        <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
        <Card><CardContent className="flex flex-col items-center gap-3 py-14 text-center">
          <AlertTriangle className="h-8 w-8 text-destructive" />
          <p className="font-medium">{error}</p>
          <Button variant="outline" onClick={load}><RefreshCw className="h-4 w-4" /> Retry</Button>
        </CardContent></Card>
        </motion.div>
      ) : (exams || []).length === 0 ? (
        <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
        <Card><CardContent className="flex flex-col items-center gap-3 py-16 text-center">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-pink-100 text-pink-600 dark:bg-pink-500/20">
            <Ticket className="h-7 w-7" />
          </span>
          <p className="font-display text-lg font-semibold">No hall tickets available</p>
          <p className="max-w-sm text-sm text-muted-foreground">Hall tickets appear here once your exam registration is processed.</p>
        </CardContent></Card>
        </motion.div>
      ) : (
        <motion.div key="content" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
        <div className="grid gap-4 sm:grid-cols-2">
          {exams.map((e) => (
            <Card key={e.examId}>
              <CardContent className="flex items-center gap-4 p-5">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-pink-400 to-rose-500 text-2xl">🎫</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{e.examCode}</p>
                  <p className="text-xs text-muted-foreground">
                    {e.className} · Sem {e.semester} · {e.month} {e.year}
                  </p>
                </div>
                <Button variant="gradient" size="sm" onClick={() => handleDownload(e)}>
                  <Download className="h-4 w-4" /> Download
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
        </motion.div>
      )}
      </AnimatePresence>

      {printExam && <PrintHallTicket exam={printExam} student={student} />}
    </div>
  );
}
