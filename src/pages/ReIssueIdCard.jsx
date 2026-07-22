// Developed By: Vishnukarthick K

import { useEffect, useState } from "react";
import PageTitle from "@/components/PageTitle";
import { Loader2, AlertTriangle, RefreshCw, CreditCard, Send, CheckCircle2, Clock } from "@/lib/icons";
import api, { unwrap } from "@/lib/api";
import { toast } from "@/lib/toast";
import { goToGateway, handlePaymentReturn } from "@/lib/payments";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

function StatusBadge({ status }) {
  const map = {
    CONFIRMED: ["bg-success/15 text-success", CheckCircle2],
    PAID: ["bg-blue-500/15 text-blue-600 dark:text-blue-400", CheckCircle2],
    APPLIED: ["bg-amber-500/15 text-amber-600 dark:text-amber-400", Clock],
  };
  const [cls, Icon] = map[status] || map.APPLIED;
  return <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${cls}`}><Icon className="h-3 w-3" /> {status}</span>;
}

export default function ReIssueIdCard() {
  const [list, setList] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [paying, setPaying] = useState(null);

  async function payFee(id) {
    setPaying(id);
    try {
      const res = await unwrap(api.post(`/idcard/${id}/pay`, {}, { skipErrorToast: true }));
      if (!goToGateway(res)) load();
    } catch {
      /* global toast */
    } finally { setPaying(null); }
  }

  function load() {
    setLoading(true);
    setError("");
    unwrap(api.get("/idcard/status", { skipErrorToast: true }))
      .then(setList)
      .catch((e) => setError(e?.response?.data?.message || "Could not load your requests."))
      .finally(() => setLoading(false));
  }
  useEffect(load, []);
  useEffect(() => { handlePaymentReturn(); }, []);

  async function submit(e) {
    e.preventDefault();
    if (!reason.trim()) { toast.warning("Please provide a reason."); return; }
    setSubmitting(true);
    try {
      await api.post("/idcard/apply", { reason });
      toast.success("Your re-issue request has been submitted.");
      setReason("");
      load();
    } catch {
      // error snackbar shown globally
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageTitle icon={CreditCard}>Re-Issue ID Card</PageTitle>

      {/* Apply form */}
      <Card>
        <CardHeader><CardTitle>Request a new ID card</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            <div>
              <Label className="mb-1.5 block">Reason for re-issue</Label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                placeholder="e.g. Lost / Damaged / Name correction…"
                className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="flex items-center gap-2 rounded-xl bg-muted/60 px-4 py-3 text-xs text-muted-foreground">
              <CreditCard className="h-4 w-4 shrink-0" />
              A re-issue fee of ₹100 applies and is payable after the request is submitted.
            </div>
            <Button type="submit" variant="gradient" disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {submitting ? "Submitting…" : "Submit Request"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Requests list */}
      {loading ? (
        <div className="flex h-40 items-center justify-center text-muted-foreground"><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading…</div>
      ) : error ? (
        <Card><CardContent className="flex flex-col items-center gap-3 py-12 text-center">
          <AlertTriangle className="h-8 w-8 text-destructive" /><p className="font-medium">{error}</p>
          <Button variant="outline" onClick={load}><RefreshCw className="h-4 w-4" /> Retry</Button>
        </CardContent></Card>
      ) : (
        <Card>
          <CardHeader><CardTitle>My Requests</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {(list || []).length === 0 && <p className="py-4 text-sm text-muted-foreground">You have no re-issue requests yet.</p>}
            {(list || []).map((r) => (
              <div key={r.id} className="flex items-center gap-3 rounded-2xl border border-border p-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-fuchsia-400 to-purple-600 text-white"><CreditCard className="h-5 w-5" /></span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{r.reason || "ID Card Re-Issue"}</p>
                  <p className="text-xs text-muted-foreground">
                    {r.appliedDate} {r.regAmount && `· ₹${r.regAmount}`} {r.paid ? "· Paid" : "· Payment pending"}
                  </p>
                </div>
                {!r.paid ? (
                  <Button size="sm" variant="gradient" disabled={paying === r.id} onClick={() => payFee(r.id)}>
                    {paying === r.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />} Pay ₹{r.regAmount}
                  </Button>
                ) : (
                  <StatusBadge status={r.status} />
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
