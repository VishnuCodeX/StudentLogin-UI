import { useEffect, useMemo, useState } from "react";
import PageTitle from "@/components/PageTitle";
import { Loader2, AlertTriangle, RefreshCw, CalendarDays, MapPin, Clock, Coffee, BookOpen } from "@/lib/icons";
import api, { unwrap } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const DAY_ORDER = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
// theme-friendly accent palette — one tone per slot, cycled by index
const ACCENTS = ["#8a6d4a", "#3f7a4b", "#9b6a2f", "#7a1f1f", "#5c8a86", "#92577a", "#456a9b"];

/* Vertical timeline of one day's classes. Entrance animation uses a mounted
   flag + CSS transitions (reliable under AppLayout's motion wrapper, where
   framer-motion / tailwindcss-animate `animate-in` left cards stuck at opacity 0).
   Parent passes key={day} so this remounts and the stagger replays per day. */
function DayTimeline({ list }) {
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const id = setTimeout(() => setShown(true), 60);
    return () => clearTimeout(id);
  }, []);
  return (
    <div className="relative">
      {list.map((s, i) => {
        const accent = ACCENTS[i % ACCENTS.length];
        const last = i === list.length - 1;
        const delay = `${i * 70}ms`;
        return (
          <div
            key={s.periodName + i}
            className="flex gap-3 sm:gap-4"
            style={{
              opacity: shown ? 1 : 0,
              transform: shown ? "translateY(0)" : "translateY(12px)",
              transition: `opacity .5s cubic-bezier(.22,1,.36,1) ${delay}, transform .5s cubic-bezier(.22,1,.36,1) ${delay}`,
            }}
          >
            {/* time column */}
            <div className="w-14 shrink-0 pt-2.5 text-right sm:w-16">
              <p className="text-sm font-bold tabular-nums leading-none">{s.startTime || s.periodName?.replace(/_/g, " ")}</p>
              {s.endTime && <p className="mt-1 text-[11px] tabular-nums text-muted-foreground">{s.endTime}</p>}
            </div>

            {/* rail */}
            <div className="flex flex-col items-center">
              <span className="z-10 mt-2.5 h-3.5 w-3.5 shrink-0 rounded-full" style={{ background: accent, boxShadow: `0 0 0 4px ${accent}22` }} />
              {!last && <span className="w-px flex-1 bg-border" />}
            </div>

            {/* class card */}
            <div
              className="mb-4 flex-1 overflow-hidden rounded-2xl border border-border bg-card p-3.5 shadow-soft transition-shadow hover:shadow-card"
              style={{ borderLeft: `4px solid ${accent}` }}
            >
              <div className="flex items-start gap-3">
                <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl text-white" style={{ background: accent }}>
                  <BookOpen className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold leading-tight">{s.subjectName || s.subjectCode}</p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px]">
                    {s.subjectCode && (
                      <span className="rounded-full px-2 py-0.5 font-bold" style={{ background: `${accent}1a`, color: accent }}>{s.subjectCode}</span>
                    )}
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <Clock className="h-3 w-3" /> {s.periodName?.replace(/_/g, " ")}
                    </span>
                    {s.room && (
                      <span className="flex items-center gap-1 text-muted-foreground"><MapPin className="h-3 w-3" /> {s.room}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function TimeTable() {
  const [slots, setSlots] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [active, setActive] = useState(null);

  function load() {
    setLoading(true);
    setError("");
    unwrap(api.get("/timetable/class"))
      .then(setSlots)
      .catch((e) => setError(e?.response?.data?.message || "Could not load your time table."))
      .finally(() => setLoading(false));
  }
  useEffect(load, []);

  // pivot the flat slot list into ordered periods + per-day class lists
  const { days, byDay } = useMemo(() => {
    const list = slots || [];
    const order = (s) => (s.startTime || "") + (s.periodName || "");
    const dayset = new Set(list.map((s) => s.dayName).filter(Boolean));
    const days = DAY_ORDER.filter((d) => dayset.has(d));
    const byDay = {};
    days.forEach((d) => {
      byDay[d] = list.filter((s) => s.dayName === d).sort((a, b) => order(a).localeCompare(order(b)));
    });
    return { days, byDay };
  }, [slots]);

  const todayName = DAY_ORDER[(new Date().getDay() + 6) % 7]; // JS Sun=0 → Mon-first index

  // default the selected day to today (if it has classes) else the first day
  useEffect(() => {
    if (!days.length) { setActive(null); return; }
    setActive((prev) => (prev && days.includes(prev) ? prev : (days.includes(todayName) ? todayName : days[0])));
  }, [days, todayName]);

  const hasData = days.length > 0;
  const list = (active && byDay[active]) || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <PageTitle icon={CalendarDays}>View My Time Table</PageTitle>
          <p className="text-sm text-muted-foreground">Your weekly class schedule, day by day.</p>
        </div>
        <Button variant="outline" size="sm" onClick={load}><RefreshCw className="h-4 w-4" /> Refresh</Button>
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
      ) : !hasData ? (
        <Card><CardContent className="flex flex-col items-center gap-3 py-16 text-center">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary"><CalendarDays className="h-7 w-7" /></span>
          <p className="font-display text-lg font-semibold">No time table found</p>
          <p className="max-w-sm text-sm text-muted-foreground">Your class time table hasn't been published yet.</p>
        </CardContent></Card>
      ) : (
        <>
          {/* day selector */}
          <div className="flex flex-wrap gap-2">
            {days.map((d) => {
              const isActive = d === active;
              const isToday = d === todayName;
              const count = byDay[d]?.length || 0;
              return (
                <button
                  key={d}
                  onClick={() => setActive(d)}
                  className={`group relative flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold transition-all ${
                    isActive ? "bg-joy text-white shadow-card" : "bg-muted text-muted-foreground hover:bg-muted/70"
                  }`}
                >
                  <span>{d.slice(0, 3)}</span>
                  <span className={`grid h-5 min-w-5 place-items-center rounded-full px-1 text-[11px] font-bold ${
                    isActive ? "bg-white/25 text-white" : "bg-foreground/10 text-foreground/70"
                  }`}>{count}</span>
                  {isToday && (
                    <span className={`absolute -top-1.5 -right-1 rounded-full px-1.5 py-px text-[9px] font-bold uppercase tracking-wide ${
                      isActive ? "bg-white text-[#7a1f1f]" : "bg-[#7a1f1f] text-white"
                    }`}>Today</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* timeline for the selected day */}
          <Card>
            <CardContent className="p-5 sm:p-6">
              <div className="mb-5 flex items-center gap-2">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 text-primary"><CalendarDays className="h-4.5 w-4.5" /></span>
                <div>
                  <p className="font-display text-base font-bold leading-none">{active}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{list.length} {list.length === 1 ? "class" : "classes"} scheduled</p>
                </div>
              </div>

              {list.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-12 text-center">
                  <span className="grid h-12 w-12 place-items-center rounded-2xl bg-muted text-muted-foreground"><Coffee className="h-6 w-6" /></span>
                  <p className="font-display text-base font-semibold">No classes</p>
                  <p className="text-sm text-muted-foreground">Enjoy your free day.</p>
                </div>
              ) : (
                // key={active} remounts on day change so the entrance animation replays
                <DayTimeline key={active} list={list} />
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
