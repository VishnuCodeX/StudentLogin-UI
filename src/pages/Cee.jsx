import { useEffect, useState } from "react";
import PageTitle from "@/components/PageTitle";
import { Loader2, AlertTriangle, RefreshCw, Award, Users, CalendarClock, Receipt, BookOpen } from "@/lib/icons";
import api, { unwrap } from "@/lib/api";
import { toast } from "@/lib/toast";
import { goToGateway, handlePaymentReturn } from "@/lib/payments";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const SEAT = {
  available: { label: "Available", cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300" },
  fast: { label: "Filling fast", cls: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300" },
  closed: { label: "Seats filled", cls: "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300" },
};

export default function Cee() {
  const [tab, setTab] = useState("apply");
  const [courses, setCourses] = useState(null);
  const [receipts, setReceipts] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(null);

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

      <div className="flex gap-2">
        {[["apply", "Apply", BookOpen], ["receipts", "Receipts", Receipt]].map(([id, label, Icon]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition ${
              tab === id ? "bg-joy text-white" : "bg-muted text-muted-foreground hover:bg-muted/70"
            }`}
          >
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
        (courses || []).length === 0 ? (
          <EmptyCard icon={Award} title="No courses open" text="There are no CEE/SEC courses open for application right now." />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {courses.map((c) => {
              const s = SEAT[c.seatStatus] || SEAT.available;
              const closed = c.seatStatus === "closed";
              return (
                <Card key={c.id}>
                  <CardContent className="flex h-full flex-col p-5">
                    <div className="mb-1 flex items-start justify-between gap-2">
                      <div>
                        <p className="font-display text-base font-bold">{c.name}</p>
                        {c.courseCode && <p className="text-xs text-muted-foreground">{c.courseCode}</p>}
                      </div>
                      <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${s.cls}`}>{s.label}</span>
                    </div>
                    {c.description && <p className="mb-3 text-sm text-muted-foreground line-clamp-2">{c.description}</p>}
                    <div className="mb-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      {c.maxIntake > 0 && (
                        <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {c.applied}/{c.maxIntake} seats</span>
                      )}
                      {(c.startDate || c.endDate) && (
                        <span className="flex items-center gap-1"><CalendarClock className="h-3.5 w-3.5" /> {c.startDate} – {c.endDate}</span>
                      )}
                    </div>
                    <div className="mt-auto">
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
        )
      ) : (receipts || []).length === 0 ? (
        <EmptyCard icon={Receipt} title="No receipts" text="Your paid CEE/SEC course receipts will appear here." />
      ) : (
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
      )}
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
