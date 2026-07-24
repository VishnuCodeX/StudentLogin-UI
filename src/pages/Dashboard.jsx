// Developed By: Vishnukarthick K

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ClipboardCheck, Award, Receipt, Ticket, CalendarDays, BookOpen, FileText, CreditCard,
  Bell, TrendingUp, GraduationCap, ArrowUpRight, CheckCircle2, AlertTriangle,
  Layers, Megaphone, Sparkles, Info, ListChecks, Wallet, Home,
} from "@/lib/icons";
import api, { unwrap } from "@/lib/api";
import { getStudent } from "@/lib/auth";
import { motion, AnimatePresence } from "framer-motion";
import { Stagger, Item } from "@/components/motion";
import { Skeleton } from "@/components/ui/skeleton";

const QUICK = [
  { to: "/attendanceDetails", label: "Attendance", icon: ClipboardCheck },
  { to: "/downloads/sem-result", label: "Results", icon: Award },
  { to: "/fees/online", label: "Fee Payment", icon: Receipt },
  { to: "/hallticket/download", label: "Hall Ticket", icon: Ticket },
  { to: "/timetable/class", label: "Time Table", icon: CalendarDays },
  { to: "/lms/courses", label: "LMS", icon: BookOpen },
  { to: "/apply/supplementary", label: "Applications", icon: FileText },
  { to: "/idcard/apply", label: "ID Card", icon: CreditCard },
];

function tone(pct) {
  if (pct < 75) return { ring: "#e1693f", text: "text-[#c5552f]", soft: "bg-[#f7e7df]" };
  if (pct < 85) return { ring: "#c9971f", text: "text-[#a87c12]", soft: "bg-[#f6edd5]" };
  return { ring: "#4f8a5b", text: "text-[#3f7a4b]", soft: "bg-[#e6f0e6]" };
}

// Eases a numeric value up from 0 on mount/change — shared by Ring and StatCard so every
// KPI number on the dashboard animates in in the same way instead of just popping in.
function useCountUp(target, duration = 1000) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const startTime = performance.now();
    let rafId;

    const step = (now) => {
      const t = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(eased * target));
      if (t < 1) {
        rafId = requestAnimationFrame(step);
      }
    };

    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, [target, duration]);

  return display;
}

function Ring({ value = 0, size = 132, stroke = 12, color = "#8a6d4a", track = "#ece0cb" }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (Math.min(value, 100) / 100) * c;
  const displayValue = useCountUp(value);

  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size, maxWidth: "100%" }}>
      <svg width={size} height={size} className="-rotate-90" style={{ maxWidth: "100%", height: "auto" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeLinecap="round" strokeDasharray={c} strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1s cubic-bezier(.22,1,.36,1)" }}
        />
      </svg>
      <div className="absolute text-center">
        <p className="font-display text-2xl font-bold leading-none">{displayValue}%</p>
        <p className="mt-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Overall</p>
      </div>
    </div>
  );
}

