// Developed By: Vishnukarthick K

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import PageTitle from "@/components/PageTitle";
import { AlertTriangle, RefreshCw, Award, Printer, Trophy, TrendingUp } from "@/lib/icons";
import api, { unwrap } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SkeletonTable } from "@/components/ui/skeleton";
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

  const gpaPoints = (exams || [])
    .filter((ex) => ex.gpa != null)
    .map((ex) => ({
      key: ex.examId,
      year: ex.year,
      semester: ex.semester,
      gpa: ex.gpa,
      label: ex.semester != null ? `Sem ${ex.semester}` : (ex.examCode || `${ex.month || ""} ${ex.year || ""}`).trim().slice(0, 9),
    }))
    .sort((a, b) => {
      const ka = (Number(a.year) || 0) * 100 + (Number(a.semester) || 0);
      const kb = (Number(b.year) || 0) * 100 + (Number(b.semester) || 0);
      return ka - kb;
    });

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

      <AnimatePresence mode="wait">
      {loading ? (
        <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
        <div className="space-y-5">
          <SkeletonTable rows={4} cols={7} />
          <SkeletonTable rows={3} cols={7} />
        </div>
        </motion.div>
      ) : error ? (
        <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
        <Card><CardContent className="flex flex-col items-center gap-3 py-14 text-center">
          <AlertTriangle className="h-8 w-8 text-destructive" /><p className="font-medium">{error}</p>
          <Button variant="outline" onClick={load}><RefreshCw className="h-4 w-4" /> Retry</Button>
        </CardContent></Card>
        </motion.div>
      ) : (exams || []).length === 0 ? (
        <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
        <Card><CardContent className="flex flex-col items-center gap-3 py-16 text-center">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-amber-100 text-amber-600 dark:bg-amber-500/20">
            <Award className="h-7 w-7" />
          </span>
          <p className="font-display text-lg font-semibold">No results published yet</p>
          <p className="max-w-sm text-sm text-muted-foreground">Your exam results will appear here once they are published.</p>
        </CardContent></Card>
        </motion.div>
      ) : (
        <motion.div key="content" className="space-y-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
          {gpaPoints.length >= 2 && (
            <Card className="print:hidden">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" /> GPA Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                <GpaTrendChart points={gpaPoints} />
              </CardContent>
            </Card>
          )}
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
                            <td className="px-3 py-3 text-center font-medium tabular-nums">
                              <div className="flex flex-col items-center gap-1">
                                <span>{num(s.totalMarks)}</span>
                                <MarksComposition internal={s.internalMarks} external={s.externalMarks} total={s.totalMarks} />
                              </div>
                            </td>
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
        </motion.div>
      )}
      </AnimatePresence>
    </div>
  );
}

