import { useEffect, useState } from "react";
import PageTitle from "@/components/PageTitle";
import { AlertTriangle, CheckCircle2, Loader2, RefreshCw, ClipboardCheck } from "@/lib/icons";
import api, { unwrap } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import AbsenceModal from "@/components/AbsenceModal";

function tone(pct) {
  if (pct < 75) return "#c5552f";
  if (pct < 85) return "#a87c12";
  return "#3f7a4b";
}
// CSS gradient per tone band (left→right)
function toneGradCss(pct) {
  if (pct < 75) return "linear-gradient(90deg,#e1693f,#c5552f)";
  if (pct < 85) return "linear-gradient(90deg,#d8a93f,#a87c12)";
  return "linear-gradient(90deg,#5a9e69,#3f7a4b)";
}

/* ── Subject-wise — sleek horizontal progress rows (CSS width draw-in) ──
   CSS transitions (not framer-motion): these nodes live under AppLayout's
   variant-driven motion.div, whose variant propagation suppresses a child's
   object `animate`. CSS is immune to that. */
function BarChart({ subjects }) {
  const data = subjects.filter((s) => s.conductedClasses > 0);
  const [grown, setGrown] = useState(false);
  useEffect(() => { const t = setTimeout(() => setGrown(true), 60); return () => clearTimeout(t); }, []);
  if (!data.length) return <p className="py-10 text-center text-sm text-muted-foreground">No data to chart.</p>;
  return (
    <div className="space-y-4">
      {data.map((s, i) => {
        const v = Math.max(0, Math.min(100, s.percentageWithoutLeave));
        const col = tone(s.percentageWithoutLeave);
        const delay = i * 0.07;
        return (
          <div key={i} className="group">
            <div className="mb-1.5 flex items-baseline justify-between gap-3">
              <div className="min-w-0">
                <span className="text-sm font-semibold">{s.subjectName}</span>
                <span className="ml-2 text-xs text-muted-foreground">{s.subjectCode}</span>
              </div>
              <span className="shrink-0 font-display text-sm font-extrabold tabular-nums" style={{ color: col }}>
                {s.percentageWithoutLeave}%
              </span>
            </div>
            <div className="relative h-3 overflow-hidden rounded-full bg-muted/70 ring-1 ring-border/40">
              {/* eligibility marker @ 75% */}
              <span className="absolute inset-y-0 z-10 w-px bg-foreground/30" style={{ left: "75%" }} />
              {/* animated fill */}
              <div
                className="absolute inset-y-0 left-0 rounded-full"
                style={{
                  width: grown ? `${v}%` : "0%",
                  background: toneGradCss(s.percentageWithoutLeave),
                  boxShadow: `0 1px 6px ${col}55`,
                  transition: `width 0.9s cubic-bezier(.22,1,.36,1) ${delay}s`,
                }}
              />
            </div>
          </div>
        );
      })}
      <div className="flex items-center gap-2 pt-1 text-xs text-muted-foreground">
        <span className="inline-block h-3 w-px bg-foreground/30" /> Vertical mark = 75% eligibility threshold
      </div>
    </div>
  );
}

/* ── Overall — semicircular gauge (CSS stroke-dashoffset sweep) ──
   The value arc is coloured by the student's own band (green/amber/red) so a good
   score reads green, not a misleading red→green gradient. A maroon tick marks the
   75% minimum on the correct (upper-right) side of the dial. */
