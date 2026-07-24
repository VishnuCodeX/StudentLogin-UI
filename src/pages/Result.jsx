// Developed By: Vishnukarthick K

import { useEffect, useState } from "react";
import PageTitle from "@/components/PageTitle";
import {
  AlertTriangle,
  RefreshCw,
  Printer,
  Award,
  GraduationCap,
  CheckCircle2,
} from "@/lib/icons";
import api, { unwrap } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SkeletonCard, SkeletonTable } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { getStudent } from "@/lib/auth";
import logo from "@/assets/images/mcc-title-brown.png";
import { printPage } from "@/lib/print";

function gradeColor(grade) {
  if (!grade) return "hsl(var(--muted-foreground))";
  const g = grade.toUpperCase();
  if (g.startsWith("A")) return "hsl(var(--success))";
  if (g.startsWith("B")) return "hsl(var(--primary))";
  if (g.startsWith("C")) return "hsl(var(--warning))";
  return "hsl(var(--destructive))";
}

function dash(v) {
  return v === null || v === undefined ? "-" : v;
}

export default function Result() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const student = getStudent();

  async function load() {
    setLoading(true);
    setError("");
    try {
      setData(await unwrap(api.get("/results")));
    } catch (err) {
      setError(err?.response?.data?.message || "Could not load results.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  if (loading) {
    const loadingName =
      [student?.firstName, student?.lastName].filter(Boolean).join(" ") || "Student";
    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-3 print:hidden">
          <div>
            <PageTitle icon={Award}>Semester Result / Marks Card</PageTitle>
            <p className="text-sm text-muted-foreground">
              {loadingName} · {student?.registerNo}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={printPage}>
            <Printer className="h-4 w-4" /> Print Marks Card
          </Button>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <SkeletonCard lines={2} />
          <SkeletonCard lines={2} />
          <SkeletonCard lines={2} />
        </div>
        <SkeletonTable rows={4} cols={8} />
        <SkeletonTable rows={3} cols={8} />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
          <AlertTriangle className="h-8 w-8 text-destructive" />
          <p className="font-medium">{error}</p>
          <Button variant="outline" onClick={load}>
            <RefreshCw className="h-4 w-4" /> Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  const semesters = data?.semesters || [];
  const fullName =
    [student?.firstName, student?.lastName].filter(Boolean).join(" ") || "Student";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3 print:hidden">
        <div>
          <PageTitle icon={Award}>Semester Result / Marks Card</PageTitle>
          <p className="text-sm text-muted-foreground">
            {fullName} · {student?.registerNo}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={printPage}>
          <Printer className="h-4 w-4" /> Print Marks Card
        </Button>
      </div>

      <div className="space-y-6 print:hidden">
      {/* CGPA summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="bg-joy border-0 text-white">
          <CardContent className="flex items-center gap-4 p-5">
            <Award className="h-9 w-9" />
            <div>
              <p className="font-display text-3xl font-bold">{dash(data?.cgpa)}</p>
              <p className="text-sm text-white/80">Cumulative GPA</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-secondary text-secondary-foreground">
              <GraduationCap className="h-5 w-5" />
            </span>
            <div>
              <p className="font-display text-2xl font-bold">{data?.totalCredits ?? 0}</p>
              <p className="text-sm text-muted-foreground">Total Credits Earned</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-success/15 text-success">
              <CheckCircle2 className="h-5 w-5" />
            </span>
            <div>
              <p className="font-display text-2xl font-bold">{semesters.length}</p>
              <p className="text-sm text-muted-foreground">Semesters Completed</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {semesters.length === 0 && (
        <Card>
          <CardContent className="py-14 text-center text-muted-foreground">
            No published results yet.
          </CardContent>
        </Card>
      )}

      {/* Per-semester marks cards */}
      {semesters.map((sem) => (
        <Card key={sem.semester}>
          <CardHeader className="flex-row flex-wrap items-center justify-between gap-2">
            <CardTitle>Semester {sem.semester}</CardTitle>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-bold text-primary">
                SGPA {sem.sgpa}
              </span>
              <span className="rounded-full bg-muted px-3 py-1 text-sm font-medium">
                {sem.totalCredits} credits
              </span>
              <span
                className={`rounded-full px-3 py-1 text-sm font-semibold ${
                  sem.allPassed ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"
                }`}
              >
                {sem.allPassed ? "All Cleared" : "Has Backlog"}
              </span>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {/* Desktop table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-y border-border bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="px-5 py-3 text-left font-semibold">Subject</th>
                    <th className="px-3 py-3 text-center font-semibold">Credits</th>
                    <th className="px-3 py-3 text-center font-semibold">CIA (25)</th>
                    <th className="px-3 py-3 text-center font-semibold">ESE (75)</th>
                    <th className="px-3 py-3 text-center font-semibold">Total (100)</th>
                    <th className="px-3 py-3 text-center font-semibold">Grade</th>
                    <th className="px-3 py-3 text-center font-semibold">GP</th>
                    <th className="px-5 py-3 text-center font-semibold">Result</th>
                  </tr>
                </thead>
                <tbody>
                  {sem.subjects.map((s) => (
                    <tr key={s.subjectCode} className="border-b border-border last:border-0 hover:bg-muted/40">
                      <td className="px-5 py-3">
                        <p className="font-medium">{s.subjectName}</p>
                        <p className="text-xs text-muted-foreground">{s.subjectCode}</p>
                      </td>
                      <td className="px-3 py-3 text-center tabular-nums">{s.credits}</td>
                      <td className="px-3 py-3 text-center tabular-nums">{dash(s.ciaAwarded)}</td>
                      <td className="px-3 py-3 text-center tabular-nums">{dash(s.eseAwarded)}</td>
                      <td className="px-3 py-3 text-center font-medium tabular-nums">{dash(s.totalAwarded)}</td>
                      <td className="px-3 py-3 text-center">
                        <span className="font-bold" style={{ color: gradeColor(s.grade) }}>
                          {dash(s.grade)}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-center tabular-nums">{dash(s.gradePoint)}</td>
                      <td className="px-5 py-3 text-center">
                        <span
                          className={`text-xs font-semibold ${
                            s.passed ? "text-success" : "text-destructive"
                          }`}
                        >
                          {s.result}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="space-y-3 p-4 md:hidden">
              {sem.subjects.map((s) => (
                <div key={s.subjectCode} className="rounded-xl border border-border p-3">
                  <div className="mb-2 flex items-start justify-between">
                    <div>
                      <p className="font-semibold">{s.subjectName}</p>
                      <p className="text-xs text-muted-foreground">{s.subjectCode} · {s.credits} credits</p>
                    </div>
                    <span className="text-lg font-bold" style={{ color: gradeColor(s.grade) }}>
                      {dash(s.grade)}
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-center text-xs">
                    <div><p className="font-semibold">{dash(s.ciaAwarded)}</p><p className="text-muted-foreground">CIA</p></div>
                    <div><p className="font-semibold">{dash(s.eseAwarded)}</p><p className="text-muted-foreground">ESE</p></div>
                    <div><p className="font-semibold">{dash(s.totalAwarded)}</p><p className="text-muted-foreground">Total</p></div>
                    <div><p className={`font-semibold ${s.passed ? "text-success" : "text-destructive"}`}>{s.result}</p><p className="text-muted-foreground">Result</p></div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
      </div>

      <PrintMarksCard
        semesters={semesters}
        student={student}
        cgpa={data?.cgpa}
        totalCredits={data?.totalCredits}
      />
    </div>
  );
}

/* ── Formal printed marks card (hidden on screen, shown only when printing) ── */
const tableStyle = { width: "100%", borderCollapse: "collapse" };
const labelCell = { border: "1px solid #c9bda6", padding: "5px 9px", fontWeight: 700, background: "#f3ece0", whiteSpace: "nowrap", width: "14%" };
const valueCell = { border: "1px solid #c9bda6", padding: "5px 9px", width: "36%" };
const th = (align = "center") => ({ border: "1px solid #6e5638", padding: "6px 7px", background: "#5c4632", color: "#fdf8ee", textAlign: align, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.4px" });
const td = (align = "center") => ({ border: "1px solid #c9bda6", padding: "5px 7px", textAlign: align });

function PrintMarksCard({ semesters, student, cgpa, totalCredits }) {
  const today = new Date().toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" });
  const name = [student?.firstName, student?.lastName].filter(Boolean).join(" ") || "—";
  return (
    <div className="print-area" style={{ color: "#1a1208", fontFamily: "'Inter', Arial, sans-serif", fontSize: 12, padding: "2px 6px" }}>
      {/* letterhead */}
      <div style={{ textAlign: "center", borderBottom: "2.5px solid #800020", paddingBottom: 10, marginBottom: 16 }}>
        <img src={logo} alt="Mount Carmel (Deemed to be University)" style={{ height: 58, margin: "0 auto 4px", display: "block" }} />
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

      {/* per-semester tables */}
      {semesters.map((sem) => (
        <div key={sem.semester} style={{ marginBottom: 20, breakInside: "avoid" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
            <div style={{ fontWeight: 700, fontSize: 13 }}>
              Semester {sem.semester}
            </div>
            <div style={{ fontSize: 11.5, fontWeight: 600 }}>
              SGPA: {dash(sem.sgpa)} · {sem.totalCredits} credits · {sem.allPassed ? "All Cleared" : "Has Backlog"}
            </div>
          </div>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={th("left")}>Subject</th>
                <th style={th()}>CIA</th>
                <th style={th()}>ESE</th>
                <th style={th()}>Total</th>
                <th style={th()}>Grade</th>
                <th style={th()}>Result</th>
              </tr>
            </thead>
            <tbody>
              {sem.subjects.map((s, i) => (
                <tr key={i}>
                  <td style={td("left")}>{s.subjectName} <span style={{ color: "#6b5840" }}>({s.subjectCode})</span></td>
                  <td style={td()}>{dash(s.ciaAwarded)}</td>
                  <td style={td()}>{dash(s.eseAwarded)}</td>
                  <td style={{ ...td(), fontWeight: 700 }}>{dash(s.totalAwarded)}</td>
                  <td style={{ ...td(), fontWeight: 700 }}>{dash(s.grade)}</td>
                  <td style={td()}>{s.result}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}

      {/* CGPA summary line */}
      <div style={{ border: "1px solid #6e5638", background: "#f3ece0", padding: "8px 12px", display: "flex", justifyContent: "space-between", fontWeight: 700, marginBottom: 24 }}>
        <span>Cumulative GPA: {dash(cgpa)}</span>
        <span>Total Credits Earned: {totalCredits ?? 0}</span>
        <span>Semesters Completed: {semesters.length}</span>
      </div>

      {/* footer */}
      <div style={{ marginTop: 30, display: "flex", justifyContent: "space-between", alignItems: "flex-end", fontSize: 10.5 }}>
        <div style={{ color: "#6b5840" }}>
          Generated on {today}.<br />This receipt was generated automatically. Please check all the details carefully because accidental errors may occur.
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ borderTop: "1px solid #1a1208", width: 170, paddingTop: 4, fontWeight: 600 }}>Controller of Examinations</div>
        </div>
      </div>
    </div>
  );
}
