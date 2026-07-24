// Developed By: Vishnukarthick K

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import PageTitle from "@/components/PageTitle";
import { Loader2, AlertTriangle, RefreshCw, Award, Users, CalendarClock, Receipt, BookOpen, Search } from "@/lib/icons";
import api, { unwrap } from "@/lib/api";
import { toast } from "@/lib/toast";
import { confirm } from "@/lib/confirm";
import { goToGateway, handlePaymentReturn } from "@/lib/payments";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SkeletonGrid } from "@/components/ui/skeleton";

const SEAT = {
  available: { label: "Available", cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300" },
  fast: { label: "Filling fast", cls: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300" },
  closed: { label: "Seats filled", cls: "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300" },
};

const SEAT_FILTERS = [
  { key: "all", label: "All", cls: "bg-joy text-white" },
  { key: "available", label: "Available", cls: "bg-emerald-600 text-white" },
  { key: "fast", label: "Filling fast", cls: "bg-amber-500 text-white" },
  { key: "closed", label: "Seats Filled", cls: "bg-rose-600 text-white" },
];

export default function Cee() {
  const [tab, setTab] = useState("apply");
  const [courses, setCourses] = useState(null);
  const [receipts, setReceipts] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(null);
  const [search, setSearch] = useState("");
  const [seatFilter, setSeatFilter] = useState("all");

  const filteredCourses = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (courses || []).filter((c) => {
      if (seatFilter !== "all" && c.seatStatus !== seatFilter) return false;
      if (q && !c.name?.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [courses, search, seatFilter]);

  function load() {
    setLoading(true);
    setError("");
    Promise.all([
      unwrap(api.get("/cee/available", { skipErrorToast: true })),
      unwrap(api.get("/cee/receipts", { skipErrorToast: true })),
    ])
      .then(([c, r]) => { setCourses(c); setReceipts(r); })
      .catch((e) => setError(e?.response?.data?.message || "Could not load CEE."))
      .finally(() => setLoading(false));
  }
  useEffect(load, []);
  useEffect(() => { handlePaymentReturn() === "success" && load(); }, []);

  // Apply + pay in one step: the backend records the (unpaid) row and hands off to UCO Bank.
  async function apply(id) {
    setBusy(id);
    try {
      const res = await unwrap(api.post(`/cee/${id}/pay`));
      const course = (courses || []).find((c) => c.id === id);
      const ok = await confirm({
        title: "Confirm payment",
        message: `Proceed to pay ₹${course?.amount} for ${course?.name}?`,
        confirmText: "Proceed",
        cancelText: "Cancel",
      });
      if (!ok) return;
      if (!goToGateway(res)) load();
    } catch {
      // error snackbar shown globally
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <PageTitle icon={Award}>CEE / SEC</PageTitle>
          <p className="text-sm text-muted-foreground">Apply for certificate / skill-enhancement courses and view receipts.</p>
        </div>
        <Button variant="outline" size="sm" onClick={load}><RefreshCw className="h-4 w-4" /> Refresh</Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {[["apply", "Apply", BookOpen], ["receipts", "Receipts", Receipt]].map(([id, label, Icon]) => (
          <motion.button
            key={id}
            onClick={() => setTab(id)}
            whileTap={{ scale: 0.96 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
              tab === id ? "bg-joy text-white" : "bg-muted text-muted-foreground hover:bg-muted/70"
            }`}
          >
            <Icon className="h-4 w-4" /> {label}
          </motion.button>
        ))}
      </div>

      <AnimatePresence mode="wait">
      {loading ? (
        <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
        <SkeletonGrid items={4} />
        </motion.div>
      ) : error ? (
        <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
        <Card><CardContent className="flex flex-col items-center gap-3 py-14 text-center">
          <AlertTriangle className="h-8 w-8 text-destructive" /><p className="font-medium">{error}</p>
          <Button variant="outline" onClick={load}><RefreshCw className="h-4 w-4" /> Retry</Button>
        </CardContent></Card>
        </motion.div>
      ) : tab === "apply" ? (
        <motion.div key="apply" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative sm:max-w-xs sm:flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by course name…"
                className="h-10 w-full rounded-xl border border-input bg-background pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {SEAT_FILTERS.map((f) => (
                <motion.button
                  key={f.key}
                  onClick={() => setSeatFilter(f.key)}
                  whileTap={{ scale: 0.96 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                    seatFilter === f.key ? f.cls : "bg-muted text-muted-foreground hover:bg-muted/70"
                  }`}
                >
                  {f.label}
                </motion.button>
              ))}
            </div>
          </div>

          {(courses || []).length === 0 ? (
            <EmptyCard icon={Award} title="No courses open" text="There are no CEE/SEC courses open for application right now." />
          ) : filteredCourses.length === 0 ? (
            <EmptyCard icon={Search} title="No matches" text="No courses match your search or filter — try clearing them." />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {filteredCourses.map((c) => {
                const s = SEAT[c.seatStatus] || SEAT.available;
                const closed = c.seatStatus === "closed";
                return (
                  <Card
                    key={c.id}
                    className="transition-[transform,box-shadow] duration-200 hover:-translate-y-1 hover:shadow-pop"
                  >
                    <CardContent className="flex h-full flex-col p-5">
                      <div className="mb-1 flex items-start justify-between gap-2">
                        <div>
                          <p className="font-display text-base font-bold">{c.name}</p>
                          {c.courseCode && <p className="text-xs text-muted-foreground">{c.courseCode}</p>}
                        </div>
                        <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${s.cls}`}>{s.label}</span>
                      </div>
                      {c.description && <p className="mb-3 text-sm text-muted-foreground line-clamp-2">{c.description}</p>}
                      <div className="mb-3 flex flex-wrap items-start gap-x-4 gap-y-2 text-xs text-muted-foreground">
                        {c.maxIntake > 0 && (
                          <div className="flex min-w-[110px] flex-1 flex-col gap-1 sm:min-w-[140px]">
                            <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {c.applied}/{c.maxIntake} seats</span>
                            <CapacityBar value={(c.applied / c.maxIntake) * 100} colorCls={(SEAT_FILTERS.find((f) => f.key === c.seatStatus) || SEAT_FILTERS[1]).cls} />
                          </div>
                        )}
                        {(c.startDate || c.endDate) && (
                          <span className="flex items-center gap-1"><CalendarClock className="h-3.5 w-3.5" /> {c.startDate} – {c.endDate}</span>
                        )}
                      </div>
                      <div className="mt-auto flex items-center justify-between gap-3">
                        {c.amount != null && <span className="font-display text-lg font-bold">₹{c.amount}</span>}
                        <Button onClick={() => apply(c.id)} disabled={closed || busy === c.id} className="bg-joy text-white">
                          {busy === c.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Award className="h-4 w-4" />}
                          Apply
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
        </motion.div>
      ) : (receipts || []).length === 0 ? (
        <motion.div key="receipts-empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
        <EmptyCard icon={Receipt} title="No receipts" text="Your paid CEE/SEC course receipts will appear here." />
        </motion.div>
      ) : (
        <motion.div key="receipts" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
        <div className="space-y-3">
          {receipts.map((r) => (
            <Card key={r.id}>
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
          ))}
        </div>
        </motion.div>
      )}
      </AnimatePresence>
    </div>
  );
}

function CapacityBar({ value, colorCls }) {
  const [grown, setGrown] = useState(false);
  useEffect(() => { const t = setTimeout(() => setGrown(true), 60); return () => clearTimeout(t); }, []);
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
      <div
        className={`h-full rounded-full ${colorCls}`}
        style={{ width: grown ? `${pct}%` : "0%", transition: "width 0.9s cubic-bezier(.22,1,.36,1)" }}
      />
    </div>
  );
}

function EmptyCard({ icon: Icon, title, text }) {
  return (
    <Card><CardContent className="flex flex-col items-center gap-3 py-16 text-center">
      <span className="grid h-14 w-14 place-items-center rounded-2xl bg-amber-100 text-amber-600 dark:bg-amber-500/20">
        <Icon className="h-7 w-7" />
      </span>
      <p className="font-display text-lg font-semibold">{title}</p>
      <p className="max-w-sm text-sm text-muted-foreground">{text}</p>
    </CardContent></Card>
  );
}
