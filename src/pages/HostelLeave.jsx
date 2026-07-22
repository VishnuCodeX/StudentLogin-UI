// Developed By: Vishnukarthick K

import { useEffect, useState } from "react";
import PageTitle from "@/components/PageTitle";
import { Loader2, AlertTriangle, RefreshCw, Home, CalendarDays, Send, X, BedDouble } from "@/lib/icons";
import api, { unwrap } from "@/lib/api";
import { toast } from "@/lib/toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const SESSIONS = ["Morning", "Evening"];

function statusPill(s) {
  const map = {
    Approved: "bg-emerald-100 text-emerald-700",
    Pending: "bg-amber-100 text-amber-700",
    Rejected: "bg-rose-100 text-rose-700",
    Cancelled: "bg-muted text-muted-foreground",
  };
  return map[s] || "bg-muted text-muted-foreground";
}

export default function HostelLeave() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    leaveTypeId: "", fromDate: "", toDate: "", fromSession: "Morning", toSession: "Evening", reason: "",
  });

  function load() {
    setLoading(true);
    setError("");
    unwrap(api.get("/hostel-leave", { skipErrorToast: true }))
      .then(setData)
      .catch((e) => setError(e?.response?.data?.message || "Could not load hostel leave."))
      .finally(() => setLoading(false));
  }
  useEffect(load, []);

  function set(k, v) { setForm((f) => ({ ...f, [k]: v })); }

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      const d = await unwrap(api.post("/hostel-leave/apply", { ...form, leaveTypeId: Number(form.leaveTypeId) }));
      setData(d);
      setForm((f) => ({ ...f, reason: "", fromDate: "", toDate: "" }));
      toast.success("Leave applied successfully.");
    } catch {
      // error snackbar shown globally
    } finally { setBusy(false); }
  }

  async function cancel(id) {
    try {
      const d = await unwrap(api.post(`/hostel-leave/${id}/cancel`));
      setData(d);
      toast.success("Leave cancelled.");
    } catch {
      // error snackbar shown globally
    }
  }

  const leaves = data?.leaves || [];
  const types = data?.leaveTypes || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <PageTitle icon={Home}>Hostel Leave</PageTitle>
          <p className="text-sm text-muted-foreground">Apply for leave from the hostel and track your requests.</p>
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
      ) : !data?.hasHostel ? (
        <Card><CardContent className="flex flex-col items-center gap-3 py-16 text-center">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-muted text-muted-foreground"><Home className="h-7 w-7" /></span>
          <p className="font-display text-lg font-semibold">No active hostel admission</p>
          <p className="max-w-sm text-sm text-muted-foreground">Hostel leave is available only to checked-in resident students.</p>
        </CardContent></Card>
      ) : (
        <>
          {/* residence summary */}
          <div className="grid gap-3 sm:grid-cols-3">
            {[["Hostel", data.hostelName, Home], ["Room", data.roomName, BedDouble], ["Bed", data.bedNo, BedDouble]].map(([label, val, Icon]) => (
              <div key={label} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary"><Icon className="h-5 w-5" /></span>
                <div><p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p><p className="font-semibold">{val || "—"}</p></div>
              </div>
            ))}
          </div>

          {/* apply form */}
          <Card>
            <CardContent className="p-6">
              <h2 className="mb-4 font-display text-lg font-bold">Apply for leave</h2>
              <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
                <Field label="Leave type">
                  <select required value={form.leaveTypeId} onChange={(e) => set("leaveTypeId", e.target.value)}
                    className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring">
                    <option value="">Select…</option>
                    {types.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </Field>
                <div className="hidden sm:block" />
                <Field label="Leave from">
                  <div className="flex gap-2">
                    <input type="date" required value={form.fromDate} onChange={(e) => set("fromDate", e.target.value)}
                      className="flex-1 rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring" />
                    <SessionSelect value={form.fromSession} onChange={(v) => set("fromSession", v)} />
                  </div>
                </Field>
                <Field label="Leave to">
                  <div className="flex gap-2">
                    <input type="date" required value={form.toDate} onChange={(e) => set("toDate", e.target.value)}
                      className="flex-1 rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring" />
                    <SessionSelect value={form.toSession} onChange={(v) => set("toSession", v)} />
                  </div>
                </Field>
                <Field label="Reason" full>
                  <textarea required rows={3} value={form.reason} onChange={(e) => set("reason", e.target.value)}
                    placeholder="Reason for leave…"
                    className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring" />
                </Field>
                <div className="sm:col-span-2">
                  <Button type="submit" disabled={busy} className="bg-joy text-white">
                    {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Submit application
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* history */}
          <Card>
            <CardContent className="p-0">
              <div className="flex items-center gap-2 px-6 py-4">
                <CalendarDays className="h-4 w-4 text-primary" />
                <h2 className="font-display text-lg font-bold">My leave requests</h2>
              </div>
              {leaves.length === 0 ? (
                <p className="px-6 pb-6 text-sm text-muted-foreground">No leave requests yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-y border-border bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                        <th className="px-6 py-3 font-semibold">Type</th>
                        <th className="px-3 py-3 font-semibold">From</th>
                        <th className="px-3 py-3 font-semibold">To</th>
                        <th className="px-3 py-3 text-center font-semibold">Status</th>
                        <th className="px-6 py-3 text-right font-semibold"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {leaves.map((l) => (
                        <tr key={l.id} className="border-b border-border last:border-0">
                          <td className="px-6 py-3">
                            <p className="font-medium">{l.leaveType || "Leave"}</p>
                            {l.reason && <p className="max-w-xs truncate text-xs text-muted-foreground">{l.reason}</p>}
                          </td>
                          <td className="px-3 py-3 tabular-nums">{l.fromDate} <span className="text-xs text-muted-foreground">{l.fromSession}</span></td>
                          <td className="px-3 py-3 tabular-nums">{l.toDate} <span className="text-xs text-muted-foreground">{l.toSession}</span></td>
                          <td className="px-3 py-3 text-center">
                            <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${statusPill(l.status)}`}>{l.status}</span>
                          </td>
                          <td className="px-6 py-3 text-right">
                            {l.status !== "Cancelled" && l.status !== "Rejected" && (
                              <button onClick={() => cancel(l.id)} className="inline-flex items-center gap-1 text-xs font-semibold text-destructive hover:underline">
                                <X className="h-3.5 w-3.5" /> Cancel
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function Field({ label, children, full }) {
  return (
    <div className={full ? "sm:col-span-2" : ""}>
      <label className="mb-1.5 block text-sm font-semibold text-foreground/80">{label}</label>
      {children}
    </div>
  );
}

function SessionSelect({ value, onChange }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)}
      className="rounded-xl border border-input bg-background px-2 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring">
      {SESSIONS.map((s) => <option key={s} value={s}>{s}</option>)}
    </select>
  );
}