function AttendanceChart({ subjects }) {
  const data = subjects.slice(0, 8);
  const [grown, setGrown] = useState(false);
  useEffect(() => { const t = setTimeout(() => setGrown(true), 80); return () => clearTimeout(t); }, []);
  const W = 660, H = 262, padT = 38, padB = 46, padX = 16, padR = 28;
  const plotH = H - padT - padB;
  const n = data.length || 1;
  const slot = (W - padX - padR) / n;
  const barW = Math.min(44, slot * 0.5);
  const baseY = padT + plotH;
  const yFor = (v) => padT + plotH * (1 - Math.min(v, 100) / 100);
  const thresholdY = yFor(75);

  const GRAD = {
    green: ["#69a877", "#3f7a4b"],
    amber: ["#dcb24a", "#a87c12"],
    terra: ["#e88a63", "#c5552f"],
  };
  const SOLID = { green: "#3f7a4b", amber: "#a87c12", terra: "#c5552f" };
  const key = (v) => (v < 75 ? "terra" : v < 85 ? "amber" : "green");

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full text-muted-foreground" style={{ height: "auto" }}>
        <defs>
          {Object.entries(GRAD).map(([k, [a, b]]) => (
            <linearGradient key={k} id={`bar-${k}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={a} />
              <stop offset="100%" stopColor={b} />
            </linearGradient>
          ))}
        </defs>

        {/* gridlines */}
        {[0, 25, 50, 75, 100].map((g) => {
          const y = padT + plotH * (1 - g / 100);
          return (
            <g key={g}>
              <line x1={padX} x2={W - padR} y1={y} y2={y} stroke="currentColor" strokeOpacity="0.09" />
              <text x={W - padR + 6} y={y + 3} fontSize="9" fill="currentColor" opacity="0.55">{g}</text>
            </g>
          );
        })}

        {/* 75% threshold line — labelled in the legend, not over the bars */}
        <line x1={padX} x2={W - padR} y1={thresholdY} y2={thresholdY} stroke="#c5552f" strokeWidth="1.5" strokeDasharray="5 4" strokeOpacity="0.85" />

        {/* bars + value pills */}
        {data.map((s, i) => {
          const v = s.percentageWithoutLeave;
          const x = padX + slot * i + (slot - barW) / 2;
          const cx = x + barW / 2;
          const y = yFor(v), h = Math.max(baseY - y, 2);
          const k = key(v);
          const code = (s.subjectCode || "").length > 9 ? s.subjectCode.slice(0, 9) : s.subjectCode;
          const label = `${Math.round(v)}%`;
          const pw = label.length * 7 + 11, ph = 18, py = y - ph - 7;
          const delay = 0.08 + i * 0.07;
          return (
            <g key={s.subjectCode || i}>
              <title>{s.subjectName}: {v}%</title>
              {/* faint full-height track */}
              <rect x={x} y={padT} width={barW} height={baseY - padT} rx={9} fill="currentColor" opacity="0.05" />
              {/* bar — CSS grow from the baseline (reliable under the page's motion wrapper) */}
              <rect
                x={x} y={y} width={barW} height={h} rx={9} fill={`url(#bar-${k})`}
                style={{
                  transformBox: "fill-box", transformOrigin: "bottom",
                  transform: grown ? "scaleY(1)" : "scaleY(0)",
                  transition: `transform 0.8s cubic-bezier(.22,1,.36,1) ${delay}s`,
                }}
              />
              {/* value pill — opaque, so the threshold line never strikes through it */}
              <g style={{
                opacity: grown ? 1 : 0, transform: grown ? "translateY(0)" : "translateY(6px)",
                transition: `opacity .4s ease ${delay + 0.5}s, transform .4s ease ${delay + 0.5}s`,
              }}>
                <rect x={cx - pw / 2} y={py} width={pw} height={ph} rx={ph / 2}
                  fill="#fffaf3" stroke={SOLID[k]} strokeOpacity="0.4" strokeWidth="1" />
                <text x={cx} y={py + ph / 2 + 3.6} textAnchor="middle" fontSize="10.5" fontWeight="800" fill={SOLID[k]}>{label}</text>
              </g>
              {/* subject code */}
              <text x={cx} y={H - padB + 18} textAnchor="middle" fontSize="9.5" fill="currentColor" opacity="0.75">{code}</text>
            </g>
          );
        })}
      </svg>

      {/* legend */}
      <div className="mt-2 flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full" style={{ background: "#3f7a4b" }} /> Good (≥85%)</span>
        <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full" style={{ background: "#a87c12" }} /> Watch (75–84%)</span>
        <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full" style={{ background: "#c5552f" }} /> Short (&lt;75%)</span>
        <span className="flex items-center gap-1.5"><i className="inline-block h-0 w-5 border-t-2 border-dashed" style={{ borderColor: "#c5552f" }} /> 75% required</span>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, suffix = "", hint, hintTone }) {
  const isNumeric = typeof value === "number";
  const displayValue = useCountUp(isNumeric ? value : 0);

  return (
    <div className="group rounded-3xl border border-border bg-card p-5 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-card">
      <div className="flex items-start justify-between">
        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </span>
        {hint && (
          <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${hintTone || "bg-muted text-muted-foreground"}`}>
            {hint}
          </span>
        )}
      </div>
      <p className="mt-4 font-display text-3xl font-bold leading-none">
        {isNumeric ? `${displayValue}${suffix}` : value}
      </p>
      <p className="mt-1.5 text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default function Dashboard() {
  const stored = getStudent();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    unwrap(api.get("/dashboard"))
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  const [pending, setPending] = useState({ misc: [], idc: [], hostel: [] });
  const [pendingLoading, setPendingLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([
      unwrap(api.get("/misc-payments", { skipErrorToast: true })),
      unwrap(api.get("/idc/applications", { skipErrorToast: true })),
      unwrap(api.get("/hostel-leave", { skipErrorToast: true })),
    ])
      .then(([misc, idc, hostel]) => {
        const miscItems = misc.status === "fulfilled" ? (misc.value || []).filter((l) => !l.paid) : [];
        const idcItems = idc.status === "fulfilled" ? (idc.value || []).filter((a) => /pend/i.test(a.status || "")) : [];
        const hostelItems = hostel.status === "fulfilled" ? (hostel.value?.leaves || []).filter((l) => l.status === "Pending") : [];
        setPending({ misc: miscItems, idc: idcItems, hostel: hostelItems });
      })
      .finally(() => setPendingLoading(false));
  }, []);

  const pendingItems = [
    ...pending.misc.map((l) => ({
      key: `misc-${l.id}`, icon: Wallet, to: "/apply/misc-payments",
      text: `Misc Payment: ${l.name} — ₹${l.amount} due`,
    })),
    ...pending.idc.map((a) => ({
      key: `idc-${a.id}`, icon: GraduationCap, to: "/apply/idc",
      text: a.courseName ? `IDC application pending payment: ${a.courseName}` : "IDC application pending payment",
    })),
    ...pending.hostel.map((l) => ({
      key: `hostel-${l.id}`, icon: Home, to: "/apply/hostel-leave",
      text: l.leaveType ? `Hostel leave request pending approval: ${l.leaveType}` : "Hostel leave request pending approval",
    })),
  ].slice(0, 5);

  const rawName = data?.studentName || stored?.firstName || "Student";
  const titleCase = (s) =>
    s.toLowerCase().replace(/\b([a-z])/g, (m) => m.toUpperCase());
  // Show a friendly name: full (title-cased) if reasonably short, else the first 2 words.
  const words = rawName.trim().split(/\s+/);
  const first = titleCase(rawName.length <= 22 ? rawName : words.slice(0, 2).join(" "));
  const att = data?.attendance;
  const subjects = att?.subjects || [];
  const notifications = data?.notifications || [];
  const overall = att?.overallPercentageWithoutLeave ?? 0;
  const [withLeave, setWithLeave] = useState(false);
  const ringValue = withLeave ? att?.overallPercentageWithLeave ?? 0 : overall;
  const t = tone(ringValue);
  const shortage = att?.shortage;
  const today = new Date().toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" });

  return (
    <Stagger className="space-y-6">
      {/* ── Hero ── */}
      <Item>
        <div className="relative overflow-hidden rounded-[28px] border border-border bg-card shadow-card">
          <div
            className="pointer-events-none absolute inset-0 opacity-90"
            style={{ background: "radial-gradient(120% 140% at 100% 0%, rgba(138,109,74,0.16) 0%, transparent 55%)" }}
          />
          <div className="relative flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
            <div>
              <p className="text-sm font-medium text-muted-foreground">{greeting()} · {today}</p>
              <h1 className="mt-1 flex items-center gap-2 font-display text-3xl font-bold sm:text-4xl">
                Hi, {first}
                <motion.span
                  className="inline-flex"
                  animate={{ rotate: [0, 18, -10, 14, 0], scale: [1, 1.2, 1, 1.12, 1] }}
                  transition={{ duration: 1.8, repeat: Infinity, repeatDelay: 1.4, ease: "easeInOut" }}
                  style={{ transformOrigin: "60% 70%" }}
                >
                  <Sparkles weight="fill" className="h-7 w-7" style={{ color: "#c9971f" }} />
                </motion.span>
              </h1>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
                  <GraduationCap className="h-4 w-4" /> {data?.programme || stored?.programme || "—"}
                </span>
                <span className="inline-flex items-center rounded-full bg-muted px-3 py-1 text-sm font-medium text-muted-foreground">
                  {data?.registerNo || stored?.registerNo}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-5">
              {!loading && att && (
                <div className="flex flex-col items-center gap-1.5">
                  <div className="flex items-center gap-0.5 rounded-full bg-muted p-0.5 text-[10px] font-bold">
                    <motion.button
                      onClick={() => setWithLeave(false)}
                      whileTap={{ scale: 0.95 }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      className={`rounded-full px-2.5 py-1 transition-colors ${!withLeave ? "bg-joy text-white shadow-card" : "text-muted-foreground hover:bg-background/60"}`}
                    >
                      Excl. leave
                    </motion.button>
                    <motion.button
                      onClick={() => setWithLeave(true)}
                      whileTap={{ scale: 0.95 }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      className={`rounded-full px-2.5 py-1 transition-colors ${withLeave ? "bg-joy text-white shadow-card" : "text-muted-foreground hover:bg-background/60"}`}
                    >
                      Incl. leave
                    </motion.button>
                  </div>
                  <Ring value={ringValue} color={t.ring} />
                  <p className="max-w-[9.5rem] text-center text-[10.5px] leading-snug text-muted-foreground">
                    {att.totalPresent} present · {att.totalAbsent} absent · {att.totalLeave} on leave of {att.totalConducted}
                  </p>
                </div>
              )}
              <Link
                to="/attendanceDetails"
                className="hidden items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-soft transition hover:opacity-90 lg:inline-flex"
              >
                View attendance <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </Item>

      {/* ── KPI stats ── */}
      <Item>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            icon={TrendingUp} label="Overall attendance" value={att ? overall : "—"} suffix="%"
            hint={att ? (shortage ? "Below 75%" : "On track") : null}
            hintTone={att ? (shortage ? "bg-[#f7e7df] text-[#c5552f]" : "bg-[#e6f0e6] text-[#3f7a4b]") : null}
          />
          <StatCard icon={Layers} label="Subjects tracked" value={subjects.length || "—"} />
          <StatCard icon={Megaphone} label="Notifications" value={notifications.length}
            hint={notifications.length ? "New" : null} hintTone="bg-primary/10 text-primary" />
          <StatCard
            icon={shortage ? AlertTriangle : CheckCircle2}
            label="Standing"
            value={att ? (shortage ? "Review" : "Good") : "—"}
            hint={att ? (shortage ? "Shortage" : "Eligible") : null}
            hintTone={att ? (shortage ? "bg-[#f7e7df] text-[#c5552f]" : "bg-[#e6f0e6] text-[#3f7a4b]") : null}
          />
        </div>
      </Item>

      {/* Item always renders (never conditionally swapped) so its Stagger-inherited entrance
          plays once on mount — only the inner content of each card crossfades on `loading`. */}
      <Item className="grid gap-5 lg:grid-cols-3">
        {/* Attendance overview */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft lg:col-span-2">
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                <div className="mb-5 flex items-center justify-between">
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-48" />
                    <Skeleton className="h-3 w-36" />
                  </div>
                  <Skeleton className="h-4 w-16" />
                </div>
                <div className="flex h-[220px] items-end justify-between gap-3 px-2">
                  {[62, 88, 45, 75, 95, 58, 80, 68].map((h, i) => (
                    <Skeleton key={i} className="w-full rounded-t-lg" style={{ height: `${h}%` }} />
                  ))}
                </div>
              </motion.div>
            ) : (
              <motion.div key="content" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <h2 className="font-display text-lg font-bold">Attendance overview</h2>
                    <p className="text-sm text-muted-foreground">Subject-wise this semester</p>
                  </div>
                  <Link to="/attendanceDetails" className="text-sm font-semibold text-primary hover:underline">View all</Link>
                </div>

                {subjects.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 py-8 text-center">
                    <Info className="h-8 w-8 text-primary" />
                    <p className="text-sm text-muted-foreground">No attendance recorded yet.</p>
                  </div>
                ) : (
                  <AttendanceChart subjects={subjects} />
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Notifications */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft">
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                <div className="mb-5 flex items-center gap-2">
                  <Skeleton className="h-9 w-9 rounded-xl" />
                  <Skeleton className="h-5 w-32" />
                </div>
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex items-start gap-3 rounded-2xl border border-border bg-muted/40 p-3">
                      <Skeleton className="h-7 w-7 shrink-0 rounded-lg" />
                      <Skeleton className="h-4 w-full" />
                    </div>
                  ))}
                </div>
              </motion.div>
            ) : (
              <motion.div key="content" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                <div className="mb-5 flex items-center gap-2">
                  <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 text-primary">
                    <Bell className="h-4.5 w-4.5" />
                  </span>
                  <h2 className="font-display text-lg font-bold">Notifications</h2>
                </div>
                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 py-8 text-center">
                    <CheckCircle2 className="h-8 w-8 text-[#4f8a5b]" />
                    <p className="text-sm text-muted-foreground">You're all caught up.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {notifications.map((n) => (
                      <div key={n.id} className="flex items-start gap-3 rounded-2xl border border-border bg-muted/40 p-3">
                        <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                          <Megaphone className="h-3.5 w-3.5" />
                        </span>
                        <span className="text-sm leading-snug">{n.description}</span>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Item>

      {/* ── Pending Actions ── */}
      <Item>
        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft">
          <div className="mb-5 flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-300">
              <ListChecks className="h-4.5 w-4.5" />
            </span>
            <h2 className="font-display text-lg font-bold">Pending Actions</h2>
          </div>
          <AnimatePresence mode="wait">
            {pendingLoading ? (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-2xl border border-border bg-muted/40 p-3">
                    <Skeleton className="h-7 w-7 shrink-0 rounded-lg" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                ))}
              </motion.div>
            ) : pendingItems.length === 0 ? (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="flex flex-col items-center gap-2 py-8 text-center">
                <CheckCircle2 className="h-8 w-8 text-[#4f8a5b]" />
                <p className="text-sm text-muted-foreground">Nothing pending — you're all set.</p>
              </motion.div>
            ) : (
              <motion.div key="content" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="space-y-3">
                {pendingItems.map((it) => (
                  <Link
                    key={it.key}
                    to={it.to}
                    className="flex items-center gap-3 rounded-2xl border border-border bg-muted/40 p-3 transition hover:border-primary/40 hover:bg-muted/60"
                  >
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400">
                      <it.icon className="h-3.5 w-3.5" />
                    </span>
                    <span className="flex-1 text-sm leading-snug">{it.text}</span>
                    <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </Link>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Item>

      {/* ── Quick actions ── */}
      <Item>
        <h2 className="mb-3 font-display text-lg font-bold">Quick access</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {QUICK.map((q) => (
            <Link key={q.to} to={q.to}>
              <motion.div
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                className="group flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-soft transition-[color,background-color,border-color,box-shadow,filter] hover:border-primary/40 hover:shadow-card"
              >
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <q.icon className="h-5 w-5" />
                </span>
                <span className="truncate text-sm font-semibold">{q.label}</span>
              </motion.div>
            </Link>
          ))}
        </div>
      </Item>
    </Stagger>
  );
}