/* ── Compact GPA trend across exams — bar chart, CSS draw-in (mirrors Dashboard's AttendanceChart) ── */
function GpaTrendChart({ points }) {
  const [grown, setGrown] = useState(false);
  useEffect(() => { const t = setTimeout(() => setGrown(true), 80); return () => clearTimeout(t); }, []);

  const W = 660, H = 220, padT = 30, padB = 40, padX = 16, padR = 28;
  const plotH = H - padT - padB;
  const MAX = 10;
  const n = points.length || 1;
  const slot = (W - padX - padR) / n;
  const barW = Math.min(44, slot * 0.5);
  const baseY = padT + plotH;
  const yFor = (v) => padT + plotH * (1 - Math.min(v, MAX) / MAX);

  const GRAD = {
    green: ["#69a877", "#3f7a4b"],
    amber: ["#dcb24a", "#a87c12"],
    terra: ["#e88a63", "#c5552f"],
  };
  const SOLID = { green: "#3f7a4b", amber: "#a87c12", terra: "#c5552f" };
  const tone = (v) => (v < 6 ? "terra" : v < 8 ? "amber" : "green");

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full text-muted-foreground" style={{ height: "auto" }}>
      <defs>
        {Object.entries(GRAD).map(([k, [a, b]]) => (
          <linearGradient key={k} id={`gpa-bar-${k}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={a} />
            <stop offset="100%" stopColor={b} />
          </linearGradient>
        ))}
      </defs>

      {/* gridlines */}
      {[0, 2.5, 5, 7.5, 10].map((g) => {
        const y = padT + plotH * (1 - g / MAX);
        return (
          <g key={g}>
            <line x1={padX} x2={W - padR} y1={y} y2={y} stroke="currentColor" strokeOpacity="0.09" />
            <text x={W - padR + 6} y={y + 3} fontSize="9" fill="currentColor" opacity="0.55">{g}</text>
          </g>
        );
      })}

      {/* bars + value pills */}
      {points.map((p, i) => {
        const v = Number(p.gpa) || 0;
        const x = padX + slot * i + (slot - barW) / 2;
        const cx = x + barW / 2;
        const y = yFor(v), h = Math.max(baseY - y, 2);
        const k = tone(v);
        const label = String(p.gpa);
        const pw = label.length * 7 + 11, ph = 18, py = y - ph - 7;
        const delay = 0.08 + i * 0.07;
        return (
          <g key={p.key ?? i}>
            <title>{p.label}: GPA {p.gpa}</title>
            {/* faint full-height track */}
            <rect x={x} y={padT} width={barW} height={baseY - padT} rx={9} fill="currentColor" opacity="0.05" />
            {/* bar — CSS grow from the baseline */}
            <rect
              x={x} y={y} width={barW} height={h} rx={9} fill={`url(#gpa-bar-${k})`}
              style={{
                transformBox: "fill-box", transformOrigin: "bottom",
                transform: grown ? "scaleY(1)" : "scaleY(0)",
                transition: `transform 0.8s cubic-bezier(.22,1,.36,1) ${delay}s`,
              }}
            />
            {/* value pill */}
            <g style={{
              opacity: grown ? 1 : 0, transform: grown ? "translateY(0)" : "translateY(6px)",
              transition: `opacity .4s ease ${delay + 0.5}s, transform .4s ease ${delay + 0.5}s`,
            }}>
              <rect x={cx - pw / 2} y={py} width={pw} height={ph} rx={ph / 2}
                fill="#fffaf3" stroke={SOLID[k]} strokeOpacity="0.4" strokeWidth="1" />
              <text x={cx} y={py + ph / 2 + 3.6} textAnchor="middle" fontSize="10.5" fontWeight="800" fill={SOLID[k]}>{label}</text>
            </g>
            {/* exam label */}
            <text x={cx} y={H - padB + 18} textAnchor="middle" fontSize="9.5" fill="currentColor" opacity="0.75">{p.label}</text>
          </g>
        );
      })}
    </svg>
  );
}

/* ── Tiny internal-vs-external composition indicator for a subject's Total cell ── */
function MarksComposition({ internal, external, total }) {
  if (internal == null || external == null || !total) return null;
  const t = Number(total);
  if (!t) return null;
  const iPct = Math.max(0, Math.min(100, (Number(internal) / t) * 100));
  const ePct = Math.max(0, 100 - iPct);
  return (
    <span
      className="flex h-1.5 w-12 overflow-hidden rounded-full bg-muted"
      title={`Internal ${internal} + External ${external} = ${total}`}
    >
      <span className="h-full bg-primary" style={{ width: `${iPct}%` }} />
      <span className="h-full bg-primary/35" style={{ width: `${ePct}%` }} />
    </span>
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
          Generated on {today}.<br />This receipt was generated automatically. Please check all the details carefully because accidental errors may occur.
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ borderTop: "1px solid #1a1208", width: 170, paddingTop: 4, fontWeight: 600 }}>Controller of Examinations</div>
        </div>
      </div>
    </div>
  );
}
