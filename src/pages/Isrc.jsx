// Developed By: Vishnukarthick K

import { useEffect, useState } from "react";
import PageTitle from "@/components/PageTitle";
import { Loader2, AlertTriangle, RefreshCw, HeartHandshake, CheckCircle2, Users } from "@/lib/icons";
import api, { unwrap } from "@/lib/api";
import { toast } from "@/lib/toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const SEAT = {
  available: { label: "Available", cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300" },
  fast: { label: "Filling fast", cls: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300" },
  closed: { label: "Seats filled", cls: "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300" },
};

export default function Isrc() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [picked, setPicked] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  function load() {
    setLoading(true);
    setError("");
    unwrap(api.get("/isrc/status", { skipErrorToast: true }))
      .then((d) => { setData(d); setPicked(null); })
      .catch((e) => setError(e?.response?.data?.message || "Could not load ISRC details."))
      .finally(() => setLoading(false));
  }
  useEffect(load, []);

  async function submit() {
    if (!picked) { toast.warning("Please select one department."); return; }
    setSubmitting(true);
    try {
      const d = await unwrap(api.post("/isrc/register", { departmentId: picked }));
      setData(d);
      toast.success("Registered successfully!");
    } catch {
      // error snackbar shown globally
    } finally {
      setSubmitting(false);
    }
  }

  const departments = data?.departments || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <PageTitle icon={HeartHandshake}>ISRC Registration</PageTitle>
          <p className="text-sm text-muted-foreground">Institutional Social Responsibility Cell — choose one department.</p>
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
      ) : data?.registered ? (
        <Card><CardContent className="flex flex-col items-center gap-3 py-16 text-center">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20">
            <CheckCircle2 className="h-7 w-7" />
          </span>
          <p className="font-display text-lg font-semibold">Thank you for registering! 🎉</p>
          <p className="text-sm text-muted-foreground">You are registered with</p>
          <p className="rounded-full bg-amber-100 px-4 py-1.5 font-semibold text-amber-700 dark:bg-amber-500/20 dark:text-amber-300">
            {data.registeredDepartment || "your selected department"}
          </p>
        </CardContent></Card>
      ) : departments.length === 0 ? (
        <Card><CardContent className="flex flex-col items-center gap-3 py-16 text-center">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-amber-100 text-amber-600 dark:bg-amber-500/20">
            <HeartHandshake className="h-7 w-7" />
          </span>
          <p className="font-display text-lg font-semibold">Registration is not open</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            There are no ISRC departments open for your class right now. Please check back during the registration window.
          </p>
        </CardContent></Card>
      ) : (
        <>
          <div className="rounded-2xl border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
            Choose <b>one</b> department. Registration is open for a limited window and seats are limited.
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {departments.map((d) => {
              const s = SEAT[d.seatStatus] || SEAT.available;
              const disabled = d.seatStatus === "closed";
              const active = picked === d.id;
              return (
                <button
                  key={d.id}
                  type="button"
                  disabled={disabled}
                  onClick={() => setPicked(d.id)}
                  className={`rounded-2xl border p-4 text-left transition ${
                    active ? "border-amber-500 ring-2 ring-amber-500/40" : "border-border hover:border-amber-300"
                  } ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
                >
                  <div className="mb-1 flex items-start justify-between gap-2">
                    <p className="font-display font-bold">{d.name}</p>
                    <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${s.cls}`}>{s.label}</span>
                  </div>
                  {d.description && <p className="mb-2 text-xs text-muted-foreground">{d.description}</p>}
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Users className="h-3.5 w-3.5" />
                    <span><b className="text-foreground">{d.applied}</b> / {d.seats} seats filled</span>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-3">
            <Button onClick={submit} disabled={!picked || submitting} className="bg-joy text-white">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <HeartHandshake className="h-4 w-4" />}
              Proceed
            </Button>
            {picked && <span className="text-sm text-muted-foreground">1 department selected</span>}
          </div>
        </>
      )}
    </div>
  );
}