function PieChart({ presentPct }) {
  const present = Math.max(0, Math.min(100, presentPct));
  const absentPct = Math.max(0, Math.round((100 - present) * 100) / 100);
  // show the precise value (e.g. 99.67%) — never round 99.67 up to 100
  const label = `${Number.isInteger(present) ? present : Math.round(present * 100) / 100}%`;
  const VB_W = 280, VB_H = 168;
  const R = 104, CX = 140, CY = 144, SW = 22;
  const len = Math.PI * R;                  // arc length of a semicircle
  const dash = (present / 100) * len;
  const d = `M ${CX - R} ${CY} A ${R} ${R} 0 0 1 ${CX + R} ${CY}`;
  // point on the dial for a fraction f (0 = left/0%, 1 = right/100%), at radius r
  const at = (f, r) => {
    const ang = Math.PI * (1 - f);          // 0% → 180°, 100% → 0° (measured over the top)
    return [CX + r * Math.cos(ang), CY - r * Math.sin(ang)];
  };
  const [ti, to] = [at(0.75, R - SW / 2 - 3), at(0.75, R + SW / 2 + 3)];
  const band = present < 75 ? "red" : present < 85 ? "amber" : "green";
  const STOPS = { green: ["#5a9e69", "#3f7a4b"], amber: ["#d8a93f", "#a87c12"], red: ["#e1693f", "#c5552f"] };
  const [drawn, setDrawn] = useState(false);
  useEffect(() => { const t = setTimeout(() => setDrawn(true), 80); return () => clearTimeout(t); }, []);
  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-center sm:gap-14">
      <div className="relative w-72 max-w-full">
        <svg viewBox={`0 0 ${VB_W} ${VB_H}`} className="w-full">
          <defs>
            <linearGradient id="gaugeFill" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={STOPS[band][0]} />
              <stop offset="100%" stopColor={STOPS[band][1]} />
            </linearGradient>
          </defs>
          {/* track */}
          <path d={d} fill="none" stroke="currentColor" strokeOpacity="0.12" strokeWidth={SW} strokeLinecap="round" className="text-muted-foreground" />
          {/* value sweep */}
          <path
            d={d} fill="none" stroke="url(#gaugeFill)" strokeWidth={SW} strokeLinecap="round"
            strokeDasharray={`${dash} ${len}`}
            style={{ strokeDashoffset: drawn ? 0 : dash, transition: "stroke-dashoffset 1.3s cubic-bezier(.22,1,.36,1)" }}
          />
          {/* 75% minimum tick (upper-right of the dial) */}
          <line x1={ti[0]} y1={ti[1]} x2={to[0]} y2={to[1]} stroke="#7a1f1f" strokeWidth="3" strokeLinecap="round" />
          <text x={to[0] + 4} y={to[1]} fontSize="9.5" fontWeight="700" fill="#7a1f1f" dominantBaseline="middle">75%</text>
          {/* endpoint labels */}
          <text x={CX - R} y={CY + 16} fontSize="9" textAnchor="middle" fill="currentColor" opacity="0.5">0</text>
          <text x={CX + R} y={CY + 16} fontSize="9" textAnchor="middle" fill="currentColor" opacity="0.5">100</text>
        </svg>
        <div className="pointer-events-none absolute inset-x-0 bottom-1 flex flex-col items-center">
          <span
            className={`font-display font-extrabold leading-none ${label.length > 4 ? "text-3xl" : "text-4xl"}`}
            style={{
              color: tone(present),
              opacity: drawn ? 1 : 0, transform: drawn ? "scale(1)" : "scale(0.7)",
              transition: "opacity .5s ease .45s, transform .5s ease .45s",
            }}
          >{label}</span>
          <span className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Overall Present</span>
        </div>
      </div>
      <div className="space-y-3">
        <div className="flex items-center gap-2"><span className="h-3.5 w-3.5 rounded-sm" style={{ background: STOPS[band][1] }} /><span className="text-sm font-semibold">Present (with CL): <b>{present}%</b></span></div>
        <div className="flex items-center gap-2"><span className="h-3.5 w-3.5 rounded-sm" style={{ background: "#e1693f" }} /><span className="text-sm font-semibold">Absent: <b>{absentPct}%</b></span></div>
        <div className="flex items-center gap-2"><span className="h-4 w-1 rounded-sm" style={{ background: "#7a1f1f" }} /><span className="text-sm font-semibold">Min. required: <b>75%</b></span></div>
      </div>
    </div>
  );
}

const TABS = [["details", "Attendance Details"], ["subject", "Subjectwise Chart"], ["overall", "Overall Chart"]];

