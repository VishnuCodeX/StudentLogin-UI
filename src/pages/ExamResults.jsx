import { useEffect, useState } from "react";
import PageTitle from "@/components/PageTitle";
import { Loader2, AlertTriangle, RefreshCw, Award, Printer, Trophy } from "@/lib/icons";
import api, { unwrap } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getStudent } from "@/lib/auth";
import logo from "@/assets/images/mcc-title-brown.png";
import { printPage } from "@/lib/print";

function num(v) {
  return v === null || v === undefined ? "-" : v;
}

export default function ExamResults() {
  const [exams, setExams] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const student = getStudent();

  function load() {
    setLoading(true);
    setError("");
    unwrap(api.get("/results"))
      .then(setExams)
      .catch((e) => setError(e?.response?.data?.message || "Could not load results."))
      .finally(() => setLoading(false));
  }
  useEffect(load, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3 print:hidden">
        <div>
          <PageTitle icon={Trophy}>Exam Results</PageTitle>
          <p className="text-sm text-muted-foreground">
            {[student?.firstName, student?.registerNo].filter(Boolean).join(" · ")}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={printPage}><Printer className="h-4 w-4" /> Print</Button>
          <Button variant="outline" size="sm" onClick={load}><RefreshCw className="h-4 w-4" /> Refresh</Button>
        </div>
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
            <Award className="h-7 w-7" />
          </span>
          <p className="font-display text-lg font-semibold">No results published yet</p>
          <p className="max-w-sm text-sm text-muted-foreground">Your exam results will appear here once they are published.</p>
        </CardContent></Card>
      ) : (
        <>
          <div className="space-y-5 print:hidden">
          {exams.map((ex) => (
            <Card key={ex.examId}>
              <CardHeader className="flex-row flex-wrap items-center justify-between gap-2">
                <CardTitle>{ex.examCode} {ex.month} {ex.year}</CardTitle>
                <div className="flex flex-wrap items-center gap-2">
                  {ex.semester != null && <span className="rounded-full bg-muted px-3 py-1 text-sm font-medium">Sem {ex.semester}</span>}
                  {ex.gpa != null && <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-bold text-primary">GPA {ex.gpa}</span>}
                  <span className={`rounded-full px-3 py-1 text-sm font-semibold ${ex.allPassed ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"}`}>
                    {ex.allPassed ? "All Cleared" : "Has Backlog"}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-y border-border bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
                        <th className="px-5 py-3 text-left font-semibold">Subject</th>
                        <th className="px-3 py-3 text-center font-semibold">Internal (CIA)</th>
                        <th className="px-3 py-3 text-center font-semibold">External (ESE)</th>
                        <th className="px-3 py-3 text-center font-semibold">Total</th>
                        <th className="px-3 py-3 text-center font-semibold">Grade</th>
                        <th className="px-3 py-3 text-center font-semibold">GP</th>
                        <th className="px-5 py-3 text-center font-semibold">Result</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ex.subjects.map((s) => {
                        const pass = (s.result || "").toLowerCase() === "pass";
                        return (
                          <tr key={s.subjectCode} className="border-b border-border last:border-0 hover:bg-muted/40">
                            <td className="px-5 py-3">
                              <p className="font-medium">{s.subjectName}</p>
                              <p className="text-xs text-muted-foreground">{s.subjectCode}</p>
                            </td>
                            <td className="px-3 py-3 text-center tabular-nums">{num(s.internalMarks)}</td>
                            <td className="px-3 py-3 text-center tabular-nums">{num(s.externalMarks)}</td>
                            <td className="px-3 py-3 text-center font-medium tabular-nums">{num(s.totalMarks)}</td>
                            <td className="px-3 py-3 text-center font-bold text-primary">{s.grade || "-"}</td>
                            <td className="px-3 py-3 text-center tabular-nums">{num(s.gradePoint)}</td>
                            <td className="px-5 py-3 text-center">
                              <span className={`text-xs font-bold ${pass ? "text-success" : "text-destructive"}`}>
                                {s.result || "-"}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          ))}
          </div>
          <PrintMarksCard exams={exams} student={student} />
        </>
      )}
    </div>
  );
}

/* ── Formal printed marks card (hidden on screen, shown only when printing) ── */
const tableStyle = { width: "100%", borderCollapse: "collapse" };
const labelCell = { border: "1px solid #c9bda6", padding: "5px 9px", fontWeight: 700, background: "#f3ece0", whiteSpace: "nowrap", width: "14%" };
const valueCell = { border: "1px solid #c9bda6", padding: "5px 9px", width: "36%" };
const th = (align = "center") => ({ border: "1px solid #6e5638", padding: "6px 7px", background: "#5c4632", color: "#fdf8ee", textAlign: align, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.4px" });
const td = (align = "center") => ({ border: "1px solid #c9bda6", padding: "5px 7px", textAlign: align });

function PrintMarksCard({ exams, student }) {
  const today = new Date().toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" });
  const name = [student?.firstName, student?.lastName].filter(Boolean).join(" ") || "—";
  return (
    <div className="print-area" style={{ color: "#1a1208", fontFamily: "'Inter', Arial, sans-serif", fontSize: 12, padding: "2px 6px" }}>
      {/* letterhead */}
      <div style={{ textAlign: "center", borderBottom: "2.5px solid #800020", paddingBottom: 10, marginBottom: 16 }}>
        <img src={logo} alt="Mount Carmel College" style={{ height: 58, margin: "0 auto 4px", display: "block" }} />
        <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: "3px", textTransform: "uppercase", color: "#800020" }}>
          Statement of Marks
        </div>
      </div>

      {/* student details */}
      <table style={{ ...tableStyle, marginBottom: 18 }}>
        <tbody>
          <tr>
            <td style={labelCell}>Name</td><td style={valueCell}>{name}</td>
            <td style={labelCell}>Register No</td><td style={valueCell}>{student?.registerNo || "—"}</td>
          </tr>
          <tr>
            <td style={labelCell}>Programme</td><td style={valueCell}>{student?.programme || "—"}</td>
            <td style={labelCell}>Issued On</td><td style={valueCell}>{today}</td>
          </tr>
        </tbody>
      </table>

      {/* per-exam tables */}
      {exams.map((ex) => (
        <div key={ex.examId} style={{ marginBottom: 20, breakInside: "avoid" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
            <div style={{ fontWeight: 700, fontSize: 13 }}>
              {[ex.examCode, ex.month, ex.year].filter(Boolean).join(" ")}
              {ex.semester != null ? ` · Semester ${ex.semester}` : ""}
            </div>
            <div style={{ fontSize: 11.5, fontWeight: 600 }}>
              {ex.gpa != null ? `GPA: ${ex.gpa}  ·  ` : ""}{ex.allPassed ? "All Cleared" : "Has Backlog"}
            </div>
          </div>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={th("left")}>Code</th>
                <th style={th("left")}>Subject</th>
                <th style={th()}>Internal</th>
                <th style={th()}>External</th>
                <th style={th()}>Total</th>
                <th style={th()}>Grade</th>
                <th style={th()}>Result</th>
              </tr>
            </thead>
            <tbody>
              {ex.subjects.map((s, i) => (
                <tr key={i}>
                  <td style={td("left")}>{s.subjectCode}</td>
                  <td style={td("left")}>{s.subjectName}</td>
                  <td style={td()}>{num(s.internalMarks)}</td>
                  <td style={td()}>{num(s.externalMarks)}</td>
                  <td style={{ ...td(), fontWeight: 700 }}>{num(s.totalMarks)}</td>
                  <td style={{ ...td(), fontWeight: 700 }}>{s.grade || "-"}</td>
                  <td style={td()}>{s.result || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}

      {/* footer */}
      <div style={{ marginTop: 30, display: "flex", justifyContent: "space-between", alignItems: "flex-end", fontSize: 10.5 }}>
        <div style={{ color: "#6b5840" }}>
          Generated on {today}.<br />This is a computer-generated statement and does not require a signature.
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ borderTop: "1px solid #1a1208", width: 170, paddingTop: 4, fontWeight: 600 }}>Controller of Examinations</div>
        </div>
      </div>
    </div>
  );
}
