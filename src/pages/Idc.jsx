import { useEffect, useMemo, useState } from "react";
import PageTitle from "@/components/PageTitle";
import { Loader2, AlertTriangle, RefreshCw, GraduationCap, Users, MapPin, Search, BookOpen, ListChecks } from "@/lib/icons";
import api, { unwrap } from "@/lib/api";
import { toast } from "@/lib/toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const SEAT = {
  available: { label: "Available", cls: "bg-emerald-100 text-emerald-700" },
  fast: { label: "Filling fast", cls: "bg-amber-100 text-amber-700" },
  closed: { label: "Full", cls: "bg-rose-100 text-rose-700" },
};
const CAP = 48;

export default function Idc() {
  const [tab, setTab] = useState("apply");
  const [courses, setCourses] = useState(null);
  const [apps, setApps] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(null);
  const [q, setQ] = useState("");

  function load() {
    setLoading(true); setError("");
    Promise.all([
      unwrap(api.get("/idc/available", { skipErrorToast: true })),
      unwrap(api.get("/idc/applications", { skipErrorToast: true })),
    ])
      .then(([c, a]) => { setCourses(c); setApps(a); })
      .catch((e) => setError(e?.response?.data?.message || "Could not load courses."))
      .finally(() => setLoading(false));
  }
  useEffect(load, []);

  async function apply(id) {
    setBusy(id);
    try {
      const msg = await unwrap(api.post(`/idc/${id}/apply`));
      toast.info(typeof msg === "string" ? msg : "Application recorded.");
      load();
    } catch {
      // error snackbar shown globally
    } finally { setBusy(null); }
  }

  const filtered = useMemo(() => {
    const list = courses || [];
    const term = q.trim().toLowerCase();
    if (!term) return list;
    return list.filter((c) =>
      [c.name, c.subjectName, c.subjectCode, c.venue].filter(Boolean).join(" ").toLowerCase().includes(term)
    );
  }, [courses, q]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <PageTitle icon={GraduationCap}>Inter / Multi-disciplinary Course</PageTitle>
          <p className="text-sm text-muted-foreground">Apply for an inter-disciplinary / multi-disciplinary course.</p>
        </div>
        <Button variant="outline" size="sm" onClick={load}><RefreshCw className="h-4 w-4" /> Refresh</Button>
      </div>

      <div className="flex gap-2">
        {[["apply", "Apply", BookOpen], ["mine", "My Applications", ListChecks]].map(([id, label, Icon]) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition ${
              tab === id ? "bg-joy text-white" : "bg-muted text-muted-foreground hover:bg-muted/70"}`}>
            <Icon className="h-4 w-4" /> {label}
          </button>
        ))}
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
      ) : tab === "apply" ? (
        <>
          <div className="relative max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search courses, subjects, venue…"
              className="h-11 w-full rounded-xl border border-input bg-card pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <p className="text-xs text-muted-foreground">
            {filtered.length} course{filtered.length !== 1 ? "s" : ""}{filtered.length > CAP ? ` · showing first ${CAP}, refine your search` : ""}
          </p>

          {filtered.length === 0 ? (
            <EmptyCard title="No courses found" text="Try a different search term, or check back when applications open." />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {filtered.slice(0, CAP).map((c) => {
                const s = SEAT[c.seatStatus] || SEAT.available;
                const closed = c.seatStatus === "closed";
                return (
                  <Card key={c.id}>
                    <CardContent className="flex h-full flex-col p-5">
                      <div className="mb-1 flex items-start justify-between gap-2">
                        <p className="font-display text-base font-bold leading-tight">{c.name}</p>
                        <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${s.cls}`}>{s.label}</span>
                      </div>
                      <div className="mb-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                        {c.subjectName && <span>{c.subjectName}</span>}
                        {c.venue && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {c.venue}</span>}
                        {c.maxIntake > 0 && <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {c.applied}/{c.maxIntake}</span>}
                        <span className="rounded bg-muted px-1.5 py-0.5 font-semibold">{c.pg ? "PG" : "UG"}</span>
                      </div>
                      <div className="mt-auto flex items-end justify-between gap-3">
                        <p className="font-display text-xl font-bold">{c.amount != null ? `₹${c.amount}` : "Free"}</p>
                        <Button onClick={() => apply(c.id)} disabled={closed || busy === c.id} className="bg-joy text-white">
                          {busy === c.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <GraduationCap className="h-4 w-4" />} Apply
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      ) : (apps || []).length === 0 ? (
        <EmptyCard title="No applications yet" text="Courses you apply for will appear here with their payment status." />
      ) : (
        <div className="space-y-3">
          {apps.map((a) => (
            <Card key={a.id}>
              <CardContent className="flex items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <p className="truncate font-semibold">{a.courseName}</p>
                  <p className="text-xs text-muted-foreground">{a.transactionDate || ""}</p>
                </div>
                <div className="flex items-center gap-3">
                  {a.feeAmount != null && <span className="font-display text-lg font-bold">₹{a.feeAmount}</span>}
                  <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                    /pend/i.test(a.status) ? "bg-amber-100 text-amber-700"
                    : /fail/i.test(a.status) ? "bg-rose-100 text-rose-700"
                    : "bg-emerald-100 text-emerald-700"}`}>{a.status}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyCard({ title, text }) {
  return (
    <Card><CardContent className="flex flex-col items-center gap-3 py-16 text-center">
      <span className="grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary"><GraduationCap className="h-7 w-7" /></span>
      <p className="font-display text-lg font-semibold">{title}</p>
      <p className="max-w-sm text-sm text-muted-foreground">{text}</p>
    </CardContent></Card>
  );
}