export default function Attendance() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("details");
  const [popup, setPopup] = useState(null);

  async function load() {
    setLoading(true); setError("");
    try { setData(await unwrap(api.get("/attendance"))); }
    catch (err) { setError(err?.response?.data?.message || "Could not load attendance."); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  if (loading) return <div className="flex h-64 items-center justify-center text-muted-foreground"><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading attendance…</div>;
  if (error) return <Card><CardContent className="flex flex-col items-center gap-3 py-14 text-center"><AlertTriangle className="h-8 w-8 text-destructive" /><p className="font-medium">{error}</p><Button variant="outline" onClick={load}><RefreshCw className="h-4 w-4" /> Retry</Button></CardContent></Card>;

  const subjects = data?.subjects || [];
  const activities = data?.activities || [];
  const presentWithCl = data?.overallPercentageWithLeave ?? 0;
  const overallNoCl = data?.overallPercentageWithoutLeave ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <PageTitle icon={ClipboardCheck}>Attendance</PageTitle>
          <p className="text-sm text-muted-foreground">{data?.studentName} · {data?.className}</p>
        </div>
        <Button variant="outline" size="sm" onClick={load}><RefreshCw className="h-4 w-4" /> Refresh</Button>
      </div>

      {data?.shortage ? (
        <div className="flex items-center gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-destructive">
          <AlertTriangle className="h-5 w-5 shrink-0" /><p className="text-sm font-medium">Your overall attendance is below 75%. You may face a shortage hold on exam eligibility.</p>
        </div>
      ) : (
        <div className="flex items-center gap-3 rounded-2xl border border-success/30 bg-success/5 px-4 py-3 text-success">
          <CheckCircle2 className="h-5 w-5 shrink-0" /><p className="text-sm font-medium">
            {overallNoCl >= 90
              ? "Excellent — your attendance is well above the 75% requirement."
              : overallNoCl >= 85
              ? "Great — your attendance is comfortably above the 75% requirement."
              : "You're above the 75% attendance requirement — keep it up."}
          </p>
        </div>
      )}

      {/* tabs */}
      <div className="flex flex-wrap gap-2">
        {TABS.map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${tab === id ? "bg-joy text-white" : "bg-muted text-muted-foreground hover:bg-muted/70"}`}>{label}</button>
        ))}
      </div>

      {tab === "details" && (
        <>
          <AttendanceSection title="Subject-wise Attendance" rows={subjects} firstColLabel="Subject" onAbsent={setPopup} />
          {activities.length > 0 && (
            <AttendanceSection title="Activity Attendance" subtitle="NCC, sports, clubs and other co-curricular activities" rows={activities} firstColLabel="Activity" onAbsent={setPopup} />
          )}
          <p className="rounded-2xl border border-border bg-muted/40 px-4 py-3 text-xs text-muted-foreground">
            Click an <b>Absent</b> count to see the dates &amp; periods · CL = co-curricular leave · Eligibility is 75% per subject.
          </p>
        </>
      )}

      {tab === "subject" && (
        <Card><CardContent className="p-5">
          <p className="mb-2 text-sm font-semibold text-muted-foreground">Percentage (without CL) per subject</p>
          <BarChart subjects={subjects} />
        </CardContent></Card>
      )}

      {tab === "overall" && (
        <Card><CardContent className="p-8">
          <PieChart presentPct={presentWithCl} />
        </CardContent></Card>
      )}

      {popup && <AbsenceModal subject={popup} onClose={() => setPopup(null)} />}
    </div>
  );
}

function AttendanceSection({ title, subtitle, rows, firstColLabel, onAbsent }) {
  return (
    <>
      <Card className="hidden md:block">
        <CardContent className="p-0">
          <div className="border-b border-border px-5 py-4">
            <h2 className="font-display text-base font-bold">{title}</h2>
            {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-5 py-3 font-semibold">{firstColLabel}</th>
                  <th className="px-3 py-3 text-center font-semibold">Conducted</th>
                  <th className="px-3 py-3 text-center font-semibold">Present</th>
                  <th className="px-3 py-3 text-center font-semibold">Absent</th>
                  <th className="px-3 py-3 text-center font-semibold">% w/o CL</th>
                  <th className="px-5 py-3 text-center font-semibold">% with CL</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((s, i) => (
                  <tr key={`${s.subjectCode}-${i}`} className="border-b border-border last:border-0 hover:bg-muted/40">
                    <td className="px-5 py-3"><p className="font-medium">{s.subjectName}</p><p className="text-xs text-muted-foreground">{s.subjectCode}</p></td>
                    <td className="px-3 py-3 text-center tabular-nums">{s.conductedClasses}</td>
                    <td className="px-3 py-3 text-center tabular-nums text-success">{s.classesPresent}</td>
                    <td className="px-3 py-3 text-center">
                      {s.classesAbsent > 0 && s.subjectId ? (
                        <button onClick={() => onAbsent(s)} className="font-bold text-destructive underline decoration-dotted underline-offset-2 hover:opacity-80 tabular-nums">{s.classesAbsent}</button>
                      ) : (
                        <span className="tabular-nums text-destructive">{s.classesAbsent}</span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-center"><span className="font-bold" style={{ color: tone(s.percentageWithoutLeave) }}>{s.percentageWithoutLeave}%</span></td>
                    <td className="px-5 py-3 text-center font-medium tabular-nums">{s.percentageWithLeave}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* mobile */}
      <div className="space-y-3 md:hidden">
        <h2 className="font-display text-base font-bold">{title}</h2>
        {rows.map((s, i) => (
          <Card key={`${s.subjectCode}-${i}`}>
            <CardContent className="p-4">
              <div className="mb-2 flex items-start justify-between">
                <div><p className="font-semibold">{s.subjectName}</p><p className="text-xs text-muted-foreground">{s.subjectCode}</p></div>
                <span className="rounded-full px-2 py-1 text-xs font-bold" style={{ color: tone(s.percentageWithoutLeave) }}>{s.percentageWithoutLeave}%</span>
              </div>
              <div className="grid grid-cols-4 gap-2 text-center text-xs">
                <div><p className="font-semibold">{s.conductedClasses}</p><p className="text-muted-foreground">Held</p></div>
                <div><p className="font-semibold text-success">{s.classesPresent}</p><p className="text-muted-foreground">Present</p></div>
                <div>
                  {s.classesAbsent > 0 && s.subjectId ? (
                    <button onClick={() => onAbsent(s)} className="font-semibold text-destructive underline decoration-dotted">{s.classesAbsent}</button>
                  ) : <p className="font-semibold text-destructive">{s.classesAbsent}</p>}
                  <p className="text-muted-foreground">Absent</p>
                </div>
                <div><p className="font-semibold">{s.percentageWithLeave}%</p><p className="text-muted-foreground">w/ CL</p></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
